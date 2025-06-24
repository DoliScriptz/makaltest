import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export default (req,res) => {
  if (req.method!=='POST') return res.status(405).end()
  const { name, token } = req.body||{}
  if (!name||!token) return res.status(400).end()
  const [uid,un,exp,sig]=token.split(':')
  if (![uid,un,exp,sig].every(Boolean)||Date.now()>+exp) return res.status(403).end()
  const secret=process.env.HWID_SECRET
  if (!secret) return res.status(500).end()
  if (crypto.createHmac('sha256',secret).update(`${uid}:${un}:${exp}`).digest('hex')!==sig)
    return res.status(403).end()
  const file=path.resolve(process.cwd(),'scripts',name+'.lua')
  if (!fs.existsSync(file)) return res.status(404).end()
  const logf=path.resolve('/tmp','execs.json')
  let o={}
  if (fs.existsSync(logf)) o=JSON.parse(fs.readFileSync(logf,'utf8'))
  o[name]=(o[name]||0)+1
  fs.writeFileSync(logf,JSON.stringify(o))
  res.setHeader('Content-Type','text/plain')
  res.status(200).send(fs.readFileSync(file,'utf8'))
}
