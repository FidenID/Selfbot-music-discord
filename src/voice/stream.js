const { spawn } = require("child_process")
const fs = require("fs")
const ffmpegStatic = require("ffmpeg-static")
const { cfg } = require("../config")
const { log } = require("../logger")
const { isTikTok, isYouTube } = require("../utils/format")

const FFMPEG = process.platform === "win32" ? ffmpegStatic : "ffmpeg"

const FILTERS = {
    none: null,
    bassboost: "bass=g=15,dynaudnorm=f=200",
    nightcore: "asetrate=48000*1.25,aresample=48000,atempo=1.06",
    slowed: "asetrate=48000*0.85,aresample=48000,atempo=1.05",
    vaporwave: "asetrate=48000*0.8,aresample=48000,atempo=1.1",
    "8d": "apulsator=hz=0.09",
    karaoke: "stereotools=mlev=0.015625",
    treble: "treble=g=10",
    earrape: "acrusher=.1:1:64:0:log",
    pitch_up: "asetrate=48000*1.15,aresample=48000",
    pitch_down: "asetrate=48000*0.9,aresample=48000"
}

function getCookiesArgs(url = "") {
    if (isYouTube(url)) return [] // YT cookies kadang malah error, biarkan kosong
    return fs.existsSync(cfg.cookiesFile) ? ["--cookies", cfg.cookiesFile] : []
}

function getFormatArgs(url) {
    if (isTikTok(url)) {
        return ["-f", "bestaudio/best", "--extractor-args",
            "tiktok:api_hostname=api16-normal-c-useast1a.tiktokv.com"]
    }
    return ["-f", "bestaudio"]
}

function buildFilterChain(queue) {
    const chain = []
    const filterDef = FILTERS[queue.filter]
    if (filterDef) chain.push(filterDef)
    if (queue.speed && queue.speed !== 1) {
        // atempo only supports 0.5..2.0; chain if needed
        let s = queue.speed
        while (s > 2.0) { chain.push("atempo=2.0"); s /= 2.0 }
        while (s < 0.5) { chain.push("atempo=0.5"); s *= 2.0 }
        chain.push(`atempo=${s}`)
    }
    return chain.join(",")
}

function killProcesses(procs) {
    if (!procs) return
    try { procs.ytdlp?.kill("SIGKILL") } catch {}
    try { procs.ff?.kill("SIGKILL") } catch {}
}

function createStream(url, opts = {}) {
    const { seek = 0, queue = null } = opts
    const ytdlpProc = spawn(cfg.ytdlp, [
        ...getFormatArgs(url),
        ...getCookiesArgs(url),
        "--no-playlist",
        "--no-part",
        "--hls-use-mpegts",
        "-o", "-",
        url
    ])

    const ffArgs = []
    if (seek > 0) ffArgs.push("-ss", String(seek))
    ffArgs.push("-probesize", "32768", "-analyzeduration", "0", "-i", "pipe:0")

    const filterChain = queue ? buildFilterChain(queue) : ""
    if (filterChain) ffArgs.push("-af", filterChain)

    ffArgs.push("-f", "opus", "-ar", "48000", "-ac", "2", "-loglevel", "error", "pipe:1")

    const ffProc = spawn(FFMPEG, ffArgs)
    ytdlpProc.stdout.pipe(ffProc.stdin)
    ffProc.stdin.on("error", err => { if (err.code !== "EPIPE") log("error", "ffmpeg stdin:", err.message) })

    ytdlpProc.stderr.on("data", d => {
        const m = d.toString().trim()
        if (m && !m.includes("[download]")) log("warn", "yt-dlp:", m)
    })
    ytdlpProc.on("error", err => log("error", "yt-dlp proc:", err.message))
    ffProc.on("error", err => log("error", "ffmpeg proc:", err.message))
    ytdlpProc.on("close", c => { if (c && c !== 0) log("warn", "yt-dlp exit:", c) })
    ffProc.on("close", c => { if (c && c !== 0 && c !== 255) log("warn", "ffmpeg exit:", c) })

    const stream = ffProc.stdout
    stream.processes = { ytdlp: ytdlpProc, ff: ffProc }
    return stream
}

function createRadioStream(url) {
    const ff = spawn(FFMPEG, [
        "-reconnect", "1",
        "-reconnect_streamed", "1",
        "-reconnect_delay_max", "5",
        "-i", url,
        "-vn", "-f", "opus",
        "-ar", "48000", "-ac", "2",
        "-b:a", "128k",
        "-loglevel", "error",
        "pipe:1"
    ], { stdio: ["ignore", "pipe", "pipe"] })
    ff.stderr.on("data", d => {
        const m = d.toString().trim()
        if (m) log("warn", "[radio] ffmpeg:", m)
    })
    ff.on("close", c => { if (c && c !== 0 && c !== 255) log("warn", "[radio] exit:", c) })
    ff.on("error", err => log("error", "[radio] error:", err.message))
    return ff
}

module.exports = { FILTERS, createStream, createRadioStream, killProcesses, getCookiesArgs, getFormatArgs }
