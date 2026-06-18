const https = require("https")

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            let body = ""
            res.on("data", c => body += c)
            res.on("end", () => { 
                try { 
                    resolve(JSON.parse(body)) 
                } catch (e) { 
                    reject(new Error("Failed to parse response"))
                } 
            })
        }).on("error", reject)
    })
}

function cleanTitle(title) {
    return title
        .replace(/\(.*?\)/g, "")
        .replace(/\[.*?\]/g, "")
        .replace(/official|video|audio|music|lyrics|hd|hq|4k|remaster|ft\.|feat\./gi, "")
        .trim()
}

async function getLyrics(title) {
    const clean = cleanTitle(title)
    
    // Split artist and song
    const parts = clean.split(/[-–—]/)
    if (parts.length < 2) {
        throw new Error("Format judul tidak valid. Gunakan: Artist - Song")
    }
    
    const artist = parts[0].trim()
    const song = parts.slice(1).join("-").trim()
    
    // Try lyrics.ovh first
    try {
        const data = await fetchJson(`https://lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`)
        if (data.lyrics) return data.lyrics
    } catch (e) {
        // Fallback to lrclib.net
        const searchUrl = `https://lrclib.net/api/search?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(song)}`
        const results = await fetchJson(searchUrl)
        if (results && results.length > 0 && results[0].plainLyrics) {
            return results[0].plainLyrics
        }
    }
    
    throw new Error("Lirik tidak ditemukan")
}

module.exports = { getLyrics, cleanTitle }
