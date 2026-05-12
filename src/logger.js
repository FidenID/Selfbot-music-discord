const ICONS = { info: "ℹ️", warn: "⚠️", error: "❌", ok: "✅", music: "🎵", radio: "📻", debug: "🔧" }

function log(level, ...args) {
    const t = new Date().toTimeString().slice(0, 8)
    console.log(`[${t}] ${ICONS[level] || "•"}`, ...args)
}

module.exports = { log }
