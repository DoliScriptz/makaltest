export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const lua = `
local r=(syn and syn.request)or(http and http.request)or(request)or(http_request)
assert(r,"No HTTP")
local H=game:GetService"HttpService"
local P=game.Players.LocalPlayer
local G={[537413528]="babft",[109983668079237]="stealabrainrot",[18687417158]="forsaken"}
local N=G[game.PlaceId]
assert(N,"Unsupported")

local I=r{Url="https://makalhub.vercel.app/api/init",Method="POST",
  Headers={["Content-Type"]="application/json"},
  Body=H:JSONEncode{userid=P.UserId,username=P.Name}}
assert(I and I.Body,"No init")
local HW=H:JSONDecode(I.Body).hwid

local raw=HW..":"..tostring(P.UserId)
local b64=H:Base64Encode and H:Base64Encode(raw) or (function(d)
  local c='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  local t={}
  for i=1,#d,3 do
    local n=(d:byte(i)or0)<<16|((d:byte(i+1)or0)<<8)|(d:byte(i+2)or0)
    for j=0,3 do t[#t+1]=c:sub((n>>(18-6*j)&0x3F)+1,(n>>(18-6*j)&0x3F)+1) end
  end
  for i=1,(3-#d%3)%3 do t[#t]='=' end
  return table.concat(t)
end)(raw)
local hex=b64:gsub(".",function(c)return("%02x"):format(c:byte())end)
local key=hex:gsub("..",function(h)return("%02x"):format(bit32.bxor(tonumber(h,16),0xAA))end)

local S=r{Url=("https://makalhub.vercel.app/api/script/%s?username=%s&key=%s")
    :format(N,H:UrlEncode(P.Name),key),
  Method="GET"}
assert(S and S.Body,"No script")
loadstring(S.Body)()
`
  res.setHeader("Content-Type","text/plain");
  res.status(200).send(lua.trim());
}
