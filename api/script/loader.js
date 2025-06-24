export default (req,res)=>{
  if(req.method!=='GET')return res.status(405).end()
  const lua=`
local H=game:GetService("HttpService")
local P=game.Players.LocalPlayer
local R=(syn and syn.request)or(http and http.request)or(request)or(http_request)
assert(R,"no http")
local I=R{Url="https://makalhub.vercel.app/api/init",Method="POST",
  Headers={["Content-Type"]="application/json"},
  Body=H:JSONEncode{userid=P.UserId,username=P.Name}}
local T=H:JSONDecode(I.Body).token
local M={[537413528]="babft",[109983668079237]="stealabrainrot",[18687417158]="forsaken"}
local N=M[game.PlaceId]assert(N)
local S=R{Url="https://makalhub.vercel.app/api/script/"..N,Method="POST",
  Headers={["Content-Type"]="application/json"},
  Body=H:JSONEncode{name=N,token=T}}
assert(S and type(S.Body)=="string","fetch failed")
loadstring(S.Body)()`
  res.setHeader('Content-Type','text/plain')
  res.send(lua.trim())
}
