const fs = require("fs")
const { reply } = require("../reply")
const { cfg } = require("../config")
const { formatUptime } = require("../utils/format")
const { startTime } = require("../state/runtime")

module.exports = [{
    names: ["ping"], description: "Cek latency",
    async run({ msg }) {
        const sent = await reply(msg, "🏓 Pong!", { fast: true })
        if (sent) {
            try { await sent.edit(`🏓 Pong! **${sent.createdTimestamp - msg.createdTimestamp}ms**`) } catch {}
        }
    }
}, {
    names: ["uptime"], description: "Uptime bot",
    async run({ msg }) { return reply(msg, `⏱️ Uptime: **${formatUptime(Date.now() - startTime)}**`) }
}, {
    names: ["status"], description: "Status lengkap",
    async run({ msg, queue }) {
        const hasCookies = fs.existsSync(cfg.cookiesFile)
        return reply(msg,
            `📊 **Status**\n` +
            `🎵 Playing: **${queue?.lastSong?.title || "Tidak ada"}**\n` +
            `📋 Queue: **${queue?.songs?.length || 0}**\n` +
            `🔊 Vol: **${Math.round((queue?.volume || 1) * 100)}%**\n` +
            `🔁 Loop: **${queue?.loop || "off"}**\n` +
            `🎲 AP: **${queue?.autoPlay ? "on" : "off"}**\n` +
            `🎛️ Filter: **${queue?.filter || "none"}** | ⚡ **${queue?.speed || 1}x**\n` +
            `🍪 Cookies: **${hasCookies ? "✅" : "❌"}**\n` +
            `🥷 Stealth: **${cfg.stealth ? "on" : "off"}**\n` +
            `⏱️ Uptime: **${formatUptime(Date.now() - startTime)}**`
        )
    }
}, {
    names: ["clear"], description: "Hapus pesan bot sendiri",
    async run({ msg, args }) {
        if (!msg.guild) return reply(msg, "❌ Hanya di server.")
        try {
            const amount = Math.min(parseInt(args[0]) || 10, 100)
            const messages = await msg.channel.messages.fetch({ limit: amount }).catch(() => new Map())
            if (messages.size === 0) return reply(msg, "❌ Gagal fetch messages, coba lagi")
            const mine = messages.filter(m => m.author.id === msg.client.user.id)
            if (mine.size === 0) return reply(msg, "ℹ️ Tidak ada pesan untuk dihapus")
            
            let deleted = 0
            for (const m of mine.values()) { 
                try { 
                    await m.delete()
                    deleted++
                    await new Promise(r => setTimeout(r, 500))
                } catch (e) {
                    console.error('[clear]', e.message)
                }
            }
            const c = await msg.channel.send(`🗑️ Hapus **${deleted}** pesan`).catch(() => null)
            if (c) setTimeout(() => c.delete().catch(() => {}), 3000)
        } catch (err) {
            console.error('[clear]', err)
            reply(msg, "❌ " + err.message)
        }
    }
}, {
    names: ["joinlink"], description: "Join server lewat invite",
    async run({ msg, query }) {
        if (!query) return reply(msg, `❌ Contoh: \`${cfg.prefix}joinlink discord.gg/xxxx\``)
        try {
            const code = query.replace(/^https?:\/\//, "").replace("discord.gg/", "")
            await msg.client.acceptInvite(code)
            reply(msg, "✅ Joined")
        } catch (err) {
            reply(msg, "❌ " + err.message)
        }
    }
}, {
    names: ["help", "h", "?"], description: "Tampilkan semua command",
    async run({ msg, registry }) {
        const p = cfg.prefix
        const text = `
🎵 **Bot v2 — Command List**

**🎶 Musik:**
\`${p}p <judul/URL>\` putar (YT/TikTok/SoundCloud/playlist)
\`${p}search <q>\` cari & pilih 1-4
\`${p}skip\` \`${p}stop\` \`${p}pause\` \`${p}resume\` \`${p}replay\` \`${p}previous\`
\`${p}seek <waktu>\` \`${p}volume <1-200>\` \`${p}loop [song|queue|off]\` \`${p}autoplay\`
\`${p}nowplaying\` \`${p}lyrics\`

**📋 Queue:**
\`${p}queue [p]\` \`${p}clearqueue\` \`${p}shuffle\` \`${p}remove <n>\` \`${p}move <a> <b>\` \`${p}jump <n>\`

**🎛️ Filter:**
\`${p}filter <nama>\` (bassboost, nightcore, slowed, vaporwave, 8d, karaoke, treble, earrape, pitch_up, pitch_down, none)
\`${p}speed <0.25-4.0>\` \`${p}reset\`

**📻 Radio:** \`${p}radio <nama/URL>\` \`${p}stopradio\`
**🎙️ Voice:** \`${p}join [VC]\` \`${p}leave\`

**📚 Personal:**
\`${p}playlist save|load|list|del|show <nama>\`
\`${p}fav add|list|remove|play\`
\`${p}history [clear]\`

**🛠️ Utility:**
\`${p}remind <30m|HH:MM> <pesan>\` \`${p}reminders\` \`${p}delremind <id>\`
\`${p}weather <kota>\` \`${p}tr <bahasa> <teks>\`
\`${p}status\` \`${p}ping\` \`${p}uptime\` \`${p}clear [n]\` \`${p}joinlink <kode>\`

**👥 Whitelist:**
\`${p}adduser\` \`${p}removeuser\` \`${p}listusers\`
        `.trim()
        return reply(msg, text)
    }
}]
