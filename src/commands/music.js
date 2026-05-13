const { createAudioResource } = require("@discordjs/voice")
const { cfg } = require("../config")
const { reply } = require("../reply")
const { log } = require("../logger")
const { isUrl, isTikTok, isSoundCloud, isSpotify, isYouTubePlaylist, isYouTube, formatDuration, parseTimeToSeconds, progressBar } = require("../utils/format")
const { searchYouTube, getVideoInfo, getPlaylistVideos } = require("../services/youtube")
const { getTikTokTitle } = require("../services/tiktok")
const { getSoundCloudInfo } = require("../services/soundcloud")
const { getSpotifyInfo } = require("../services/spotify")
const { getLyrics } = require("../services/lyrics")
const { ensureQueue } = require("../voice/connect")
const { saveState } = require("../voice/queue")
const { playSong } = require("../voice/play")
const { createStream, killProcesses } = require("../voice/stream")

async function searchYTtoSong(searchQuery) {
    const r = await searchYouTube(searchQuery)
    const v = r.videos?.[0]
    if (!v) throw new Error(`Tidak ketemu di YouTube: ${searchQuery}`)
    return { title: v.title, url: v.url, duration: v.seconds }
}

async function resolveSong(query) {
    // returns array of { title, url, duration }
    if (isUrl(query)) {
        if (isSpotify(query)) {
            const info = await getSpotifyInfo(query)
            if (info.kind === "track") {
                const yt = await searchYTtoSong(info.query)
                if (yt.duration > cfg.maxSongDuration) throw new Error(`Lagu terlalu panjang (maks ${cfg.maxSongDuration / 60} menit)`)
                return [yt]
            }
            // playlist / album: convert tiap track ke pencarian YouTube (lazy: judul + artis sebagai query, resolusi YT terjadi saat play)
            const songs = info.tracks.map(t => ({
                title: `${t.title}${t.artist ? " - " + t.artist : ""}`,
                url: `ytsearch1:${t.query}`,
                duration: null
            }))
            return songs
        }
        if (isTikTok(query)) {
            const title = await getTikTokTitle(query)
            return [{ title, url: query, duration: null }]
        }
        if (isSoundCloud(query)) {
            const info = await getSoundCloudInfo(query)
            return [{ title: info.title, url: query, duration: info.duration }]
        }
        if (isYouTubePlaylist(query.split(" ")[0])) {
            const parts = query.split(" ")
            const url = parts[0]
            const limit = parts[1] ? parseInt(parts[1]) : null
            let list = await getPlaylistVideos(url)
            if (limit && limit > 0) list = list.slice(0, limit)
            return list.map(s => ({ ...s, duration: null }))
        }
        if (isYouTube(query)) {
            const r = await getVideoInfo(query)
            if (!r) throw new Error("Video YouTube tidak valid")
            if (r.seconds > cfg.maxSongDuration) throw new Error(`Lagu terlalu panjang (maks ${cfg.maxSongDuration / 60} menit)`)
            return [{ title: r.title, url: query, duration: r.seconds }]
        }
        // generic URL - try yt-dlp
        return [{ title: query, url: query, duration: null }]
    }
    // search by query
    const search = await searchYouTube(query)
    const v = search.videos?.[0]
    if (!v) throw new Error("Lagu tidak ditemukan")
    if (v.seconds > cfg.maxSongDuration) throw new Error(`Lagu terlalu panjang (maks ${cfg.maxSongDuration / 60} menit)`)
    return [{ title: v.title, url: v.url, duration: v.seconds }]
}

const cmds = []

