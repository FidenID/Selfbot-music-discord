const { spawn } = require("child_process")
const { cfg } = require("../config")
const { getCookiesArgs } = require("../voice/stream")

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

function getTikTokTitle(url) {
    return new Promise(resolve => {
        const proc = spawn(cfg.ytdlp, [
            "--get-title", "--no-playlist",
            ...getCookiesArgs(),
            "--user-agent", UA,
            "--no-check-certificate",
            url
        ])
        let out = ""
        proc.stdout.on("data", d => out += d.toString())
        proc.on("close", () => resolve(out.trim() || "TikTok Video"))
        proc.on("error", () => resolve("TikTok Video"))
    })
}

module.exports = { getTikTokTitle }
