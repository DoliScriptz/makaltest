export default (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();

  const lua = `
local H = game:GetService("HttpService")
local P = game.Players.LocalPlayer

local function makal_request(data)
    local R = (syn and syn.request) or (http and http.request) or (request) or (http_request) or (fluxus and fluxus.request) or (krnl and krnl.request)
    if R then
        return R(data)
    elseif data.Method == "GET" then
        return { Body = game:HttpGet(data.Url) }
    else
        error("Unsupported executor")
    end
end

local I = makal_request({
    Url = "https://makalhub.vercel.app/api/init",
    Method = "POST",
    Headers = {["Content-Type"] = "application/json"},
    Body = H:JSONEncode({ userid = P.UserId, username = P.Name })
})
assert(I and I.Body, "Init failed")

local T = H:JSONDecode(I.Body).token
local M = {
    [537413528] = "babft",
    [109983668079237] = "stealabrainrot",
    [18687417158] = "forsaken"
}
local N = M[game.PlaceId]
assert(N, "Unsupported game")

local S = makal_request({
    Url = "https://makalhub.vercel.app/api/script/" .. N,
    Method = "POST",
    Headers = {["Content-Type"] = "application/json"},
    Body = H:JSONEncode({name = N, token = T})
})
assert(S and S.Body, "Script fetch failed")

local f = loadstring or load
assert(f, "No loader")
f(S.Body)()
`;

  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send(lua.trim());
};
