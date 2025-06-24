import fs from 'fs',path from 'path',crypto from 'crypto'
export default (req,res)=>{
  if(req.method!=='POST')return res.status(405).end()
  const{name,token}=req.body||{}
  if(!name||!token)return res.status(400).end()
  const[uid,un,exp,sig]=token.split(':')
  if(!uid||!un||!exp||!sig||Date.now()>+exp)return res.status(403).end()
  if(crypto.createHmac('sha256',process.env.HWID_SECRET)
      .update(`${uid}:${un}:${exp}`).digest('hex')!==sig)
    return res.status(403).end()
  const f=path.resolve('scripts',name+'.lua')
  if(!fs.existsSync(f))return res.status(404).end()
  const logF=path.resolve('/tmp','execs.json')
  let o={}
  if(fs.existsSync(logF))o=JSON.parse(fs.readFileSync(logF,'utf8'))
  o[name]=(o[name]||0)+1
  fs.writeFileSync(logF,JSON.stringify(o))
  res.setHeader('Content-Type','text/plain')
  res.status(200).send(fs.readFileSync(f,'utf8'))
}