cmds.push({
    names: ["p", "play"],
    description: "Putar lagu (judul/URL YouTube/TikTok/SoundCloud/Spotify/playlist)",
    async run(ctx) {
        const { msg, query, voice, targetGuild } = ctx
        if (!voice) return reply(msg, "❌ Masuk ke VC dulu di server.")
        if (!query) return reply(msg, `❌ Sebutkan judul/URL. Contoh: \`${cfg.prefix}p never gonna give you up\``)

        let songs
        try {
            songs = await resolveSong(query)
        } catch (err) {
            log("error", "resolveSong:", err.message)
            return reply(msg, "❌ " + err.message)
        }

        const queue = ensureQueue(targetGuild, voice, msg.channel, msg.author)
        const wasEmpty = queue.songs.length === 0
        queue.songs.push(...songs)
        saveState()

        if (songs.length > 1) await reply(msg, `📥 Added **${songs.length}** lagu`)
        else await reply(msg, `📥 Added **${songs[0].title}**${songs[0].duration ? ` \`[${formatDuration(songs[0].duration)}]\`` : ""}`)

        if (wasEmpty && !queue.radioFfmpeg) playSong(targetGuild, queue.songs[0])
    }
})

cmds.push({
    names: ["search", "yts"],
    description: "Cari lagu, pilih 1-4",
    async run(ctx) {
        const { msg, query, voice, targetGuild } = ctx
        if (!voice) return reply(msg, "❌ Masuk ke VC dulu!")
        if (!query) return reply(msg, `❌ Contoh: \`${cfg.prefix}search lofi\``)

        await reply(msg, "🔍 Mencari...")
        try {
            const r = await searchYouTube(query)
            if (!r.videos?.length) return reply(msg, "❌ Tidak ada hasil!")
            const top = r.videos.slice(0, 4)
            const list = top.map((v, i) => `**${i+1}.** ${v.title} \`[${formatDuration(v.seconds)}]\``).join("\n")
            await msg.channel.send(`🔍 **${query}**\n\n${list}\n\nBalas **1-4** untuk pilih (30s)`)
            const filter = m => m.author.id === msg.author.id && ["1","2","3","4"].includes(m.content.trim())
            try {
                const collected = await msg.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ["time"] })
                const idx = parseInt(collected.first().content.trim()) - 1
                const v = top[idx]
                const queue = ensureQueue(targetGuild, voice, msg.channel, msg.author)
                const wasEmpty = queue.songs.length === 0
                queue.songs.push({ title: v.title, url: v.url, duration: v.seconds })
                saveState()
                await reply(msg, `📥 Added **${v.title}** \`[${formatDuration(v.seconds)}]\``)
                if (wasEmpty) playSong(targetGuild, queue.songs[0])
            } catch {
                await reply(msg, "⏰ Waktu habis.")
            }
        } catch (err) {
            log("error", "search:", err.message)
            reply(msg, "❌ Gagal: " + err.message)
        }
    }
})

cmds.push({
    names: ["skip", "s"],
    description: "Skip lagu",
    async run({ msg, queue }) {
        if (!queue?.lastSong) return reply(msg, "❌ Tidak ada lagu.")
        killProcesses(queue.currentProcesses)
        queue.player.stop()
        saveState()
        return reply(msg, "⏭️ Skip!")
    }
})

cmds.push({
    names: ["stop"],
    description: "Stop & clear queue",
    async run({ msg, queue }) {
        if (!queue) return reply(msg, "❌ Tidak ada yang diputar.")
        killProcesses(queue.currentProcesses)
        try { queue.radioFfmpeg?.kill("SIGKILL") } catch {}
        queue.radioStopped = true
        queue.autoPlay = false
        queue.lastSong = null
        queue.autoPlaying = false
        queue.loop = false
        queue.songs = []
        queue.history = []
        queue.player.stop()
        saveState()
        return reply(msg, "⏹️ Stop")
    }
})

cmds.push({
    names: ["pause"], description: "Pause", async run({ msg, queue }) {
        if (!queue) return reply(msg, "❌")
        queue.player.pause()
        return reply(msg, "⏸️ Pause")
    }
})

cmds.push({
    names: ["resume", "r"], description: "Resume", async run({ msg, queue }) {
        if (!queue) return reply(msg, "❌")
        queue.player.unpause()
        return reply(msg, "▶️ Resume")
    }
})

