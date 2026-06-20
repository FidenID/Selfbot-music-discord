const { reply } = require("../reply")
const { saveState } = require("../voice/queue")
const { formatDuration } = require("../utils/format")
const { cfg } = require("../config")

const cmds = []

cmds.push({
    names: ["queue", "q"], description: "Lihat antrian",
    async run({ msg, queue, args }) {
        if (!queue || queue.songs.length === 0) return reply(msg, "📭 Queue kosong.")
        const page = parseInt(args[0]) || 1
        const per = 10
        const start = (page - 1) * per
        const totalPages = Math.ceil(queue.songs.length / per)
        const list = queue.songs.slice(start, start + per)
            .map((s, i) => `**${start + i + 1}.** ${s.title}${s.duration ? ` \`[${formatDuration(s.duration)}]\`` : ""}`)
            .join("\n")
        return reply(msg, `📋 **Queue** (${queue.songs.length}) — H ${page}/${totalPages}:\n${list}`)
    }
})

cmds.push({
    names: ["clearqueue", "cq"], description: "Kosongkan antrian (lagu sekarang lanjut)",
    async run({ msg, queue }) {
        if (!queue) return reply(msg, "❌")
        // sisakan lagu yang sedang main di index 0
        queue.songs = queue.songs.slice(0, 1)
        saveState()
        return reply(msg, "🗑️ Queue dikosongkan")
    }
})

cmds.push({
    names: ["shuffle", "sh"], description: "Acak antrian",
    async run({ msg, queue }) {
        if (!queue || queue.songs.length < 3) return reply(msg, "❌ Queue terlalu pendek")
        // skip current (index 0), shuffle sisanya
        const head = queue.songs[0]
        const rest = queue.songs.slice(1)
        for (let i = rest.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[rest[i], rest[j]] = [rest[j], rest[i]]
        }
        queue.songs = [head, ...rest]
        saveState()
        return reply(msg, `🔀 Diacak (${rest.length} lagu)`)
    }
})

cmds.push({
    names: ["remove", "rm"], description: "Hapus lagu di antrian (index dari ?queue)",
    async run({ msg, queue, args }) {
        if (!queue) return reply(msg, "❌")
        const idx = parseInt(args[0])
        if (isNaN(idx) || idx < 1 || idx > queue.songs.length) return reply(msg, `❌ Contoh: \`${cfg.prefix}remove 3\``)
        if (idx === 1) return reply(msg, "❌ Tidak bisa hapus lagu yang sedang main, pakai `?skip`")
        const removed = queue.songs.splice(idx - 1, 1)[0]
        saveState()
        return reply(msg, `🗑️ Hapus **${removed.title}**`)
    }
})

cmds.push({
    names: ["move", "mv"], description: "Pindah posisi lagu di queue",
    async run({ msg, queue, args }) {
        if (!queue) return reply(msg, "❌")
        const from = parseInt(args[0])
        const to = parseInt(args[1])
        if (isNaN(from) || isNaN(to) || from < 2 || to < 2 || from > queue.songs.length || to > queue.songs.length)
            return reply(msg, `❌ Contoh: \`${cfg.prefix}move 5 2\` (tidak boleh memindah lagu #1 yang sedang main)`)
        const [item] = queue.songs.splice(from - 1, 1)
        queue.songs.splice(to - 1, 0, item)
        saveState()
        return reply(msg, `↕️ **${item.title}** dipindah ke #${to}`)
    }
})

cmds.push({
    names: ["jump", "j"], description: "Loncat ke lagu di queue",
    async run({ msg, queue, args, targetGuild }) {
        if (!queue) return reply(msg, "❌")
        const idx = parseInt(args[0])
        if (isNaN(idx) || idx < 2 || idx > queue.songs.length) return reply(msg, `❌ Contoh: \`${cfg.prefix}jump 4\``)
        // buang lagu sebelum idx (kecuali current di 0 → tetap di-skip via player.stop)
        const target = queue.songs[idx - 1]
        queue.songs = [target, ...queue.songs.slice(idx)]
        try { queue.currentProcesses?.ytdlp?.kill("SIGKILL") } catch {}
        try { queue.currentProcesses?.ff?.kill("SIGKILL") } catch {}
        queue.player.stop()
        saveState()
        return reply(msg, `⏭️ Loncat ke **${target.title}**`)
    }
})

cmds.push({
    names: ["silent"], description: "Toggle notif musik on/off",
    async run({ msg, queue }) {
        if (!queue) return reply(msg, "❌ Tidak ada queue aktif.")
        queue.silent = !queue.silent
        return reply(msg, queue.silent ? "🔕 Silent ON — notif musik dimatikan" : "🔔 Silent OFF — notif musik aktif")
    }
})

module.exports = cmds
