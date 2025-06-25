const fetch = require('node-fetch');
const crypto = require('crypto');

const OWNER = 'DoliScriptz';
const REPO = 'makaltest';
const LOG_PATH = 'data/executionslog.json';
const BASE = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { name, token } = req.body || {};
  if (!name || !token) return res.status(400).end();
  const [uid, usr, exp, sig] = token.split(':');
  if (!uid || !usr || !exp || !sig || Date.now() > +exp) return res.status(403).end();
  const hmac = crypto
    .createHmac('sha256', process.env.HWID_SECRET)
    .update(`${uid}:${usr}:${exp}`)
    .digest('hex');
  if (hmac !== sig) return res.status(403).end();
  const logUrl = `${BASE}/${LOG_PATH}`;
  const scriptUrl = `${BASE}/scripts/${name}.lua`;
  const hdr = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    'User-Agent': 'makalhub'
  };
  try {
    let r = await fetch(logUrl, { headers: hdr });
    if (!r.ok) return res.status(502).end();
    let j = await r.json();
    let sha = j.sha;
    let log = JSON.parse(Buffer.from(j.content, 'base64').toString());
    log[name] = (log[name] || 0) + 1;
    let newB64 = Buffer.from(JSON.stringify(log, null, 2)).toString('base64');
    let p = await fetch(logUrl, {
      method: 'PUT',
      headers: { ...hdr, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `exec ${name}`, content: newB64, sha })
    });
    if (!p.ok) return res.status(502).end();
    let s = await fetch(scriptUrl, { headers: hdr });
    if (!s.ok) return res.status(404).end();
    let sj = await s.json();
    let code = Buffer.from(sj.content, 'base64').toString();
    res.setHeader('Content-Type', 'text/plain');
    res.send(code);
  } catch {
    res.status(500).end();
  }
};