cmds.push({
    names: ["nowplaying", "np"], description: "Info lagu sekarang",
    async run({ msg, queue }) {
        if (!queue?.lastSong) return reply(msg, "❌ Tidak ada lagu.")
        const elapsed = queue.songStartTime
            ? Math.floor((Date.now() - queue.songStartTime) / 1000) + (queue.seekOffset || 0)
            : 0
        const total = queue.lastSong.duration
        const bar = progressBar(elapsed, total)
        const filterTxt = queue.filter && queue.filter !== "none" ? ` | 🎛️ ${queue.filter}` : ""
        const speedTxt = queue.speed && queue.speed !== 1 ? ` | ⚡ ${queue.speed}x` : ""
        return reply(msg,
            `🎵 **Now Playing:** ${queue.lastSong.title}\n` +
            (bar ? `\`${formatDuration(elapsed)} ${bar} ${formatDuration(total)}\`\n` : "") +
            `🔊 ${Math.round(queue.volume * 100)}% | 🔁 ${queue.loop || "off"} | 🎲 AP ${queue.autoPlay ? "on" : "off"}${filterTxt}${speedTxt}`
        )
    }
})

cmds.push({
    names: ["seek"], description: "Loncat ke waktu (mm:ss / detik)",
    async run({ msg, queue, args }) {
        if (!queue?.lastSong) return reply(msg, "❌ Tidak ada lagu.")
        if (!args[0]) return reply(msg, `❌ Contoh: \`${cfg.prefix}seek 1:30\``)
        const sec = parseTimeToSeconds(args[0])
        if (isNaN(sec) || sec < 0) return reply(msg, "❌ Format salah.")
        killProcesses(queue.currentProcesses)
        const stream = createStream(queue.lastSong.url, { seek: sec, queue })
        const resource = createAudioResource(stream, { inlineVolume: true })
        resource.volume.setVolume(queue.volume || 1)
        queue.currentResource = resource
        queue.currentProcesses = stream.processes
        queue.player.play(resource)
        queue.songStartTime = Date.now()
        queue.seekOffset = sec
        return reply(msg, `⏩ Seek ke \`${formatDuration(sec)}\``)
    }
})

cmds.push({
    names: ["replay", "restart"], description: "Ulang lagu dari awal",
    async run({ msg, queue, targetGuild }) {
        if (!queue?.lastSong) return reply(msg, "❌ Tidak ada lagu.")
        killProcesses(queue.currentProcesses)
        playSong(targetGuild, queue.lastSong)
        return reply(msg, "🔂 Replay")
    }
})

cmds.push({
    names: ["previous", "back", "prev"], description: "Lagu sebelumnya",
    async run({ msg, queue, targetGuild }) {
        if (!queue) return reply(msg, "❌")
        const prev = queue.history.pop()
        if (!prev) return reply(msg, "❌ Tidak ada history.")
        // taruh current song kembali ke depan queue
        if (queue.lastSong) queue.songs.unshift(queue.lastSong)
        queue.songs.unshift(prev)
        killProcesses(queue.currentProcesses)
        queue.player.stop()
        saveState()
        return reply(msg, `⏮️ Previous: **${prev.title}**`)
    }
})

cmds.push({
    names: ["lyrics", "lyr"], description: "Lirik lagu",
    async run({ msg, queue }) {
        if (!queue?.lastSong) return reply(msg, "❌ Tidak ada lagu.")
        await reply(msg, "🔍 Cari lirik...")
        try {
            const lyrics = await getLyrics(queue.lastSong.title)
            try {
                const dm = await msg.author.createDM()
                await dm.send(`🎵 **Lirik: ${queue.lastSong.title}**`)
                const chunks = lyrics.match(/[\s\S]{1,1900}/g) || []
                for (const c of chunks) await dm.send(c)
            } catch {
                await msg.channel.send(`🎵 **Lirik: ${queue.lastSong.title}**`)
                const chunks = lyrics.match(/[\s\S]{1,1900}/g) || []
                for (const c of chunks) await msg.channel.send(c)
            }
        } catch (err) {
            reply(msg, "❌ " + err.message)
        }
    }
})

module.exports = cmds
