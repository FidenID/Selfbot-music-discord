const { createAudioResource } = require("@discordjs/voice")
const { reply } = require("../reply")
const { saveState } = require("../voice/queue")
const { createStream, killProcesses, FILTERS } = require("../voice/stream")
const { cfg } = require("../config")

function reapplyAudio(queue) {
    if (!queue?.lastSong) return false
    const elapsed = queue.songStartTime
        ? Math.floor((Date.now() - queue.songStartTime) / 1000) + (queue.seekOffset || 0)
        : 0
    killProcesses(queue.currentProcesses)
    const stream = createStream(queue.lastSong.url, { seek: elapsed, queue })
    const resource = createAudioResource(stream, { inlineVolume: true })
    resource.volume.setVolume(queue.volume || 1)
    queue.currentResource = resource
    queue.currentProcesses = stream.processes
    queue.player.play(resource)
    queue.songStartTime = Date.now()
    queue.seekOffset = elapsed
    return true
}

const cmds = []

cmds.push({
    names: ["volume", "vol", "v"], description: "Atur/lihat volume",
    async run({ msg, queue, args }) {
        if (!queue) return reply(msg, "❌ Bot tidak di VC.")
        if (!args[0]) return reply(msg, `🔊 Volume: **${Math.round((queue.volume || 1) * 100)}%**`)
        const v = parseInt(args[0])
        if (isNaN(v) || v < 1 || v > 200) return reply(msg, "❌ Volume 1-200")
        queue.volume = v / 100
        if (queue.currentResource) queue.currentResource.volume.setVolume(queue.volume)
        saveState()
        return reply(msg, `🔊 Volume: **${v}%**`)
    }
})

cmds.push({
    names: ["loop", "l"], description: "Loop: off / song / queue",
    async run({ msg, queue, args }) {
        if (!queue) return reply(msg, "❌")
        const mode = (args[0] || "").toLowerCase()
        if (mode === "off" || mode === "no" || mode === "0") queue.loop = false
        else if (mode === "song" || mode === "track" || mode === "1") queue.loop = "song"
        else if (mode === "queue" || mode === "all" || mode === "2") queue.loop = "queue"
        else {
            // toggle
            if (!queue.loop) queue.loop = "song"
            else if (queue.loop === "song") queue.loop = "queue"
            else queue.loop = false
        }
        saveState()
        return reply(msg, `🔁 Loop: **${queue.loop || "off"}**`)
    }
})

cmds.push({
    names: ["autoplay", "ap"], description: "Toggle autoplay rekomendasi YouTube",
    async run({ msg, queue }) {
        if (!queue) return reply(msg, "❌")
        queue.autoPlay = !queue.autoPlay
        saveState()
        return reply(msg, `🎲 Auto play: **${queue.autoPlay ? "on" : "off"}**`)
    }
})

cmds.push({
    names: ["filter", "fx"], description: `Audio filter: ${Object.keys(FILTERS).join(", ")}`,
    async run({ msg, queue, args }) {
        if (!queue?.lastSong) return reply(msg, "❌ Tidak ada lagu.")
        const f = (args[0] || "").toLowerCase()
        if (!f) return reply(msg, `🎛️ Saat ini: **${queue.filter}**\nFilter tersedia: ${Object.keys(FILTERS).join(", ")}`)
        if (!(f in FILTERS)) return reply(msg, `❌ Filter tidak ada. Pilihan: ${Object.keys(FILTERS).join(", ")}`)
        queue.filter = f
        saveState()
        reapplyAudio(queue)
        return reply(msg, `🎛️ Filter: **${f}**`)
    }
})

cmds.push({
    names: ["speed"], description: "Atur kecepatan 0.5-2.0",
    async run({ msg, queue, args }) {
        if (!queue?.lastSong) return reply(msg, "❌")
        const s = parseFloat(args[0])
        if (isNaN(s) || s < 0.25 || s > 4) return reply(msg, `❌ Contoh: \`${cfg.prefix}speed 1.25\` (0.25-4.0)`)
        queue.speed = s
        saveState()
        reapplyAudio(queue)
        return reply(msg, `⚡ Speed: **${s}x**`)
    }
})

cmds.push({
    names: ["reset"], description: "Reset filter & speed ke default",
    async run({ msg, queue }) {
        if (!queue) return reply(msg, "❌")
        queue.filter = "none"
        queue.speed = 1
        saveState()
        if (queue.lastSong) reapplyAudio(queue)
        return reply(msg, "🔄 Filter & speed direset")
    }
})

module.exports = cmds
