const { cfg } = require("./config")
const { humanDelay, showTyping, sleep } = require("./stealth")
const { log } = require("./logger")

async function reply(msg, content, opts = {}) {
    if (cfg.stealth && !opts.fast) {
        const delay = humanDelay(typeof content === "string" ? content : "")
        await sleep(delay)
    }

    try {
        const dm = await msg.author.createDM()
        const sent = await dm.send(content)
        try { if (!cfg.stealth || Math.random() < 0.3) await msg.react("✉️") } catch {}
        return sent
    } catch (e) {
        log("warn", "DM gagal:", e.message)
    }
}

/**
 * Notify yang tersimpan di queue (untuk event background, mis. lagu selesai)
 */
async function notifyDM(queue, content) {
    if (!queue?.lastCommandAuthor || queue.silent) return
    try {
        const dm = await queue.lastCommandAuthor.createDM()
        return await dm.send(content)
    } catch {}
}

module.exports = { reply, notifyDM }
