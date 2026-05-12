const { reply } = require("../reply")
const { cfg } = require("../config")
const { translate } = require("../services/translate")

module.exports = [{
    names: ["translate", "tr", "tl"],
    description: "Translate. Contoh: ?tr id hello world  |  ?tr ja how are you",
    async run({ msg, args }) {
        if (args.length < 2) return reply(msg,
            `❌ Contoh: \`${cfg.prefix}tr id hello world\` (target=id)\n\`${cfg.prefix}tr ja how are you\``)
        const target = args[0].toLowerCase()
        const text = args.slice(1).join(" ")
        try {
            const r = await translate(text, target)
            return reply(msg, `🌐 **${r.detected} → ${r.target}**\n${r.translated}`)
        } catch (err) {
            reply(msg, "❌ Translate gagal: " + err.message)
        }
    }
}]
