import fs from 'fs',path from 'path',crypto from 'crypto'
export default (req,res)=>{
  if(req.method!=='POST')return res.status(405).end()
  const{name,token}=req.body||{}
  if(!name||!token)return res.status(400).end()
  const p=token.split(':')
  if(p.length!==4)return res.status(400).end()
  const[uid,un,exp,sig]=p
  if(Date.now()>+exp)return res.status(403).end()
  const ok=crypto.createHmac('sha256',process.env.HWID_SECRET).update(`${uid}:${un}:${exp}`).digest('hex')===sig
  if(!ok)return res.status(403).end()
  const f=path.join(process.cwd(),'scripts',name+'.lua')
  if(!fs.existsSync(f))return res.status(404).end()
  const logf=path.resolve('/tmp','execs.json')
  let o={}
  if(fs.existsSync(logf))o=JSON.parse(fs.readFileSync(logf,'utf8'))
  o[name]=(o[name]||0)+1
  fs.writeFileSync(logf,JSON.stringify(o))
  res.setHeader('Content-Type','text/plain')
  res.send(fs.readFileSync(f,'utf8'))
}
