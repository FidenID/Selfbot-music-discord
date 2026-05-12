const { read, writeDebounced } = require("../store")

const FILE = "favorites.json"

function load() { return read(FILE, {}) }
function save(data) { writeDebounced(FILE, data) }

function getFavs(userId) {
    return load()[userId] || []
}

function addFav(userId, song) {
    if (!song?.url) return false
    const data = load()
    if (!data[userId]) data[userId] = []
    if (data[userId].some(s => s.url === song.url)) return false
    data[userId].push({ title: song.title, url: song.url, duration: song.duration })
    save(data)
    return true
}

function removeFav(userId, index) {
    const data = load()
    if (!data[userId] || index < 0 || index >= data[userId].length) return false
    data[userId].splice(index, 1)
    save(data)
    return true
}

module.exports = { getFavs, addFav, removeFav }
