const { read, write } = require("../store")
const { log } = require("../logger")

const FILE = "reminders.json"
const timers = new Map()
let _client = null

function load() { return read(FILE, []) }
function persist(list) { write(FILE, list) }

function nextId(list) {
    return (list.reduce((m, r) => Math.max(m, r.id || 0), 0) || 0) + 1
}

async function fire(reminder) {
    if (!_client) return
    try {
        const user = await _client.users.fetch(reminder.userId)
        if (user) {
            const dm = await user.createDM()
            await dm.send(`⏰ **Reminder:** ${reminder.message}\n*Diset ${new Date(reminder.createdAt).toLocaleString("id-ID")}*`)
        }
    } catch (e) { log("warn", "reminder fire:", e.message) }
    // hapus dari file
    const list = load().filter(r => r.id !== reminder.id)
    persist(list)
    timers.delete(reminder.id)
}

function schedule(reminder) {
    const delay = reminder.fireAt - Date.now()
    if (delay <= 0) {
        fire(reminder)
        return
    }
    // setTimeout max ~24.8 days; long delays loop
    const cap = 2_000_000_000
    if (delay > cap) {
        const t = setTimeout(() => schedule(reminder), cap)
        timers.set(reminder.id, t)
        return
    }
    const t = setTimeout(() => fire(reminder), delay)
    timers.set(reminder.id, t)
}

function init(client) {
    _client = client
    const list = load()
    for (const r of list) schedule(r)
    log("info", `Loaded ${list.length} pending reminder(s)`)
}

function add(userId, fireAt, message) {
    const list = load()
    const reminder = { id: nextId(list), userId, fireAt, message, createdAt: Date.now() }
    list.push(reminder)
    persist(list)
    schedule(reminder)
    return reminder
}

function listForUser(userId) {
    return load().filter(r => r.userId === userId).sort((a, b) => a.fireAt - b.fireAt)
}

function remove(userId, id) {
    const list = load()
    const idx = list.findIndex(r => r.id === id && r.userId === userId)
    if (idx === -1) return false
    list.splice(idx, 1)
    persist(list)
    if (timers.has(id)) { clearTimeout(timers.get(id)); timers.delete(id) }
    return true
}

module.exports = { init, add, listForUser, remove }
