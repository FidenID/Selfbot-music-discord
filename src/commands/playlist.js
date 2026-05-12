const { reply } = require("../reply")
const { cfg } = require("../config")
const { formatDuration } = require("../utils/format")
const { ensureQueue, saveState } = (() => ({ ensureQueue: require("../voice/connect").ensureQueue, saveState: require("../voice/queue").saveState }))()
const { playSong } = require("../voice/play")
const playlists = require("../state/playlists")
const favs = require("../state/favorites")
const history = require("../state/history")

const cmds = []

cmds.push({
    names: ["playlist", "pl"],
    description: "Manajemen playlist: save/load/list/delete/show",
    async run({ msg, args, voice, targetGuild, queue }) {
        const sub = (args[0] || "").toLowerCase()
        const userId = msg.author.id

        if (!sub || sub === "list") {
            const names = playlists.listNames(userId)
            if (!names.length) return reply(msg, `📭 Belum ada playlist. Save: \`${cfg.prefix}pl save <nama>\``)
            return reply(msg, `📚 **Playlist kamu:**\n${names.map((n, i) => `**${i+1}.** ${n}`).join("\n")}`)
        }

        if (sub === "save") {
            if (!queue || !queue.lastSong) return reply(msg, "❌ Tidak ada queue untuk disimpan.")
            const name = args.slice(1).join(" ").trim()
            if (!name) return reply(msg, `❌ Contoh: \`${cfg.prefix}pl save mychill\``)
            const songs = [queue.lastSong, ...queue.songs.slice(1)]
            playlists.setPlaylist(userId, name, songs)
            return reply(msg, `💾 Disimpan: **${name}** (${songs.length} lagu)`)
        }

        if (sub === "load" || sub === "play") {
            if (!voice) return reply(msg, "❌ Masuk VC dulu.")
            const name = args.slice(1).join(" ").trim()
            if (!name) return reply(msg, `❌ Contoh: \`${cfg.prefix}pl load mychill\``)
            const pl = playlists.get(userId, name)
            if (!pl) return reply(msg, `❌ Playlist **${name}** tidak ada`)
            const q = ensureQueue(targetGuild, voice, msg.channel, msg.author)
            const wasEmpty = q.songs.length === 0
            q.songs.push(...pl.songs)
            saveState()
            await reply(msg, `📥 Load **${pl.name}** (${pl.songs.length} lagu)`)
            if (wasEmpty) playSong(targetGuild, q.songs[0])
            return
        }

        if (sub === "delete" || sub === "del" || sub === "rm") {
            const name = args.slice(1).join(" ").trim()
            if (!name) return reply(msg, `❌ Contoh: \`${cfg.prefix}pl del mychill\``)
            const ok = playlists.remove(userId, name)
            return reply(msg, ok ? `🗑️ Hapus **${name}**` : `❌ Tidak ada **${name}**`)
        }

        if (sub === "show" || sub === "info") {
            const name = args.slice(1).join(" ").trim()
            if (!name) return reply(msg, `❌ Contoh: \`${cfg.prefix}pl show mychill\``)
            const pl = playlists.get(userId, name)
            if (!pl) return reply(msg, `❌ Tidak ada`)
            const list = pl.songs.slice(0, 15).map((s, i) =>
                `**${i+1}.** ${s.title}${s.duration ? ` \`[${formatDuration(s.duration)}]\`` : ""}`).join("\n")
            return reply(msg, `📚 **${pl.name}** (${pl.songs.length}):\n${list}${pl.songs.length > 15 ? "\n..." : ""}`)
        }

        return reply(msg, `❌ Sub-command: list, save, load, delete, show`)
    }
})

cmds.push({
    names: ["fav", "favorite"],
    description: "Favorit: tambah lagu sekarang / list / hapus / play",
    async run({ msg, args, queue, voice, targetGuild }) {
        const sub = (args[0] || "").toLowerCase()
        const userId = msg.author.id

        if (!sub || sub === "add") {
            if (!queue?.lastSong) return reply(msg, "❌ Tidak ada lagu.")
            const ok = favs.addFav(userId, queue.lastSong)
            return reply(msg, ok ? `⭐ Ditambahkan: **${queue.lastSong.title}**` : "ℹ️ Sudah ada di favorit")
        }
        if (sub === "list" || sub === "ls") {
            const list = favs.getFavs(userId)
            if (!list.length) return reply(msg, "📭 Belum ada favorit.")
            const txt = list.slice(0, 20).map((s, i) =>
                `**${i+1}.** ${s.title}${s.duration ? ` \`[${formatDuration(s.duration)}]\`` : ""}`).join("\n")
            return reply(msg, `⭐ **Favorit (${list.length}):**\n${txt}`)
        }
        if (sub === "remove" || sub === "rm") {
            const idx = parseInt(args[1]) - 1
            const ok = favs.removeFav(userId, idx)
            return reply(msg, ok ? "🗑️ Dihapus" : "❌ Index salah")
        }
        if (sub === "play") {
            if (!voice) return reply(msg, "❌ Masuk VC dulu.")
            const list = favs.getFavs(userId)
            if (!list.length) return reply(msg, "📭 Kosong")
            const q = ensureQueue(targetGuild, voice, msg.channel, msg.author)
            const wasEmpty = q.songs.length === 0
            q.songs.push(...list)
            saveState()
            await reply(msg, `📥 Play ${list.length} favorit`)
            if (wasEmpty) playSong(targetGuild, q.songs[0])
            return
        }
        return reply(msg, `❌ Sub: add / list / remove <n> / play`)
    }
})

cmds.push({
    names: ["history", "hist"],
    description: "History lagu kamu / clear",
    async run({ msg, args }) {
        if ((args[0] || "").toLowerCase() === "clear") {
            history.clearHistory(msg.author.id)
            return reply(msg, "🗑️ History dihapus")
        }
        const list = history.getHistory(msg.author.id, 15)
        if (!list.length) return reply(msg, "📭 Belum ada history.")
        const txt = list.map((s, i) => `**${i+1}.** ${s.title}`).join("\n")
        return reply(msg, `🕘 **History:**\n${txt}`)
    }
})

module.exports = cmds
