export default async function handler(req, res) {
    const { gid, sheetName } = req.query;
    const sheetId = process.env.SHEET_ID;

    if (!sheetId) {
        return res.status(400).json({ error: 'Missing sheet ID' });
    }

    try {
        let url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid || '0'}`;
        if (sheetName) {
            url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch from Google Sheets' });
        }

        const text = await response.text();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.status(200).send(text);
    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ error: 'Internal server error while fetching data' });
    }
}
