import fs from 'fs';
import path from 'path';

const apiDir = path.join(process.cwd(), 'api');

function extractLogic(filename) {
  const code = fs.readFileSync(path.join(apiDir, filename), 'utf-8');
  let logic = code.split('const accessToken = tokenData.access_token;')[1];
  
  if (!logic) {
      logic = code.split("const sheetId = '1Vu4mOrQhee8mw-kmhrTsSrjS3IeJuY2Zjb04DpwDKt8';")[1];
      logic = "const sheetId = '1Vu4mOrQhee8mw-kmhrTsSrjS3IeJuY2Zjb04DpwDKt8';\n" + logic;
  }
  
  // Remove the trailing catch block
  let parts = logic.split('} catch (error) {');
  // Need to handle cases where there might be inner try-catch, but looking at the files, there aren't any top-level ones other than the main one.
  logic = parts.slice(0, parts.length - 1).join('} catch (error) {');
  
  // Clean up the trailing whitespace and braces
  logic = logic.trim();
  if (logic.endsWith('}')) {
      logic = logic.substring(0, logic.length - 1).trim();
  }
  return logic;
}

const authLogic = extractLogic('passbook-auth.mjs');
const createLogic = extractLogic('passbook-create.mjs');
const imageLogic = extractLogic('passbook-image.mjs');
const ledgerLogic = extractLogic('passbook-ledger.mjs');
const searchLogic = extractLogic('passbook-search.mjs');
const transactionLogic = extractLogic('passbook-transaction.mjs');

const template = `import * as jose from 'jose';

export default async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = {};
    if (req.method === 'POST') {
       try {
         const chunks = [];
         for await (const chunk of req) {
           chunks.push(chunk);
         }
         const bodyStr = Buffer.concat(chunks).toString();
         body = bodyStr ? JSON.parse(bodyStr) : {};
       } catch (e) {
           body = req.body || {};
           if (typeof body === 'string') body = JSON.parse(body);
       }
    }

    const reqAction = req.query.action || body.action || body.authAction;

    if (!reqAction) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Action parameter is required' });
    }

    let clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKeyBase64 = process.env.PASSBOOK_PRIVATE_KEY_BASE64;

    if (!clientEmail || !privateKeyBase64) {
      throw new Error('GOOGLE_CLIENT_EMAIL or PASSBOOK_PRIVATE_KEY_BASE64 environment variable is missing.');
    }

    clientEmail = clientEmail.replace(/^"|"$/g, '').trim();
    let privateKeyString = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
    privateKeyString = privateKeyString.replace(/\\\\n/g, '\\n').trim();

    const privateKey = await jose.importPKCS8(privateKeyString, 'RS256');

    const jwt = await new jose.SignJWT({
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive'
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
      throw new Error('Token Exchange Failed');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (reqAction === 'auth' || reqAction === 'login' || reqAction === 'check') {
       if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
       // Because auth already parses body internally, we override the local parsing conflict by renaming or just letting it use 'body'
       ${authLogic.replace(/let body = \{\};/, '// let body = {}').replace(/const reqAction = String\(body\.action \|\| 'login'\);/, '').replace(/if \(typeof req.body === 'string'\) \{/, 'if(false){')}
    }
    else if (reqAction === 'create') {
       if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
       ${createLogic.replace(/const \{\s*customerName.*?req\.body \|\| \{\};/s, 'const { customerName, fathersName, village, phone, faceVector, aadharId, pdfFile, photoFile } = body;')}
    }
    else if (reqAction === 'image') {
       if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
       ${imageLogic.replace('const { id } = req.query;', 'const { id } = req.query; if(!id) return res.status(400).json({error: "Missing id"});')}
    }
    else if (reqAction === 'ledger') {
       if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
       ${ledgerLogic}
    }
    else if (reqAction === 'search') {
       if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
       ${searchLogic}
    }
    else if (reqAction === 'transaction') {
       if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
       ${transactionLogic.replace(/const chunks = \[\];.*?const body = bodyStr \? JSON\.parse\(bodyStr\) : \{\};/s, '// Body already parsed at top of passbook.mjs')}
    }
    else {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Invalid action provided' });
    }

  } catch (error) {
    console.error('Passbook Master API Error:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: error.message || 'An internal server error occurred.'
    });
  }
};
`;

fs.writeFileSync(path.join(apiDir, 'passbook.mjs'), template);
console.log('Successfully generated api/passbook.mjs');
