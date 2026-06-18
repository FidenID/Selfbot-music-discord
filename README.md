# 🎵 Bot-DC v2 — Powerful Personal Discord Selfbot

Selfbot Discord pribadi dengan musik, radio, AFK, reminder, weather, translate, audio filter, dan stealth mode.

> ⚠️ **Peringatan:** Selfbot melanggar [TOS Discord](https://discord.com/terms). Gunakan dengan risiko sendiri. Bot ini didesain untuk **personal use** dengan stealth mode bawaan supaya tidak terlihat seperti bot.

---

## ✨ Fitur

### 🎶 Musik
- Putar dari **YouTube**, **TikTok**, **SoundCloud**, **playlist YouTube**
- `?seek`, `?replay`, `?previous`, `?shuffle`, `?remove`, `?move`, `?jump`
- **Filter audio**: bassboost, nightcore, slowed, vaporwave, 8d, karaoke, treble, pitch_up/down, earrape
- **Speed control** 0.25x–4.0x
- Loop song / loop queue / off
- Autoplay rekomendasi YouTube
- Lirik otomatis
- Progress bar real-time

### 📻 Radio
- Streaming radio dari Radio Browser API (ribuan stasiun)
- Auto-reconnect dengan exponential backoff

### 📚 Personal
- **Saved playlists** per user
- **Favorites** (bookmark lagu)
- **History** 50 lagu terakhir per user

### 🛠️ Utility
- **AFK mode** — auto-reply DM saat di-mention, hilang otomatis saat kamu kirim pesan
- **Reminders** — `?remind 30m beli makan` / `?remind 18:00 sholat` (persist setelah restart)
- **Weather** — `?w Jakarta` via wttr.in (no API key)
- **Translate** — `?tr id hello world` via Google (no API key)
- Whitelist user, ping, uptime, status, clear, joinlink

### 🥷 Stealth
- Random typing delay sesuai panjang pesan (terlihat seperti mengetik manual)
- Jitter pada response time
- Reply default ke DM (tidak nampak di channel)
- Reaction `✉️` random (tidak selalu)
- Whitelist ketat (default: hanya akun sendiri)

---

## 📦 Instalasi

> ⚠️ **Requirements:** Node.js v22+ (akan diinstall otomatis oleh script)

### Metode 1: Automatic Installation (Recommended)

#### Linux (Ubuntu/Debian)
```bash
git clone <repo> bot-dc-v2
cd bot-dc-v2
chmod +x install-linux.sh
./install-linux.sh
```

#### macOS
```bash
git clone <repo> bot-dc-v2
cd bot-dc-v2
chmod +x install-macos.sh
./install-macos.sh
```

#### Windows
```powershell
git clone <repo> bot-dc-v2
cd bot-dc-v2
# Run PowerShell as Administrator
.\install-windows.ps1
```

Script akan otomatis install:
- **NVM** dan **Node.js 22**
- **ffmpeg** (audio processing)
- **yt-dlp** (download dari YouTube/TikTok/SoundCloud)
- **Deno** (JavaScript runtime untuk yt-dlp)
- **PM2** (process manager)
- **Dependencies Node.js**

### Metode 2: Manual Installation

#### 1. Install Node.js 22 via NVM
```bash
# Linux/macOS
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc  # atau ~/.zshrc untuk macOS
nvm install 22
nvm use 22

# Windows: Download NVM for Windows dari https://github.com/coreybutler/nvm-windows
```

#### 2. Install dependencies sistem
```bash
# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install -y ffmpeg
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod +x /usr/local/bin/yt-dlp
curl -fsSL https://deno.land/install.sh | sh

# macOS
brew install ffmpeg yt-dlp deno

# Windows (via Chocolatey, run as Administrator)
choco install ffmpeg yt-dlp deno -y
```

#### 3. Install Node.js dependencies
```bash
npm install
```

#### 4. Setup `.env`
```bash
nano .env  # atau notepad .env di Windows
```
Isi minimal:
```env
DISCORD_TOKEN=token_kamu_di_sini
DISCORD_PREFIX=?
ALLOWED_USERS=
STEALTH=true
REPLY_DM=true
```

> 🔑 **Cara dapat token:** Buka Discord di browser → F12 → Network → cari request dengan header `Authorization`. Token bersifat **sangat rahasia**, jangan dibagikan.

#### 5. (Opsional) Cookies YouTube
Untuk bypass bot detection / video age-restricted:
- Install ekstensi [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
- Login YouTube → export → simpan sebagai `cookies.txt` di root project

### Menjalankan Bot

**Development:**
```bash
npm start
```

**Production (dengan PM2, recommended):**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # auto-start saat reboot
```

---

## 📋 Daftar Command (prefix default `?`)

### 🎶 Musik
| Command | Deskripsi |
|---|---|
| `?p <judul/URL>` | Putar (YT/TikTok/SoundCloud/playlist) |
| `?search <q>` | Cari & pilih 1-4 |
| `?skip` `?s` | Skip lagu |
| `?stop` | Stop & clear semua |
| `?pause` `?resume` | Pause/lanjutkan |
| `?seek <mm:ss>` | Loncat ke waktu |
| `?replay` | Ulang dari awal |
| `?previous` `?prev` | Lagu sebelumnya |
| `?volume <1-200>` | Atur volume |
| `?loop [song/queue/off]` | Mode loop |
| `?autoplay` | Toggle rekomendasi YouTube |
| `?nowplaying` `?np` | Lagu sekarang + progress bar |
| `?lyrics` | Lirik ke DM |

### 📋 Queue
| Command | Deskripsi |
|---|---|
| `?queue [hal]` | Lihat queue |
| `?clearqueue` `?cq` | Kosongkan |
| `?shuffle` | Acak |
| `?remove <n>` | Hapus #n |
| `?move <a> <b>` | Pindah posisi |
| `?jump <n>` | Loncat ke #n |

### 🎛️ Filter / Speed
| Command | Deskripsi |
|---|---|
| `?filter <nama>` | bassboost, nightcore, slowed, vaporwave, 8d, karaoke, treble, pitch_up/down, earrape, none |
| `?speed <0.25-4.0>` | Atur kecepatan |
| `?reset` | Reset filter & speed |

### 📻 Radio
| Command | Deskripsi |
|---|---|
| `?radio <nama/URL>` | Putar radio |
| `?stopradio` `?sr` | Stop radio |

### 🎙️ Voice
| Command | Deskripsi |
|---|---|
| `?join [nama VC]` | Join VC |
| `?leave` `?dc` | Keluar |

### 📚 Personal
| Command | Deskripsi |
|---|---|
| `?playlist save <nama>` | Simpan queue saat ini |
| `?playlist load <nama>` | Putar playlist |
| `?playlist list` | Daftar playlist |
| `?playlist show <nama>` | Isi playlist |
| `?playlist del <nama>` | Hapus |
| `?fav add` | Favoritkan lagu sekarang |
| `?fav list` `?fav play` `?fav remove <n>` | |
| `?history [clear]` | History 15 lagu terakhir |

### 🛠️ Utility
| Command | Deskripsi |
|---|---|
| `?afk [pesan / off]` | AFK auto-reply |
| `?remind <30m\|HH:MM> <pesan>` | Set reminder |
| `?reminders` | List reminder aktif |
| `?delremind <id>` | Hapus reminder |
| `?weather <kota>` `?w` | Cuaca |
| `?tr <bahasa> <teks>` | Translate (id/en/ja/dst) |
| `?status` `?ping` `?uptime` | Info bot |
| `?clear [n]` | Hapus pesan bot sendiri |
| `?joinlink <kode>` | Join server via invite |
| `?help` | Daftar lengkap ke DM |

### 👥 Whitelist
| Command | Deskripsi |
|---|---|
| `?adduser <@user/ID>` | Tambah |
| `?removeuser <@user/ID/all>` | Hapus |
| `?listusers` | Lihat |

---

## 🔒 Keamanan & Stealth

- **Default whitelist ketat:** kalau `ALLOWED_USERS` kosong, hanya akun sendiri yang bisa pakai command. Tidak ada orang lain di server yang bisa trigger.
- **Reply ke DM:** semua response ke DM kamu, channel tidak penuh dengan respon bot.
- **Stealth typing:** delay response sesuai panjang teks (mirip orang ngetik).
- **Persistence:** state, reminder, playlist, history semua disimpan di `data/` dan dipulihkan setelah restart.
- **Auto-rejoin VC** kalau ditendang.

Atur via `.env`:
```
STEALTH=true     # false untuk respon instan
REPLY_DM=true    # false untuk reply di channel
```

---

## 📁 Struktur

```
bot-dc-v2/
├── src/
│   ├── index.js           # entry point
│   ├── config.js
│   ├── logger.js
│   ├── store.js
│   ├── stealth.js
│   ├── reply.js
│   ├── voice/             # queue, stream, play, connect
│   ├── services/          # youtube, tiktok, soundcloud, radio, lyrics, weather, translate
│   ├── state/             # afk, reminders, history, playlists, favorites
│   ├── commands/          # semua command modular
│   └── utils/format.js
├── data/                  # state, reminders, playlists, history (auto-created)
├── tmp/                   # temp file (auto-created)
├── package.json
├── .env.example
├── Dockerfile
└── docker-compose.yml
```

---

## 🐛 Troubleshooting

**Bot tidak join VC:**
Pastikan kamu di VC saat pakai `?p`, atau `?join <nama VC>`.

**Lagu no sound:**
```bash
ffmpeg -version
yt-dlp --version
```
Pastikan keduanya terinstall.

**YouTube bot detection:**
Pakai `cookies.txt` (lihat langkah 5).

**DM tidak masuk:**
Setting privasi Discord → izinkan DM dari anggota server yang sama.

**`Cannot find module '@discordjs/opus'`:**
```bash
npm install @discordjs/opus
```

---

## 📄 Lisensi

MIT — untuk keperluan pribadi & edukasi.
