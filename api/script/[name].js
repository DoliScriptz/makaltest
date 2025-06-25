const fs = require('fs');
const crypto = require('crypto');
const fetch = require('node-fetch');

const OWNER = 'DoliScriptz';
const REPO = 'makaltest';
const FILE = 'data/executionslog.json';
const RAW_URL = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/${FILE}`;
const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, token } = req.body || {};
  if (!name || !token) return res.status(400).end();

  const [uid, usr, exp, sig] = token.split(':');
  if (!uid || !usr || !exp || !sig || Date.now() > +exp) return res.status(403).end();

  const expected = crypto
    .createHmac('sha256', process.env.HWID_SECRET)
    .update(`${uid}:${usr}:${exp}`)
    .digest('hex');
  if (sig !== expected) return res.status(403).end();

  const scriptRes = await fetch(`https://makalhub.vercel.app/scripts/${name}.lua`);
  if (!scriptRes.ok) return res.status(404).end();
  const script = await scriptRes.text();

  const rawLogRes = await fetch(RAW_URL);
  if (!rawLogRes.ok) return res.status(502).end();
  const log = await rawLogRes.json().catch(() => ({}));
  log[name] = (log[name] || 0) + 1;

  const shaRes = await fetch(API_URL, {
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
  });
  if (!shaRes.ok) return res.status(502).end();
  const { sha } = await shaRes.json();

  const updated = Buffer.from(JSON.stringify(log, null, 2)).toString('base64');
  const putRes = await fetch(API_URL, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: `Log ${name}`, content: updated, sha })
  });
  if (!putRes.ok) return res.status(502).end();

  res.setHeader('Content-Type', 'text/plain');
  res.send(script);
};
