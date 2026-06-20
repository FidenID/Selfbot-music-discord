const https = require("https")
const { isUrl } = require("../utils/format")

const SERVERS = [
    "de1.api.radio-browser.info",
    "nl1.api.radio-browser.info",
    "at1.api.radio-browser.info",
    "fi1.api.radio-browser.info",
]

function httpGetJson(host, path) {
    return new Promise((resolve, reject) => {
        https.get({ hostname: host, path, headers: { "User-Agent": "bot-dc-v2/2.0" } }, res => {
            let data = ""
            res.on("data", c => data += c)
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(data)
                    resolve(parsed)
                } catch {
                    reject(new Error(data.trim().slice(0, 80)))
                }
            })
        }).on("error", reject)
    })
}

async function tryServers(path) {
    for (const host of SERVERS) {
        try {
            const result = await httpGetJson(host, path)
            if (Array.isArray(result) && result.length > 0) return result
        } catch {}
    }
    return []
}

async function resolveRadio(query) {
    if (isUrl(query)) return { url: query, name: "Direct URL" }
    const enc = encodeURIComponent(query)

    // coba byname dulu, fallback ke search
    let list = await tryServers(`/json/stations/byname/${enc}?limit=10&order=votes&reverse=true`)
    if (!list.length) {
        list = await tryServers(`/json/stations/search?name=${enc}&limit=10&order=votes&reverse=true`)
    }

    if (!list.length) throw new Error(`Stasiun "${query}" tidak ditemukan`)

    const first = list.find(x => x.url_resolved || x.url) || list[0]
    return {
        url: first.url_resolved || first.url,
        name: first.name || query,
        country: first.country || null
    }
}

module.exports = { resolveRadio }
