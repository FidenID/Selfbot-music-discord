const { read, writeDebounced } = require("../store")

const FILE = "playlists.json"

function load() { return read(FILE, {}) }
function save(data) { writeDebounced(FILE, data) }

function getUser(userId) {
    const data = load()
    return data[userId] || {}
}

function listNames(userId) {
    return Object.keys(getUser(userId))
}

function get(userId, name) {
    const u = getUser(userId)
    return u[name.toLowerCase()] || null
}

function setPlaylist(userId, name, songs) {
    const data = load()
    if (!data[userId]) data[userId] = {}
    data[userId][name.toLowerCase()] = {
        name,
        songs: songs.map(s => ({ title: s.title, url: s.url, duration: s.duration })),
        updated: Date.now()
    }
    save(data)
}

function remove(userId, name) {
    const data = load()
    if (!data[userId]) return false
    const ok = delete data[userId][name.toLowerCase()]
    save(data)
    return ok
}

module.exports = { listNames, get, setPlaylist, remove }
