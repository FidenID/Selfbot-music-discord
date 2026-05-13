module.exports = {
    apps: [{
        name: "bot-dc-v2",
        script: "./src/index.js",
        cwd: __dirname,
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: "500M",
        max_restarts: 10,
        min_uptime: "30s",
        restart_delay: 3000,
        env: {
            NODE_ENV: "production"
        },
        error_file: "./data/pm2-error.log",
        out_file: "./data/pm2-out.log",
        time: true
    }]
}
