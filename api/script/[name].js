const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, token } = req.body || {};
  if (!name || !token) return res.status(400).end();

  const [a, b, c, d] = token.split(':');
  if (!a || !b || !c || !d || Date.now() > +c) return res.status(403).end();

  const validSig = crypto
    .createHmac('sha256', process.env.HWID_SECRET)
    .update(`${a}:${b}:${c}`)
    .digest('hex');

  if (validSig !== d) return res.status(403).end();

  const filePath = path.resolve('scripts', name + '.lua');
  if (!fs.existsSync(filePath)) return res.status(404).end();

  const logPath = path.resolve('/tmp', 'execs.json');
  let log = {};
  if (fs.existsSync(logPath)) {
    try {
      log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    } catch (e) {
      log = {};
    }
  }

  log[name] = (log[name] || 0) + 1;
  fs.writeFileSync(logPath, JSON.stringify(log));

  res.setHeader('Content-Type', 'text/plain');
  res.send(fs.readFileSync(filePath, 'utf8'));
};
