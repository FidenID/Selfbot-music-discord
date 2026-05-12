const {
    createAudioResource, AudioPlayerStatus,
    VoiceConnectionStatus, entersState
} = require("@discordjs/voice")
const { log } = require("../logger")
const { notifyDM } = require("../reply")
const { queues, saveState } = require("./queue")
const { createStream, createRadioStream, killProcesses } = require("./stream")
const { formatDuration, isYouTube, extractYouTubeId } = require("../utils/format")
const { getYouTubeRelated } = require("../services/youtube")
const { addHistory } = require("../state/history")

const MAX_RECONNECT = 5

async function playSong(guild, song) {
    const queue = queues.get(guild.id)
    if (!queue) return

    if (!song) {
        killProcesses(queue.currentProcesses)
        queue.currentProcesses = null

        // loop song
        if (queue.loop === "song" && queue.lastSong) return playSong(guild, queue.lastSong)
        // loop queue: re-queue history
        if (queue.loop === "queue" && queue.history.length > 0) {
            queue.songs = [...queue.history]
            queue.history = []
            return playSong(guild, queue.songs[0])
        }

        // autoplay (rekomendasi YouTube)
        if (queue.autoPlay && queue.lastSong && !queue.autoPlaying) {
            const lastUrl = queue.lastSong.url
            if (isYouTube(lastUrl)) {
                queue.autoPlaying = true
                await notifyDM(queue, "🔄 Queue habis, cari rekomendasi YouTube...")
                try {
                    const related = await getYouTubeRelated(lastUrl)
                    const lastId = extractYouTubeId(lastUrl)
                    const candidates = related.filter(v => extractYouTubeId(v.url) !== lastId)
                    if (candidates.length > 0) {
                        const next = { ...candidates[0], duration: null }
                        queue.songs.push(next)
                        queue.autoPlaying = false
                        await notifyDM(queue, `📬 Auto play: **${next.title}**`)
                        return playSong(guild, next)
                    }
                } catch (err) {
                    log("warn", "Autoplay gagal:", err.message)
                }
                queue.autoPlaying = false
            }
        }

        await notifyDM(queue, "✅ Selesai memutar semua lagu")
        return
    }

    log("music", "Playing:", song.title)
    killProcesses(queue.currentProcesses)

    try {
        const audio = song._preStream || createStream(song.url, { queue })
        song._preStream = null
        const resource = createAudioResource(audio, { inlineVolume: true })
        resource.volume.setVolume(queue.volume || 1)
        queue.currentResource = resource
        queue.currentProcesses = audio.processes
        queue.player.play(resource)

        queue.player.removeAllListeners("error")
        queue.player.on("error", err => {
            log("error", "Player:", err.message)
            notifyDM(queue, "❌ Error audio, skip ke berikutnya...")
            queue.songs.shift()
            playSong(guild, queue.songs[0])
        })

        queue.connection.removeAllListeners("error")
        queue.connection.removeAllListeners(VoiceConnectionStatus.Disconnected)
        queue.connection.on("error", err => {
            log("error", "Connection:", err.message, err.code)
            if (err.code === "ETIMEDOUT") {
                try { queue.connection.rejoin() } catch {}
            }
        })
        queue.connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(queue.connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(queue.connection, VoiceConnectionStatus.Connecting, 5_000)
                ])
            } catch {
                try { queue.connection.destroy() } catch {}
                queues.delete(guild.id)
                log("warn", "VC lost, leave guild:", guild.id)
            }
        })

        await notifyDM(queue, `🎵 Now playing **${song.title}**${song.duration ? ` \`[${formatDuration(song.duration)}]\`` : ""}`)
        queue.lastSong = song
        queue.autoPlaying = false
        queue.songStartTime = Date.now()
        queue.seekOffset = 0
        if (queue.lastCommandAuthor) addHistory(queue.lastCommandAuthor.id, song)
        saveState()

        queue.player.once(AudioPlayerStatus.Idle, () => {
            killProcesses(queue.currentProcesses)
            queue.currentProcesses = null
            // simpan history queue (untuk previous & loop queue)
            if (queue.lastSong) queue.history.push(queue.lastSong)
            if (queue.history.length > 50) queue.history.shift()

            if (queue.loop !== "song") queue.songs.shift()
            const next = queue.loop === "song" ? queue.lastSong : queue.songs[0]
            if (next) {
                try { next._preStream = createStream(next.url, { queue }) } catch {}
            }
            playSong(guild, next)
        })
    } catch (err) {
        log("error", "playSong:", err.message)
        queue.songs.shift()
        playSong(guild, queue.songs[0])
    }
}

async function playRadio(guild, radioUrl, radioName) {
    const queue = queues.get(guild.id)
    if (!queue) return

    log("radio", "Playing:", radioName)
    if (queue.radioFfmpeg) { try { queue.radioFfmpeg.kill("SIGKILL") } catch {} }

    queue.radioStopped = false
    queue.radioUrl = radioUrl
    queue.radioName = radioName

    const ff = createRadioStream(radioUrl)
    queue.radioFfmpeg = ff
    const resource = createAudioResource(ff.stdout)
    queue.player.play(resource)

    queue.player.removeAllListeners("error")
    queue.player.on("error", err => {
        log("error", "Radio:", err.message)
        if (queue.radioStopped) return
        queue.radioReconnectAttempts++
        if (queue.radioReconnectAttempts >= MAX_RECONNECT) {
            notifyDM(queue, `❌ Radio gagal setelah ${MAX_RECONNECT} percobaan.`)
            queue.radioStopped = true
            return
        }
        const delay = Math.min(5000 * Math.pow(2, queue.radioReconnectAttempts - 1), 30000)
        setTimeout(() => {
            const q = queues.get(guild.id)
            if (q && !q.radioStopped) playRadio(guild, radioUrl, radioName)
        }, delay)
    })

    await notifyDM(queue, `📻 Now playing radio: **${radioName}**`)
    saveState()

    queue.player.once(AudioPlayerStatus.Idle, () => {
        const q = queues.get(guild.id)
        if (!q || q.radioStopped) return
        q.radioReconnectAttempts++
        if (q.radioReconnectAttempts >= MAX_RECONNECT) {
            notifyDM(q, "❌ Radio stream terputus.")
            q.radioStopped = true
            return
        }
        const delay = Math.min(5000 * Math.pow(2, q.radioReconnectAttempts - 1), 30000)
        setTimeout(() => {
            const curr = queues.get(guild.id)
            if (curr && !curr.radioStopped) playRadio(guild, radioUrl, radioName)
        }, delay)
    })
}

module.exports = { playSong, playRadio }
