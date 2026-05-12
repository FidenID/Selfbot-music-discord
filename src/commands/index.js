const modules = [
    require("./music"),
    require("./queueCmds"),
    require("./audio"),
    require("./radio"),
    require("./voiceCmds"),
    require("./playlist"),
    require("./afk"),
    require("./remind"),
    require("./weather"),
    require("./translate"),
    require("./whitelist"),
    require("./utility")
]

const registry = new Map()
for (const mod of modules) {
    for (const cmd of mod) {
        for (const name of cmd.names) {
            registry.set(name.toLowerCase(), cmd)
        }
    }
}

function getAll() {
    const seen = new Set()
    const out = []
    for (const cmd of registry.values()) {
        if (seen.has(cmd)) continue
        seen.add(cmd)
        out.push(cmd)
    }
    return out
}

module.exports = { registry, getAll }
