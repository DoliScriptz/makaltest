const crypto = require('crypto');
const fetch = require('node-fetch');

const RedisURL = 'https://clever-bobcat-52886.upstash.io';
const RedisToken = 'Ac6WAAIjcDEzNDZjYzM4Y2NiMTk0Y2ExOTc4OWNjZTM4OTkwNTRmMXAxMA';

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

  const scriptRes = await fetch(`https://makalhub.vercel.app/scripts/${name}.lua`);
  if (!scriptRes.ok) return res.status(404).end();
  const script = await scriptRes.text();

  await fetch(`${RedisURL}/incr/executions:${name}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RedisToken}`,
      'Content-Type': 'application/json'
    }
  });

  res.setHeader('Content-Type', 'text/plain');
  res.send(script);
};
