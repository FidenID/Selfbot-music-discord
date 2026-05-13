const fs = require("fs")
const { Client } = require("discord.js-selfbot-v13")
const { joinVoiceChannel, createAudioPlayer, VoiceConnectionStatus, entersState } = require("@discordjs/voice")

const { cfg } = require("./config")
const { log } = require("./logger")
const { registry } = require("./commands")
const { queues, createQueue, saveState, loadState } = require("./voice/queue")
const { playSong, playRadio } = require("./voice/play")
const { killProcesses } = require("./voice/stream")
const reminders = require("./state/reminders")
require("./state/runtime") // init startTime early

const client = new Client()

client.on("ready", async () => {
    log("ok", "Logged in as", client.user.tag)
    log("info", "Prefix:", cfg.prefix, "| Stealth:", cfg.stealth, "| ReplyDM:", cfg.replyDM)
    log("info", "Cookies:", fs.existsSync(cfg.cookiesFile) ? "Found" : "Not found")
    log("info", "Allowed:", cfg.allowedUsers.length ? cfg.allowedUsers.join(", ") : "All users")

    reminders.init(client)

    const state = loadState()
    if (!state) return log("info", "No state, fresh start")

    for (const [guildId, gs] of Object.entries(state)) {
        const guild = client.guilds.cache.get(guildId)
        if (!guild) continue
        const vc = guild.channels.cache.get(gs.voiceChannelId)
        if (!vc) continue
        const tc = client.channels.cache.get(gs.textChannelId) || guild.systemChannel

        try {
            const connection = joinVoiceChannel({ channelId: vc.id, guildId: guild.id, adapterCreator: guild.voiceAdapterCreator })
            await entersState(connection, VoiceConnectionStatus.Ready, 30_000)
            const player = createAudioPlayer()
            connection.subscribe(player)

            const q = createQueue(tc, connection, player, gs.voiceChannelId)
            q.songs = gs.songs || []
            q.radioUrl = gs.radioUrl
            q.radioName = gs.radioName
            q.radioStopped = gs.radioStopped ?? true
            q.volume = gs.volume || 1
            q.autoPlay = gs.autoPlay ?? true
            q.loop = gs.loop || false
            q.filter = gs.filter || "none"
            q.speed = gs.speed || 1
            queues.set(guildId, q)

            log("ok", `Resume guild ${guildId}`)
            if (gs.radioUrl && !gs.radioStopped) setTimeout(() => playRadio(guild, gs.radioUrl, gs.radioName), 3000)
            else if (gs.songs?.length) setTimeout(() => playSong(guild, gs.songs[0]), 3000)
        } catch (err) {
            log("error", `Resume ${guildId}:`, err.message)
        }
    }
})

// Bot kicked from VC -> auto-rejoin
client.on("voiceStateUpdate", (oldState, newState) => {
    if (!oldState.member || oldState.member.id !== client.user.id) return
    if (!oldState.channel || newState.channel) return

    log("warn", "Kicked from VC, retry in 5s")
    const queue = queues.get(oldState.guild.id)
    if (!queue) return
    queue.voiceChannelId = oldState.channel.id
    setTimeout(() => {
        const guild = client.guilds.cache.get(oldState.guild.id)
        const vc = guild?.channels.cache.get(oldState.channel.id)
        if (!vc) return
        try {
            const connection = joinVoiceChannel({ channelId: vc.id, guildId: guild.id, adapterCreator: guild.voiceAdapterCreator })
            connection.subscribe(queue.player)
            queue.connection = connection
            queue.radioReconnectAttempts = 0
            if (queue.radioUrl && !queue.radioStopped) playRadio(guild, queue.radioUrl, queue.radioName)
            else if (queue.songs.length) playSong(guild, queue.songs[0])
        } catch (err) { log("error", "Rejoin:", err.message) }
    }, 5000)
})

client.on("error", err => log("error", "Client:", err.message))
process.on("unhandledRejection", err => log("error", "UnhandledRejection:", err?.message || err))
process.on("uncaughtException", err => log("error", "UncaughtException:", err?.message || err))

// =========================================================
// Command dispatcher
// =========================================================
client.on("messageCreate", async msg => {
    if (!msg.content.startsWith(cfg.prefix)) return
    // hanya owner (msg dari akun sendiri) ATAU whitelisted users
    const isSelf = msg.author.id === client.user.id
    if (!isSelf) {
        if (cfg.allowedUsers.length === 0) return // jika kosong dan bukan diri sendiri, abaikan biar aman
        if (!cfg.allowedUsers.includes(msg.author.id)) return
    }

    const raw = msg.content.slice(cfg.prefix.length).trim()
    if (!raw) return
    const args = raw.split(/ +/)
    const cmdName = args.shift().toLowerCase()
    const cmd = registry.get(cmdName)
    if (!cmd) return

    // resolve targetGuild (support command dari DM)
    let targetGuild = msg.guild
    if (!targetGuild) {
        if (queues.size > 0) {
            targetGuild = client.guilds.cache.get(queues.keys().next().value)
        }
    }
    const queue = targetGuild ? queues.get(targetGuild.id) : null
    if (queue) queue.lastCommandAuthor = msg.author

    const voice = msg.member?.voice?.channel
        || (queue && targetGuild ? targetGuild.channels.cache.get(queue.voiceChannelId) : null)

    const ctx = {
        msg, args, query: args.join(" "),
        queue, voice, targetGuild, client, registry
    }

    try {
        await cmd.run(ctx)
    } catch (err) {
        log("error", `cmd ${cmdName}:`, err.message)
        try {
            const dm = await msg.author.createDM()
            await dm.send("❌ Error: " + err.message)
        } catch {}
    }
})

client.login(cfg.token).catch(err => {
    log("error", "Login gagal:", err.message)
    process.exit(1)
})
