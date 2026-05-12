const { reply } = require("../reply")
const { cfg, persistAllowedUsers } = require("../config")

module.exports = [{
    names: ["adduser"], description: "Tambah user ke whitelist",
    async run({ msg, args }) {
        if (!args[0]) return reply(msg, `❌ Contoh: \`${cfg.prefix}adduser <@user|ID>\``)
        const userId = msg.mentions?.users?.first()?.id || args[0]
        if (cfg.allowedUsers.includes(userId)) return reply(msg, "ℹ️ Sudah ada")
        cfg.allowedUsers.push(userId)
        persistAllowedUsers()
        return reply(msg, `✅ Tambah **${userId}**`)
    }
}, {
    names: ["removeuser", "deluser"], description: "Hapus user dari whitelist",
    async run({ msg, args }) {
        if (!args[0]) return reply(msg, `❌ Contoh: \`${cfg.prefix}removeuser <@user|ID|all>\``)
        if (args[0] === "all") {
            cfg.allowedUsers = []
            persistAllowedUsers()
            return reply(msg, "✅ Semua dihapus")
        }
        const userId = msg.mentions?.users?.first()?.id || args[0]
        if (!cfg.allowedUsers.includes(userId)) return reply(msg, "❌ Tidak ada")
        cfg.allowedUsers = cfg.allowedUsers.filter(id => id !== userId)
        persistAllowedUsers()
        return reply(msg, `✅ Hapus **${userId}**`)
    }
}, {
    names: ["listusers"], description: "Lihat whitelist",
    async run({ msg }) {
        if (!cfg.allowedUsers.length) return reply(msg, "📋 Semua user diizinkan")
        return reply(msg, `📋 **Whitelist:**\n${cfg.allowedUsers.map((id, i) => `**${i+1}.** \`${id}\``).join("\n")}`)
    }
}]
