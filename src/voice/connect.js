const { joinVoiceChannel, createAudioPlayer } = require("@discordjs/voice")
const { queues, createQueue } = require("./queue")

/**
 * Pastikan ada queue di guild. Kalau bot belum di VC, join ke voiceChannel yang diberikan.
 */
function ensureQueue(guild, voiceChannel, textChannel, author) {
    let queue = queues.get(guild.id)
    if (queue) {
        if (author) queue.lastCommandAuthor = author
        return queue
    }
    if (!voiceChannel) return null
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: true
    })
    const player = createAudioPlayer()
    connection.subscribe(player)
    queue = createQueue(textChannel, connection, player, voiceChannel.id)
    if (author) queue.lastCommandAuthor = author
    queues.set(guild.id, queue)
    return queue
}

module.exports = { ensureQueue }
