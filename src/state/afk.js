// In-memory AFK state for the selfbot owner
let state = {
    active: false,
    message: "",
    since: 0,
    mentions: 0,
    lastReplyTo: new Map() // userId -> timestamp
}

const COOLDOWN_MS = 5 * 60 * 1000

function setAfk(message) {
    state = {
        active: true,
        message: message || "Saya sedang AFK",
        since: Date.now(),
        mentions: 0,
        lastReplyTo: new Map()
    }
}

function clearAfk() {
    const had = state.active
    const m = state.mentions
    state = { active: false, message: "", since: 0, mentions: 0, lastReplyTo: new Map() }
    return { wasActive: had, mentions: m }
}

function isAfk() { return state.active }
function getMessage() { return state.message }
function getSince() { return state.since }

function shouldReply(userId) {
    if (!state.active) return false
    const last = state.lastReplyTo.get(userId)
    if (last && Date.now() - last < COOLDOWN_MS) return false
    state.lastReplyTo.set(userId, Date.now())
    state.mentions++
    return true
}

module.exports = { setAfk, clearAfk, isAfk, getMessage, getSince, shouldReply }
