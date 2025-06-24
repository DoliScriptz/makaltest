import fs from "fs";
import path from "path";
import crypto from "crypto";

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const { name, key } = req.query;
  if (!name || !key) return res.status(400).end("Missing name or key");
  let hex = "";
  for (let i = 0; i < key.length; i += 2) {
    const b = parseInt(key.slice(i, i+2), 16) ^ 0xAA;
    hex += b.toString(16).padStart(2,'0');
  }
  const b64 = Buffer.from(hex, "hex").toString();
  const [hwid, userid] = Buffer.from(b64, "base64").toString().split(":");
  const secret = process.env.HWID_SECRET;
  const expected = crypto.createHmac("sha256", secret)
    .update(`${userid}:${req.query.username||""}`)
    .digest("hex");
  if (hwid !== expected) return res.status(403).end("Invalid key");
  const f = path.join(process.cwd(),"scripts", name+".lua");
  if (!fs.existsSync(f)) return res.status(404).end("Not found");
  res.setHeader("Content-Type","text/plain");
  return res.status(200).send(fs.readFileSync(f,"utf8"));
}
