const ms = require("ms")
const { reply } = require("../reply")
const { cfg } = require("../config")
const reminders = require("../state/reminders")

function parseWhen(input) {
    // try absolute HH:MM
    const abs = input.match(/^(\d{1,2}):(\d{2})$/)
    if (abs) {
        const h = parseInt(abs[1]), m = parseInt(abs[2])
        if (h < 24 && m < 60) {
            const now = new Date()
            const target = new Date(now)
            target.setHours(h, m, 0, 0)
            if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1)
            return target.getTime()
        }
    }
    // duration via ms
    const dur = ms(input)
    if (dur && dur > 0) return Date.now() + dur
    return null
}

module.exports = [{
    names: ["remind", "remindme"],
    description: "Set reminder. Contoh: ?remind 30m beli makan / ?remind 18:00 sholat",
    async run({ msg, args }) {
        if (!args[0]) return reply(msg,
            `❌ Contoh:\n\`${cfg.prefix}remind 30m beli makan\`\n\`${cfg.prefix}remind 2h meeting\`\n\`${cfg.prefix}remind 18:00 sholat maghrib\``)
        const when = parseWhen(args[0])
        if (!when) return reply(msg, "❌ Format waktu salah. Pakai `30m`, `2h`, `1d`, atau `HH:MM`")
        const message = args.slice(1).join(" ").trim()
        if (!message) return reply(msg, "❌ Sebutkan pesan reminder")
        const r = reminders.add(msg.author.id, when, message)
        const d = new Date(when)
        return reply(msg, `⏰ Reminder #${r.id} diset untuk **${d.toLocaleString("id-ID")}**\n📝 ${message}`)
    }
}, {
    names: ["reminders", "reminds"],
    description: "Lihat reminder aktif",
    async run({ msg }) {
        const list = reminders.listForUser(msg.author.id)
        if (!list.length) return reply(msg, "📭 Tidak ada reminder aktif.")
        const txt = list.map(r => {
            const d = new Date(r.fireAt)
            return `**#${r.id}** ${d.toLocaleString("id-ID")} — ${r.message}`
        }).join("\n")
        return reply(msg, `⏰ **Reminders:**\n${txt}`)
    }
}, {
    names: ["delremind", "rmremind"],
    description: "Hapus reminder by ID",
    async run({ msg, args }) {
        const id = parseInt(args[0])
        if (isNaN(id)) return reply(msg, `❌ Contoh: \`${cfg.prefix}delremind 3\``)
        const ok = reminders.remove(msg.author.id, id)
        return reply(msg, ok ? `🗑️ Reminder #${id} dihapus` : `❌ Tidak ada`)
    }
}]
