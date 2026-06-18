const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const fs = require("fs");
const path = require("path");

const menuCmd = require('./menu.js'); // Root එකේ තියෙන මෙනුව

const app = express();
const PORT = process.env.PORT || 3000;

// Bot Config
const botLogoUrl = "https://i.ibb.co/FkvLpDYZ/1781795691025.png";
const botName = "Dark Matter XMD";

let sock = null;
const plugins = new Map();

// Load Plugins from /plugins folder
const pluginsDir = path.join(__dirname, 'plugins');
if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir);

fs.readdirSync(pluginsDir).forEach(file => {
    if (file.endsWith('.js')) {
        try {
            const plugin = require(path.join(pluginsDir, file));
            if (plugin.command) plugins.set(plugin.command, plugin);
        } catch (e) {
            console.log(`Error loading plugin ${file}:`, e);
        }
    }
});

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') console.log(`🎉 ${botName} IS READY!`);
    });

    sock.ev.on('messages.upsert', async (m) => {
        const mek = m.messages[0];
        if (!mek.message || !m.type === 'notify') return;
        
        const from = mek.key.remoteJid;
        const text = mek.message.conversation || mek.message.extendedTextMessage?.text || "";
        
        if (text.startsWith('.')) {
            const command = text.slice(1).split(' ')[0].toLowerCase();
            
            // 1. Menu Command Handling (From Root)
            if (command === 'menu' || command === 'help') {
                await menuCmd.execute(sock, mek, from, botLogoUrl, "");
                return;
            }

            // 2. Plugins Handling
            if (plugins.has(command)) {
                await plugins.get(command).execute(sock, mek, from, botLogoUrl);
            }
        }
    });
}

// Pairing Route
app.get('/code', async (req, res) => {
    const num = req.query.number;
    if (!num) return res.status(400).json({ error: "Number required" });
    try {
        const code = await sock.requestPairingCode(num.replace(/[^0-9]/g, ""));
        res.json({ code });
    } catch (e) {
        res.status(500).json({ error: "Could not get code" });
    }
});

app.listen(PORT, () => {
    console.log(`Web Server running on port ${PORT}`);
    startBot();
});
