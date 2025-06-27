const { Buffer } = require('buffer');
const synapse = typeof synapse !== 'undefined' ? require('synapse') : null;

function executor(opts) {
  const r = (synapse && synapse.request) || global.http_request || global.request;
  if (!r) throw new Error('No HTTP executor found');
  return r(opts);
}

async function makalRequest(url, method, body) {
  const opts = { Url: url, Method: method, Headers: { 'Content-Type': 'application/json' } };
  if (body) opts.Body = JSON.stringify(body);
  return await executor(opts);
}

module.exports = async function (req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const initResp = await makalRequest(
    'https://makalhub.vercel.app/api/init',
    'POST',
    { userid: game.Players.LocalPlayer.UserId, username: game.Players.LocalPlayer.Name }
  );
  const token = JSON.parse(initResp.Body).token;

  const map = {
    537413528: 'babft',
    109983668079237: 'stealabrainrot',
    18687417158: 'forsaken'
  };
  const name = map[game.PlaceId];

  const scriptResp = await makalRequest(
    `https://makalhub.vercel.app/api/script/${name}`,
    'POST',
    { name, token }
  );
  const raw = scriptResp.Body;

  const encode = s => Buffer.from(s).toString('base64');
  const dizzy = s => [
    x => x.split('').reverse().join(''),
    x => x.replace(/./g, c => String.fromCharCode((c.charCodeAt() + 3) % 256)),
    x => x.replace(/./g, c => String.fromCharCode((c.charCodeAt() - 1) % 256))
  ].reduce((acc, fn) => fn(acc), s);

  const payload = dizzy(encode(raw));

  const stub = `local H=game:GetService"HttpService"
local j={[1]=function(x)return x:reverse()end,[2]=function(x)return x:gsub('.',function(c)return string.char((c:byte()+3)%256)end)end,[3]=function(x)return x:gsub('.',function(c)return string.char((c:byte()-1)%256)end)end}
local e="${payload}"
for i=#j,1,-1 do e=j[i](e) end
loadstring(H:Base64Decode(e))()`;

  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send(stub.trim());
};
