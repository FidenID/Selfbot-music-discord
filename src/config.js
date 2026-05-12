const fs = require("fs")
const path = require("path")
const dotenv = require("dotenv")
const { log } = require("./logger")

dotenv.config()

const ROOT = path.resolve(__dirname, "..")
const DATA_DIR = path.join(ROOT, "data")
const TMP_DIR = path.join(ROOT, "tmp")
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

const cfg = {
    prefix: process.env.DISCORD_PREFIX || "?",
    token: process.env.DISCORD_TOKEN,
    allowedUsers: (process.env.ALLOWED_USERS || "").split(",").map(s => s.trim()).filter(Boolean),
    ytdlp: process.env.YTDLP_PATH || (process.platform === "win32" ? "./yt-dlp.exe" : "yt-dlp"),
    stealth: process.env.STEALTH !== "false",
    replyDM: process.env.REPLY_DM !== "false",
    maxSongDuration: parseInt(process.env.MAX_SONG_DURATION || "1800"),
    stateFile: process.env.STATE_FILE || path.join(DATA_DIR, "state.json"),
    cookiesFile: path.join(ROOT, "cookies.txt"),
    rootDir: ROOT,
    dataDir: DATA_DIR,
    tmpDir: TMP_DIR,
    configFile: path.join(ROOT, "config.json")
}

if (!cfg.token) {
    try {
        const file = require(cfg.configFile)
        cfg.prefix = file.prefix || cfg.prefix
        cfg.token = file.token
        if (file.allowedUsers) cfg.allowedUsers = file.allowedUsers
    } catch {
        log("error", "DISCORD_TOKEN diperlukan! Set di .env atau config.json")
        process.exit(1)
    }
}

function persistAllowedUsers() {
    try {
        let file = {}
        if (fs.existsSync(cfg.configFile)) file = JSON.parse(fs.readFileSync(cfg.configFile, "utf8"))
        file.allowedUsers = cfg.allowedUsers
        fs.writeFileSync(cfg.configFile, JSON.stringify(file, null, 2))
    } catch (e) { log("warn", "persistAllowedUsers:", e.message) }
}

module.exports = { cfg, persistAllowedUsers }
