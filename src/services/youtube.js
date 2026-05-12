const { spawn } = require("child_process")
const yts = require("yt-search")
const { cfg } = require("../config")
const { extractYouTubeId } = require("../utils/format")
const { getCookiesArgs } = require("../voice/stream")

async function searchYouTube(query) {
    return yts(query)
}

async function getVideoInfo(videoIdOrUrl) {
    const id = videoIdOrUrl.length === 11 ? videoIdOrUrl : extractYouTubeId(videoIdOrUrl)
    if (!id) return null
    const r = await yts({ videoId: id })
    return r
}

function getPlaylistVideos(url) {
    return new Promise((resolve, reject) => {
        const proc = spawn(cfg.ytdlp, [
            "--flat-playlist", "--get-id", "--get-title",
            ...getCookiesArgs(), url
        ])
        let output = "", errOut = ""
        proc.stdout.on("data", d => output += d.toString())
        proc.stderr.on("data", d => errOut += d.toString())
        proc.on("close", code => {
            if (code !== 0) return reject(new Error("yt-dlp playlist failed: " + errOut))
            const lines = output.trim().split("\n")
            const videos = []
            for (let i = 0; i < lines.length; i += 2) {
                if (lines[i] && lines[i + 1]) {
                    videos.push({
                        title: lines[i].trim(),
                        url: `https://www.youtube.com/watch?v=${lines[i + 1].trim()}`
                    })
                }
            }
            resolve(videos)
        })
        proc.on("error", reject)
    })
}

function getYouTubeRelated(videoUrl) {
    return new Promise((resolve, reject) => {
        const id = extractYouTubeId(videoUrl)
        if (!id) return reject(new Error("Invalid YouTube URL"))
        const proc = spawn(cfg.ytdlp, [
            "--flat-playlist",
            "--print", "%(id)s %(title)s",
            ...getCookiesArgs(),
            `https://www.youtube.com/watch?v=${id}&list=RD${id}`
        ])
        let output = ""
        proc.stdout.on("data", d => output += d.toString())
        proc.on("close", () => {
            const lines = output.trim().split("\n").filter(Boolean)
            const videos = []
            for (const line of lines) {
                const idx = line.indexOf(" ")
                if (idx === -1) continue
                const vid = line.slice(0, idx).trim()
                const title = line.slice(idx + 1).trim()
                if (vid && title && vid.length === 11) {
                    videos.push({ title, url: `https://www.youtube.com/watch?v=${vid}` })
                }
            }
            if (videos.length) resolve(videos)
            else reject(new Error("Tidak ada related"))
        })
        proc.on("error", reject)
    })
}

module.exports = { searchYouTube, getVideoInfo, getPlaylistVideos, getYouTubeRelated }
