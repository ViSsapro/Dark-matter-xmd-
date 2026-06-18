module.exports = {
    command: 'alive', // මෙන්න මෙතන තමයි command එක තියෙන්නේ
    execute: async (sock, mek, from, botLogoUrl) => {
        const aliveMsg = `👋 *Dark Matter XMD IS ALIVE NOW*

*OWNER* - Vimukthi Thuhina × White Dragon
*VERSION* - 1.0.0
*STATUS* - Online ✅

💬 සියලුම විධානයන් බැලීමට .menu ලෙස ටයිප් කරන්න!`;

        await sock.sendMessage(from, { 
            image: { url: botLogoUrl }, 
            caption: aliveMsg 
        }, { quoted: mek });
    }
};
