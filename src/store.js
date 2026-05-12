const fs = require("fs")
const path = require("path")
const { cfg } = require("./config")
const { log } = require("./logger")

const writeTimers = new Map()

function file(name) { return path.join(cfg.dataDir, name) }

function read(name, fallback) {
    try {
        const p = file(name)
        if (!fs.existsSync(p)) return fallback
        return JSON.parse(fs.readFileSync(p, "utf8"))
    } catch (e) {
        log("warn", `store.read ${name}:`, e.message)
        return fallback
    }
}

function write(name, data) {
    try {
        fs.writeFileSync(file(name), JSON.stringify(data, null, 2))
    } catch (e) {
        log("error", `store.write ${name}:`, e.message)
    }
}

// Debounced write per file
function writeDebounced(name, data, delay = 300) {
    if (writeTimers.has(name)) clearTimeout(writeTimers.get(name))
    writeTimers.set(name, setTimeout(() => {
        write(name, data)
        writeTimers.delete(name)
    }, delay))
}

module.exports = { read, write, writeDebounced }
