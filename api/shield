const axios = require('axios');

export default async function handler(req, res) {
    // 1. ADD THESE HEADERS AT THE VERY TOP
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // 2. Handle the "Preflight" request (The browser sends this first)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const TOKEN = process.env.MATRIX_ADMIN_TOKEN;
    const FEED_ROOM = process.env.MATRIX_ROOM_ID;
    const DATA_ROOM = process.env.MATRIX_METADATA_ROOM_ID;
    const BASE_URL = "https://matrix.org/_matrix/client/r0";

    try {
        if (req.method === 'GET') {
            const [f, d] = await Promise.all([
                axios.get(`${BASE_URL}/rooms/${encodeURIComponent(FEED_ROOM)}/messages?limit=100&dir=b&access_token=${TOKEN}`),
                axios.get(`${BASE_URL}/rooms/${encodeURIComponent(DATA_ROOM)}/messages?limit=200&dir=b&access_token=${TOKEN}`)
            ]);
            return res.json({
                feed: f.data.chunk.filter(m => m.type === "m.room.message" && m.content.body).map(m => ({
                    id: m.event_id, user: m.sender.split(':')[0].replace('@',''), text: m.content.body
                })),
                metadata: d.data.chunk.map(m => m.content.body)
            });
        }

        if (req.method === 'POST') {
            const { username, message, isSystem } = req.body;
            const target = isSystem ? DATA_ROOM : FEED_ROOM;
            const body = isSystem ? message : `${username}: ${message}`;
            await axios.post(`${BASE_URL}/rooms/${encodeURIComponent(target)}/send/m.room.message?access_token=${TOKEN}`, {
                body: body, msgtype: "m.text"
            });
            return res.json({ success: true });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Shield Error", details: err.message });
    }
}