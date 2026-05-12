const { read, writeDebounced } = require("../store")

const FILE = "history.json"
const MAX_PER_USER = 50

function load() { return read(FILE, {}) }
function save(data) { writeDebounced(FILE, data) }

function addHistory(userId, song) {
    if (!song?.url) return
    const data = load()
    const entry = { title: song.title, url: song.url, duration: song.duration, ts: Date.now() }
    if (!data[userId]) data[userId] = []
    // dedupe consecutive
    if (data[userId][0]?.url === entry.url) return
    data[userId].unshift(entry)
    if (data[userId].length > MAX_PER_USER) data[userId].length = MAX_PER_USER
    save(data)
}

function getHistory(userId, limit = 10) {
    const data = load()
    return (data[userId] || []).slice(0, limit)
}

function clearHistory(userId) {
    const data = load()
    delete data[userId]
    save(data)
}

module.exports = { addHistory, getHistory, clearHistory }
