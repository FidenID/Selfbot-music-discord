const { reply } = require("../reply")
const { cfg } = require("../config")
const { log } = require("../logger")
const { resolveRadio } = require("../services/radioBrowser")
const { ensureQueue } = require("../voice/connect")
const { playRadio } = require("../voice/play")
const { killProcesses } = require("../voice/stream")

module.exports = [{
    names: ["radio"],
    description: "Putar stasiun radio (nama atau URL)",
    async run({ msg, query, voice, targetGuild }) {
        if (!voice) return reply(msg, "❌ Masuk ke VC dulu!")
        if (!query) return reply(msg, `❌ Contoh: \`${cfg.prefix}radio Jazz\``)
        try {
            await reply(msg, "📻 Mencari stasiun...")
            const r = await resolveRadio(query)
            await reply(msg, `📻 Ketemu: **${r.name}**${r.country ? ` (${r.country})` : ""}`)
            const queue = ensureQueue(targetGuild, voice, msg.channel, msg.author)
            queue.songs = []
            killProcesses(queue.currentProcesses)
            playRadio(targetGuild, r.url, r.name)
        } catch (err) {
            log("error", "radio:", err.message)
            reply(msg, "❌ " + err.message)
        }
    }
}, {
    names: ["stopradio", "sr"],
    description: "Stop radio",
    async run({ msg, queue }) {
        if (!queue) return reply(msg, "❌")
        try { queue.radioFfmpeg?.kill("SIGKILL") } catch {}
        queue.radioStopped = true
        queue.radioUrl = null
        queue.radioName = null
        queue.player.stop()
        return reply(msg, "📻 Radio stop")
    }
}]
