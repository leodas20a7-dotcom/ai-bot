export default async function handler(req, res) {
  const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Resend API Key not configured on server' });
  }

  try {
    const subpath = req.url.replace(/^\/api\/resend/, '');
    const targetUrl = `https://api.resend.com${subpath.startsWith('/') ? subpath : '/' + subpath}`;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : undefined
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Resend Proxy Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
