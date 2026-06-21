const https = require("https")

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { "User-Agent": "bot-dc-v2/2.0" } }, res => {
            let body = ""
            res.on("data", c => body += c)
            res.on("end", () => {
                try { resolve(JSON.parse(body)) } catch { reject(new Error("parse error")) }
            })
        }).on("error", reject)
    })
}

function cleanTitle(title) {
    return title
        .replace(/\(.*?\)/g, "")
        .replace(/\[.*?\]/g, "")
        .replace(/official|video|audio|music|lyrics|hd|hq|4k|remaster|ft\.|feat\./gi, "")
        .replace(/\s+/g, " ")
        .trim()
}

async function getLyrics(title) {
    const clean = cleanTitle(title)
    const parts = clean.split(/[-–—]/)
    const artist = parts[0].trim()
    const song = parts.slice(1).join(" ").trim()

    // 1. lrclib by query (paling reliable)
    try {
        const q = encodeURIComponent(song ? `${artist} ${song}` : clean)
        const results = await fetchJson(`https://lrclib.net/api/search?q=${q}`)
        const hit = results?.find(r => r.plainLyrics)
        if (hit?.plainLyrics) return hit.plainLyrics
    } catch {}

    // 2. lyrics.ovh fallback
    if (artist && song) {
        try {
            const data = await fetchJson(`https://lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`)
            if (data.lyrics) return data.lyrics
        } catch {}
    }

    throw new Error("Lirik tidak ditemukan")
}

module.exports = { getLyrics, cleanTitle }
