const axios = require('axios');

export default async function handler(req, res) {
    const TOKEN = process.env.MATRIX_ADMIN_TOKEN;
    const FEED_ROOM = process.env.MATRIX_ROOM_ID;
    const DATA_ROOM = process.env.MATRIX_METADATA_ROOM_ID;
    const BASE_URL = "https://matrix.org/_matrix/client/r0";

    // Allow the frontend to talk to this API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            const [f, d] = await Promise.all([
                axios.get(`${BASE_URL}/rooms/${encodeURIComponent(FEED_ROOM)}/messages?limit=50&dir=b&access_token=${TOKEN}`),
                axios.get(`${BASE_URL}/rooms/${encodeURIComponent(DATA_ROOM)}/messages?limit=100&dir=b&access_token=${TOKEN}`)
            ]);
            return res.json({
                feed: f.data.chunk.filter(m => m.type === "m.room.message").map(m => ({
                    id: m.event_id,
                    user: m.sender.split(':')[0].replace('@',''),
                    text: m.content.body
                })),
                metadata: d.data.chunk.map(m => m.content.body)
            });
        }

        if (req.method === 'POST') {
            const { username, message, isSystem } = req.body;
            const target = isSystem ? DATA_ROOM : FEED_ROOM;
            const body = isSystem ? message : `${username} [IP:Hidden]: ${message}`;
            await axios.post(`${BASE_URL}/rooms/${encodeURIComponent(target)}/send/m.room.message?access_token=${TOKEN}`, {
                body: body, msgtype: "m.text"
            });
            return res.json({ success: true });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}