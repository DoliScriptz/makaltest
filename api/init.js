import crypto from "crypto";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { userid, username } = req.body || {};
  if (!userid || !username) return res.status(400).end("Missing fields");
  const secret = process.env.HWID_SECRET;
  const raw = `${userid}:${username}`;
  const hwid = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  return res.status(200).json({ status:"success", hwid });
}
