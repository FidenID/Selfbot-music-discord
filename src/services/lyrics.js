const https = require("https")

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            let body = ""
            res.on("data", c => body += c)
            res.on("end", () => { try { resolve(JSON.parse(body)) } catch (e) { reject(e) } })
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
    const data = await fetchJson(`https://lyrics.ovh/v1/${encodeURIComponent(clean)}`)
    if (!data.lyrics) throw new Error("Lirik tidak ditemukan")
    return data.lyrics
}

module.exports = { getLyrics, cleanTitle }
