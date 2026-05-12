const https = require("https")
const { isUrl } = require("../utils/format")

function httpGetJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { "User-Agent": "bot-dc-v2/2.0" } }, res => {
            let data = ""
            res.on("data", c => data += c)
            res.on("end", () => {
                try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
            })
        }).on("error", reject)
    })
}

async function resolveRadio(query) {
    if (isUrl(query)) return { url: query, name: "Direct URL" }
    const enc = encodeURIComponent(query)
    const list = await httpGetJson(`https://de1.api.radio-browser.info/json/stations/byname/${enc}`)
    if (!Array.isArray(list) || !list.length) {
        throw new Error(`Stasiun "${query}" tidak ditemukan`)
    }
    const first = list.find(x => x.url) || list[0]
    return { url: first.url, name: first.name || query, country: first.country || null }
}

module.exports = { resolveRadio }
