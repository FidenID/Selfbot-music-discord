const { reply } = require("../reply")
const { cfg } = require("../config")
const afkState = require("../state/afk")

module.exports = [{
    names: ["afk"],
    description: "Set AFK mode (auto-reply DM saat di-mention)",
    async run({ msg, query }) {
        if (query.trim().toLowerCase() === "off") {
            const { wasActive, mentions } = afkState.clearAfk()
            return reply(msg, wasActive
                ? `✅ AFK off. Kamu menerima **${mentions}** mention selama AFK.`
                : "ℹ️ Kamu tidak sedang AFK.")
        }
        const message = query.trim() || "Sedang AFK, balas nanti."
        afkState.setAfk(message)
        return reply(msg, `💤 AFK aktif: **${message}**\nKetik \`${cfg.prefix}afk off\` atau kirim pesan apapun untuk nonaktifkan.`)
    }
}]
