const axios = require('axios');

export default async function handler(req, res) {
    // Correcting the CORS headers seen in your logs
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Your actual credentials from the latest request
    const TOKEN = "mct_9NRAuvt4XEtPNAEJ2KzcUNBs2JRcFb_rnJ3C2"; 
    const FEED_ROOM = "!XyqmTxnJJwcOdHTeSi:matrix.org";
    const BASE_URL = "https://matrix.org/_matrix/client/r0";

    try {
        if (req.method === 'GET') {
            const response = await axios.get(`${BASE_URL}/rooms/${encodeURIComponent(FEED_ROOM)}/messages?limit=50&dir=b&access_token=${TOKEN}`);
            const feed = response.data.chunk
                .filter(m => m.type === "m.room.message" && m.content.body)
                .map(m => ({
                    id: m.event_id,
                    user: m.sender.split(':')[0].replace('@',''),
                    text: m.content.body
                }));
            return res.json({ feed });
        }

        if (req.method === 'POST') {
            const { username, message } = req.body;
            await axios.post(`${BASE_URL}/rooms/${encodeURIComponent(FEED_ROOM)}/send/m.room.message?access_token=${TOKEN}`, {
                body: `${username}: ${message}`,
                msgtype: "m.text"
            });
            return res.json({ success: true });
        }
    } catch (err) {
        // Detailed error reporting to fix the 500 error
        return res.status(500).json({ 
            error: "Matrix Auth Failed", 
            details: err.response?.data?.error || err.message 
        });
    }
}