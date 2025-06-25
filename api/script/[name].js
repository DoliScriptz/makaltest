const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

export default (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, token } = req.body || {};
  if (!name || !token) return res.status(400).end();

  const [a, b, c, d] = token.split(':');
  if (!a || !b || !c || !d || Date.now() > +c) return res.status(403).end();

  const validSig = crypto.createHmac('sha256', process.env.HWID_SECRET)
    .update(`${a}:${b}:${c}`)
    .digest('hex');

  if (validSig !== d) return res.status(403).end();

  const scriptPath = path.resolve('scripts', `${name}.lua`);
  if (!fs.existsSync(scriptPath)) return res.status(404).end();

  const logPath = path.resolve('data', 'executionslog.json');
  let executions = {};

  try {
    if (fs.existsSync(logPath)) {
      executions = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    }
  } catch (e) {
    executions = {};
  }

  executions[name] = (executions[name] || 0) + 1;
  fs.writeFileSync(logPath, JSON.stringify(executions));

  res.setHeader('Content-Type', 'text/plain');
  res.send(fs.readFileSync(scriptPath, 'utf8'));
};
