import fs from 'fs',path from 'path',crypto from 'crypto'
export default (req,res)=>{
  if(req.method!=='POST')return res.status(405).end()
  const{name,token}=req.body||{}
  if(!name||!token)return res.status(400).end()
  const[p,u,e,s]=token.split(':')
  if(!p||!u||!e||!s||Date.now()>+e)return res.status(403).end()
  if(crypto.createHmac('sha256',process.env.HWID_SECRET).update(`${p}:${u}:${e}`).digest('hex')!==s)
    return res.status(403).end()
  const f=path.resolve('scripts',name+'.lua')
  if(!fs.existsSync(f))return res.status(404).end()
  const L=path.resolve('/tmp','execs.json');let o={}
  if(fs.existsSync(L))o=JSON.parse(fs.readFileSync(L,'utf8'))
  o[name]=(o[name]||0)+1;fs.writeFileSync(L,JSON.stringify(o))
  res.setHeader('Content-Type','text/plain')
  res.send(fs.readFileSync(f,'utf8'))
}
