const { joinVoiceChannel, createAudioPlayer } = require("@discordjs/voice")
const { reply } = require("../reply")
const { cfg } = require("../config")
const { queues, createQueue, saveState } = require("../voice/queue")
const { killProcesses } = require("../voice/stream")

module.exports = [{
    names: ["join"], description: "Join VC (kamu / VC dengan nama tertentu)",
    async run({ msg, query, voice }) {
        if (!msg.guild) return reply(msg, "❌ Hanya di server.")
        let target = voice
        if (query.trim()) {
            target = msg.guild.channels.cache.find(c => c.type === 2 && c.name.toLowerCase() === query.toLowerCase().trim())
            if (!target) return reply(msg, `❌ VC **${query}** tidak ditemukan!`)
        }
        if (!target) return reply(msg, `❌ Sebutkan nama VC: \`${cfg.prefix}join General\``)

        const existing = queues.get(msg.guild.id)
        if (existing) { try { existing.connection.destroy() } catch {}; queues.delete(msg.guild.id) }

        const connection = joinVoiceChannel({
            channelId: target.id, guildId: msg.guild.id,
            adapterCreator: msg.guild.voiceAdapterCreator,
            selfDeaf: false, selfMute: true
        })
        const player = createAudioPlayer()
        connection.subscribe(player)
        const q = createQueue(msg.channel, connection, player, target.id)
        q.lastCommandAuthor = msg.author
        queues.set(msg.guild.id, q)
        saveState()
        return reply(msg, `✅ Join **${target.name}**`)
    }
}, {
    names: ["leave", "dc"], description: "Keluar VC",
    async run({ msg, queue, targetGuild }) {
        if (!queue) return reply(msg, "❌ Bot tidak di VC.")
        killProcesses(queue.currentProcesses)
        try { queue.radioFfmpeg?.kill("SIGKILL") } catch {}
        queue.player.stop()
        try { queue.connection.destroy() } catch {}
        queues.delete(targetGuild.id)
        saveState()
        return reply(msg, "👋 Bye")
    }
}]
