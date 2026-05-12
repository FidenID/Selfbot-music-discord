const { cfg } = require("./config")
const { humanDelay, showTyping, sleep } = require("./stealth")
const { log } = require("./logger")

/**
 * Smart reply:
 * - Default: kirim ke DM user (privasi & tidak terlihat di server)
 * - Stealth: simulate typing delay sebelum balas
 * - Fallback ke channel kalau DM gagal
 */
async function reply(msg, content, opts = {}) {
    const useDM = opts.dm ?? cfg.replyDM
    const target = useDM ? null : msg.channel

    if (cfg.stealth && !opts.fast) {
        const delay = humanDelay(typeof content === "string" ? content : "")
        if (target) showTyping(target, delay).catch(() => {})
        await sleep(delay)
    }

    if (useDM) {
        try {
            const dm = await msg.author.createDM()
            const sent = await dm.send(content)
            try { if (!cfg.stealth || Math.random() < 0.3) await msg.react("✉️") } catch {}
            return sent
        } catch (e) {
            log("warn", "DM gagal, fallback ke channel:", e.message)
        }
    }
    try {
        return await msg.channel.send(content)
    } catch (e) {
        log("warn", "channel.send gagal:", e.message)
    }
}

/**
 * Notify yang tersimpan di queue (untuk event background, mis. lagu selesai)
 */
async function notifyDM(queue, content) {
    if (!queue) return
    if (queue.lastCommandAuthor) {
        try {
            const dm = await queue.lastCommandAuthor.createDM()
            return await dm.send(content)
        } catch {}
    }
    try { return await queue.textChannel?.send(content) } catch {}
}

module.exports = { reply, notifyDM }
