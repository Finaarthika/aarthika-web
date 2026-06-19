import * as jose from 'jose';

export default async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  if (!id) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Missing image ID' });
  }

  try {
    let clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKeyBase64 = process.env.PASSBOOK_PRIVATE_KEY_BASE64;

    if (!clientEmail || !privateKeyBase64) {
      throw new Error('GOOGLE_CLIENT_EMAIL or PASSBOOK_PRIVATE_KEY_BASE64 environment variable is missing.');
    }

    clientEmail = clientEmail.replace(/^"|"$/g, '').trim();
    let privateKeyString = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
    privateKeyString = privateKeyString.replace(/\\n/g, '\n').trim();

    const privateKey = await jose.importPKCS8(privateKeyString, 'RS256');

    const jwt = await new jose.SignJWT({
      scope: 'https://www.googleapis.com/auth/drive.readonly'
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuer(clientEmail)
      .setAudience('https://oauth2.googleapis.com/token')
      .setExpirationTime('1h')
      .setIssuedAt()
      .sign(privateKey);

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });
    
    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Token Exchange Failed: ${tokenResponse.status} - ${errText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const driveUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`;
    const imageResponse = await fetch(driveUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!imageResponse.ok) {
      const errText = await imageResponse.text();
      throw new Error(`Google Drive API responded with status ${imageResponse.status}: ${errText}`);
    }

    // Stream the image bytes directly to the client with appropriate headers
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
    
    // Pipe the response body to the client
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return res.status(200).send(buffer);

  } catch (error) {
    console.error('Passbook Image Proxy Error:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: error.message || 'An internal server error occurred.'
    });
  }
};
