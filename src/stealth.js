const { cfg } = require("./config")

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// Calculate human-like delay based on response length
function humanDelay(text) {
    if (!cfg.stealth) return 0
    const len = (text || "").length
    // ~30 chars/sec typing + small jitter
    const base = Math.min(2500, len * 25 + rand(150, 600))
    return base
}

// Indicate typing in a channel for the given duration
async function showTyping(channel, ms) {
    if (!cfg.stealth || !channel || ms <= 0) return
    try {
        await channel.sendTyping()
        // Discord typing indicator lasts ~10s, refresh if longer
        const start = Date.now()
        while (Date.now() - start < ms - 100) {
            await sleep(Math.min(8000, ms - (Date.now() - start)))
            if (Date.now() - start < ms - 100) {
                try { await channel.sendTyping() } catch {}
            }
        }
    } catch {}
}

// Strip excessive bot-like emoji/markup if stealth enabled (lightweight cleanup)
function softenText(text) {
    if (!cfg.stealth) return text
    return text
}

// Pick a small chance to react instead of replying for short ack messages
function shouldReactOnly() {
    if (!cfg.stealth) return false
    return Math.random() < 0.15
}

module.exports = { rand, sleep, humanDelay, showTyping, softenText, shouldReactOnly }
