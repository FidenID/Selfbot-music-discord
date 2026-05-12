function formatDuration(seconds) {
    if (!seconds && seconds !== 0) return "?:??"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    return `${m}:${String(s).padStart(2, "0")}`
}

function formatUptime(ms) {
    const totalSec = Math.floor(ms / 1000)
    const d = Math.floor(totalSec / 86400)
    const h = Math.floor((totalSec % 86400) / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    if (d > 0) return `${d}h ${h}j ${m}m`
    if (h > 0) return `${h}j ${m}m ${s}d`
    return `${m}m ${s}d`
}

function progressBar(elapsed, total, len = 20) {
    if (!total) return null
    const pct = Math.min(elapsed / total, 1)
    const filled = Math.round(pct * len)
    return "▓".repeat(filled) + "░".repeat(len - filled)
}

function isUrl(str) {
    try { new URL(str); return true } catch { return false }
}

function isYouTube(url) {
    return /(?:youtube\.com|youtu\.be|music\.youtube\.com)/.test(url)
}

function isTikTok(url) { return /tiktok\.com/.test(url) }

function isSoundCloud(url) { return /soundcloud\.com/.test(url) }

function isYouTubePlaylist(url) {
    return isYouTube(url) && url.includes("list=")
}

function extractYouTubeId(url) {
    const m = url.match(/(?:music\.youtube\.com\/watch\?v=|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
    return m ? m[1] : null
}

function parseTimeToSeconds(input) {
    if (!input) return NaN
    if (input.includes(":")) {
        const parts = input.split(":").map(p => parseInt(p))
        if (parts.some(isNaN)) return NaN
        if (parts.length === 2) return parts[0] * 60 + parts[1]
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    const n = parseInt(input)
    return isNaN(n) ? NaN : n
}

module.exports = {
    formatDuration, formatUptime, progressBar,
    isUrl, isYouTube, isTikTok, isSoundCloud, isYouTubePlaylist,
    extractYouTubeId, parseTimeToSeconds
}
