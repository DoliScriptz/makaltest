const crypto = require('crypto');
const fetch = require('node-fetch');

const OWNER = 'DoliScriptz';
const REPO = 'makaltest';
const LOG_PATH = 'data/executionslog.json';
const SCRIPT_FOLDER = 'scripts'; // In GitHub repo
const GITHUB_API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, token } = req.body || {};
  if (!name || !token) return res.status(400).send('Missing name or token');

  const [uid, usr, exp, sig] = token.split(':');
  if (!uid || !usr || !exp || !sig || Date.now() > +exp) return res.status(403).send('Invalid token');

  const hmac = crypto
    .createHmac('sha256', process.env.HWID_SECRET)
    .update(`${uid}:${usr}:${exp}`)
    .digest('hex');

  if (hmac !== sig) return res.status(403).send('Token verification failed');

  const logUrl = `${GITHUB_API_BASE}/${LOG_PATH}`;
  const scriptUrl = `${GITHUB_API_BASE}/${SCRIPT_FOLDER}/${name}.lua`;

  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'makalhub'
  };

  try {
    const getLog = await fetch(logUrl, { headers });
    if (!getLog.ok) return res.status(502).send('Failed to fetch log');
    const logData = await getLog.json();
    const sha = logData.sha;
    const parsed = JSON.parse(Buffer.from(logData.content, 'base64').toString());
    parsed[name] = (parsed[name] || 0) + 1;

    const updated = Buffer.from(JSON.stringify(parsed, null, 2)).toString('base64');
    const put = await fetch(logUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `+1 execution for ${name}`,
        content: updated,
        sha
      })
    });
    if (!put.ok) return res.status(502).send('Failed to update log');

    const getScript = await fetch(scriptUrl, { headers });
    if (!getScript.ok) return res.status(404).send('Script not found');
    const scriptData = await getScript.json();
    const scriptContent = Buffer.from(scriptData.content, 'base64').toString();

    res.setHeader('Content-Type', 'text/plain');
    res.send(scriptContent);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};
