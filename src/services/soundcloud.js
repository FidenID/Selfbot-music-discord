const { spawn } = require("child_process")
const { cfg } = require("../config")
const { getCookiesArgs } = require("../voice/stream")

function getSoundCloudInfo(url) {
    return new Promise(resolve => {
        const proc = spawn(cfg.ytdlp, [
            "--print", "%(title)s|||%(duration)s",
            "--no-playlist",
            ...getCookiesArgs(),
            url
        ])
        let out = ""
        proc.stdout.on("data", d => out += d.toString())
        proc.on("close", () => {
            const line = out.trim()
            if (!line) return resolve({ title: "SoundCloud Track", duration: null })
            const [title, dur] = line.split("|||")
            const duration = parseInt(dur)
            resolve({ title: title || "SoundCloud Track", duration: isNaN(duration) ? null : duration })
        })
        proc.on("error", () => resolve({ title: "SoundCloud Track", duration: null }))
    })
}

module.exports = { getSoundCloudInfo }
