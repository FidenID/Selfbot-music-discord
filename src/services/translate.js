const https = require("https")

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" }
        }, res => {
            let body = ""
            res.on("data", c => body += c)
            res.on("end", () => { try { resolve(JSON.parse(body)) } catch (e) { reject(e) } })
        }).on("error", reject)
    })
}

/**
 * Translate via unofficial Google endpoint (no API key)
 * @param {string} text
 * @param {string} target  e.g. "id", "en", "ja"
 * @param {string} source  default "auto"
 */
async function translate(text, target, source = "auto") {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`
    const data = await fetchJson(url)
    if (!Array.isArray(data) || !data[0]) throw new Error("Translate gagal")
    const translated = data[0].map(arr => arr[0]).filter(Boolean).join("")
    const detected = data[2] || source
    return { translated, detected, target }
}

module.exports = { translate }
