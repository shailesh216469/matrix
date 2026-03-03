const axios = require('axios');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { MATRIX_ADMIN_TOKEN, MATRIX_ROOM_ID, MATRIX_METADATA_ROOM_ID } = process.env;

    // Validation Check
    if (!MATRIX_ADMIN_TOKEN || !MATRIX_ROOM_ID) {
        return res.status(500).json({ error: "Missing Environment Variables in Vercel" });
    }

    const BASE_URL = "https://matrix.org/_matrix/client/r0";

    try {
        if (req.method === 'GET') {
            const response = await axios.get(`${BASE_URL}/rooms/${encodeURIComponent(MATRIX_ROOM_ID)}/messages?limit=50&dir=b&access_token=${MATRIX_ADMIN_TOKEN}`);
            
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
            await axios.post(`${BASE_URL}/rooms/${encodeURIComponent(MATRIX_ROOM_ID)}/send/m.room.message?access_token=${MATRIX_ADMIN_TOKEN}`, {
                body: `${username}: ${message}`,
                msgtype: "m.text"
            });
            return res.json({ success: true });
        }
    } catch (err) {
        // This will now send the specific Matrix error to your console
        return res.status(500).json({ 
            error: "Matrix Connection Failed", 
            message: err.response?.data?.error || err.message 
        });
    }
}