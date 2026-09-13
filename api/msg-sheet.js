export default async function handler(req, res) {
    const { gid } = req.query;
    const msgSheetId = process.env.VITE_MSG_SHEET_ID;

    if (!msgSheetId) {
        return res.status(400).json({ error: 'Missing VITE_MSG_SHEET_ID env variable' });
    }

    try {
        const url = 'https://docs.google.com/spreadsheets/d/' + msgSheetId + '/export?format=csv&gid=' + (gid || '0');
        const response = await fetch(url);

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch from Google Sheets' });
        }

        const text = await response.text();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.status(200).send(text);
    } catch (error) {
        console.error('Msg Sheet Proxy Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
