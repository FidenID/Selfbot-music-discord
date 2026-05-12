const { read, writeDebounced } = require("../store")

const queues = new Map()

function createQueue(textChannel, connection, player, voiceChannelId) {
    return {
        textChannel,
        connection,
        player,
        songs: [],
        history: [],
        voiceChannelId,
        volume: 1,
        loop: false,            // false | "song" | "queue"
        autoPlay: true,
        autoPlaying: false,
        lastSong: null,
        currentProcesses: null,
        currentResource: null,
        songStartTime: null,
        seekOffset: 0,
        filter: "none",
        speed: 1,
        radioUrl: null,
        radioName: null,
        radioStopped: true,
        radioFfmpeg: null,
        radioReconnectAttempts: 0,
        lastCommandAuthor: null
    }
}

function saveState() {
    const state = {}
    for (const [gid, q] of queues) {
        state[gid] = {
            voiceChannelId: q.voiceChannelId,
            songs: q.songs.map(s => ({ title: s.title, url: s.url, duration: s.duration })),
            radioUrl: q.radioUrl,
            radioName: q.radioName,
            radioStopped: q.radioStopped,
            textChannelId: q.textChannel?.id,
            volume: q.volume,
            autoPlay: q.autoPlay,
            loop: q.loop,
            filter: q.filter,
            speed: q.speed
        }
    }
    writeDebounced("state.json", state)
}

function loadState() { return read("state.json", null) }

module.exports = { queues, createQueue, saveState, loadState }
