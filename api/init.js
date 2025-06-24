import crypto from 'crypto'
export default (req, res) => {
  if (req.method !== 'POST') return res.status(405).end()
  const { userid, username } = req.body || {}
  if (!userid || !username) return res.status(400).end()
  const expires = Date.now() + 20000
  const payload = `${userid}:${username}:${expires}`
  const sig = crypto.createHmac('sha256', process.env.HWID_SECRET)
                    .update(payload).digest('hex')
  res.status(200).json({ token: `${payload}:${sig}` })
}
