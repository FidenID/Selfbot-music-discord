const https = require("https")

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" }
        }, res => {
            // follow redirects (Spotify often redirects)
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchHtml(res.headers.location).then(resolve, reject)
            }
            let body = ""
            res.on("data", c => body += c)
            res.on("end", () => resolve(body))
        })
        req.on("error", reject)
        req.setTimeout(15000, () => { req.destroy(new Error("Spotify timeout")) })
    })
}

function decodeEntities(s) {
    if (!s) return s
    return s
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
}

function pickMeta(html, prop) {
    // og:property style
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i")
    const m = html.match(re)
    return m ? decodeEntities(m[1]) : null
}

function pickJsonLd(html) {
    const m = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)
    if (!m) return null
    try { return JSON.parse(m[1]) } catch { return null }
}

function isSpotifyUrl(url) {
    return /(?:open\.)?spotify\.com\/(?:intl-[a-z]+\/)?(track|playlist|album)\//i.test(url)
}

function getSpotifyType(url) {
    const m = url.match(/spotify\.com\/(?:intl-[a-z]+\/)?(track|playlist|album)\/([A-Za-z0-9]+)/i)
    return m ? { type: m[1].toLowerCase(), id: m[2] } : null
}

/**
 * Ambil info dari URL Spotify dengan scrape meta tags.
 * Returns:
 *   - track: { kind: "track", title, artist, query }
 *   - playlist/album: { kind: "playlist"|"album", name, tracks: [{title, artist, query}] }
 */
async function getSpotifyInfo(url) {
    const meta = getSpotifyType(url)
    if (!meta) throw new Error("URL Spotify tidak valid")

    const html = await fetchHtml(url)
    const ogTitle = pickMeta(html, "og:title")
    const ogDesc = pickMeta(html, "og:description")
    const jsonld = pickJsonLd(html)

    if (meta.type === "track") {
        let title = ogTitle
        let artist = null

        if (jsonld) {
            const node = Array.isArray(jsonld) ? jsonld[0] : jsonld
            if (node?.name) title = node.name
            if (node?.byArtist) {
                if (Array.isArray(node.byArtist)) artist = node.byArtist.map(a => a.name).filter(Boolean).join(", ")
                else if (node.byArtist.name) artist = node.byArtist.name
            }
        }

        // fallback: og:description biasanya "Song · Artist · Year"
        if (!artist && ogDesc) {
            const parts = ogDesc.split("·").map(p => p.trim())
            if (parts.length >= 2) artist = parts[1]
        }

        if (!title) throw new Error("Gagal ambil judul track Spotify")
        const query = artist ? `${title} ${artist}` : title
        return { kind: "track", title, artist, query }
    }

    if (meta.type === "playlist" || meta.type === "album") {
        // og:title biasanya nama playlist/album
        const name = ogTitle || `Spotify ${meta.type}`
        const tracks = []

        // Spotify embed playlist HTML berisi data __NEXT_DATA__ JSON
        const nextDataMatch = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/)
        if (nextDataMatch) {
            try {
                const data = JSON.parse(nextDataMatch[1])
                // navigasi struktur — ini bisa berubah sewaktu-waktu, jadi flexible
                const stack = [data]
                const seen = new Set()
                while (stack.length && tracks.length < 100) {
                    const node = stack.pop()
                    if (!node || typeof node !== "object" || seen.has(node)) continue
                    seen.add(node)

                    // pattern: trackList items dengan { name, artists: [{name}] }
                    if (Array.isArray(node)) {
                        for (const item of node) {
                            if (item && typeof item === "object" && item.name && Array.isArray(item.artists)) {
                                const t = item.name
                                const a = item.artists.map(x => x?.name).filter(Boolean).join(", ")
                                tracks.push({ title: t, artist: a, query: a ? `${t} ${a}` : t })
                            } else {
                                stack.push(item)
                            }
                        }
                    } else {
                        for (const v of Object.values(node)) stack.push(v)
                    }
                }
            } catch {}
        }

        if (tracks.length === 0) {
            throw new Error("Gagal parse track playlist/album Spotify. Coba kirim URL track satuan.")
        }
        return { kind: meta.type, name, tracks }
    }

    throw new Error("Tipe Spotify tidak didukung")
}

module.exports = { isSpotifyUrl, getSpotifyInfo }
