const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const fetch = require('node-fetch');

const OWNER       = 'DoliScriptz';
const REPO        = 'makaltest';
const LOG_PATH    = 'data/executionslog.json';
const GITHUB_API  = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${LOG_PATH}`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { name, token } = req.body || {};
  if (!name || !token) return res.status(400).end();

  const [uid, usr, exp, sig] = token.split(':');
  if (!uid || !usr || !exp || !sig || Date.now() > +exp) return res.status(403).end();

  const valid = crypto
    .createHmac('sha256', process.env.HWID_SECRET)
    .update(`${uid}:${usr}:${exp}`)
    .digest('hex') === sig;
  if (!valid) return res.status(403).end();

  const scriptFile = path.resolve('scripts', `${name}.lua`);
  if (!fs.existsSync(scriptFile)) return res.status(404).end();

  const getRes = await fetch(GITHUB_API, {
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
  });
  if (!getRes.ok) return res.status(502).end();
  const { sha, content: b64 } = await getRes.json();
  const log = JSON.parse(Buffer.from(b64, 'base64').toString());

  log[name] = (log[name] || 0) + 1;

  const newContent = Buffer.from(JSON.stringify(log, null, 2)).toString('base64');
  const putRes = await fetch(GITHUB_API, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `Increment ${name} execution`,
      content: newContent,
      sha
    })
  });
  if (!putRes.ok) return res.status(502).end();

  res.setHeader('Content-Type', 'text/plain');
  res.send(fs.readFileSync(scriptFile, 'utf8'));
};
