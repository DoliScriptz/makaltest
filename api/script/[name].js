import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export default (req, res) => {
  if (req.method !== 'POST') return res.status(405).end()
  const { name, token } = req.body || {}
  if (!name || !token) return res.status(400).end()
  const parts = token.split(':')
  if (parts.length !== 4) return res.status(400).end()
  const [uid, un, exp, sig] = parts
  if (Date.now() > +exp) return res.status(403).end()
  const ok = crypto.createHmac('sha256', process.env.HWID_SECRET)
    .update(`${uid}:${un}:${exp}`)
    .digest('hex') === sig
  if (!ok) return res.status(403).end()
  const file = path.resolve(process.cwd(), 'scripts', name + '.lua')
  if (!fs.existsSync(file)) return res.status(404).end()
  // executions log
  const log = path.resolve('/tmp', 'execs.json')
  let o = {}
  if (fs.existsSync(log)) o = JSON.parse(fs.readFileSync(log, 'utf8'))
  o[name] = (o[name] || 0) + 1
  fs.writeFileSync(log, JSON.stringify(o))
  // serve
  res.setHeader('Content-Type','text/plain')
  res.status(200).send(fs.readFileSync(file,'utf8'))
}
