const https = require("https")

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { "User-Agent": "curl/8.0" } }, res => {
            let body = ""
            res.on("data", c => body += c)
            res.on("end", () => { try { resolve(JSON.parse(body)) } catch (e) { reject(e) } })
        }).on("error", reject)
    })
}

async function getWeather(city) {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1&lang=id`
    const data = await fetchJson(url)
    const cur = data.current_condition?.[0]
    if (!cur) throw new Error("Data cuaca tidak tersedia")
    const area = data.nearest_area?.[0]
    const place = area?.areaName?.[0]?.value || city
    const country = area?.country?.[0]?.value || ""
    const desc = cur.lang_id?.[0]?.value || cur.weatherDesc?.[0]?.value || "-"
    return {
        place: country ? `${place}, ${country}` : place,
        temp: cur.temp_C,
        feelsLike: cur.FeelsLikeC,
        humidity: cur.humidity,
        wind: cur.windspeedKmph,
        desc,
        cloudCover: cur.cloudcover,
        observation: cur.observation_time
    }
}

module.exports = { getWeather }
