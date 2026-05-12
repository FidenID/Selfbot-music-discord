const { reply } = require("../reply")
const { cfg } = require("../config")
const { getWeather } = require("../services/weather")

module.exports = [{
    names: ["weather", "w", "cuaca"],
    description: "Cek cuaca kota tertentu",
    async run({ msg, query }) {
        if (!query) return reply(msg, `❌ Contoh: \`${cfg.prefix}weather Jakarta\``)
        try {
            const w = await getWeather(query)
            return reply(msg,
                `🌤️ **${w.place}**\n` +
                `📝 ${w.desc}\n` +
                `🌡️ Suhu: **${w.temp}°C** (terasa ${w.feelsLike}°C)\n` +
                `💧 Kelembapan: **${w.humidity}%**\n` +
                `💨 Angin: **${w.wind} km/h**\n` +
                `☁️ Awan: **${w.cloudCover}%**\n` +
                `🕒 ${w.observation}`
            )
        } catch (err) {
            reply(msg, "❌ Gagal ambil cuaca: " + err.message)
        }
    }
}]
