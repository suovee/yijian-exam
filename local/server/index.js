// 一建备考小程序 · 本地辅助服务
// 职责：1) 微信登录(code2session + 签发 JWT) 2) 文件存储 3) LLM 代理
// 与小程序端 utils/local-client.js 配套。运行：cp .env.example .env && npm install && npm start
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

const PORT = process.env.SERVER_PORT || 8787
const JWT_SECRET = process.env.JWT_SECRET || 'localdev-secret-please-change'
const UPLOAD_DIR = path.join(__dirname, 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres'
})

const app = express()
app.use(cors())
app.use(express.json({ limit: '25mb' }))

function newId() {
  return 'u_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
function signUser(id) {
  return jwt.sign({ sub: id, role: 'authenticated', iss: 'local' }, JWT_SECRET, { expiresIn: '10y' })
}

// 健康检查
app.get('/health', (req, res) => res.json({ ok: true }))

// 未登录读取公共表用的 anon token
app.get('/anon-token', (req, res) => {
  res.json({ token: jwt.sign({ role: 'anon', iss: 'local' }, JWT_SECRET, { expiresIn: '10y' }) })
})

// 微信登录：wx.login 的 code 换 openid，落库 users，签发 JWT
app.post('/wechat-login', async (req, res) => {
  try {
    const { code } = req.body || {}
    if (!code) return res.status(400).json({ error: 'missing code' })
    const appid = process.env.WX_APPID
    const secret = process.env.WX_SECRET
    if (!appid || !secret) return res.status(500).json({ error: 'WX_APPID / WX_SECRET 未配置' })
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`
    const r = await fetch(url)
    const wxres = await r.json()
    if (!wxres.openid) return res.status(401).json({ error: 'wechat code2session failed', detail: wxres })
    let u = await pool.query('SELECT * FROM users WHERE openid=$1', [wxres.openid])
    if (u.rows.length === 0) {
      const id = newId()
      await pool.query('INSERT INTO users (id, openid) VALUES ($1,$2)', [id, wxres.openid])
      u = { rows: [{ id, openid: wxres.openid, nickname: '' }] }
    }
    const user = u.rows[0]
    res.json({ access_token: signUser(user.id), user: { id: user.id, nickname: user.nickname || '' } })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

// 本地调试登录：无需微信，直接拿一个 dev 用户 JWT
app.post('/dev-login', async (req, res) => {
  const id = (req.body && req.body.uid) || 'dev001'
  const u = await pool.query('SELECT * FROM users WHERE id=$1', [id])
  if (u.rows.length === 0) await pool.query('INSERT INTO users (id) VALUES ($1)', [id])
  res.json({ access_token: signUser(id), user: { id, nickname: '' } })
})

// ---- 文件存储 ----
app.post('/storage/upload', async (req, res) => {
  try {
    const { path: rel, contentType, base64 } = req.body || {}
    if (!rel || !base64) return res.status(400).json({ error: 'missing path/base64' })
    const safe = String(rel).replace(/\.\./g, '')
    const full = path.join(UPLOAD_DIR, safe)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, Buffer.from(base64, 'base64'))
    res.json({ path: safe, url: `/storage/file?path=${encodeURIComponent(safe)}` })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.get('/storage/file', (req, res) => {
  const rel = req.query.path
  if (!rel) return res.status(400).end()
  const safe = String(rel).replace(/\.\./g, '')
  const full = path.join(UPLOAD_DIR, safe)
  if (!fs.existsSync(full)) return res.status(404).end()
  res.sendFile(full)
})

// ---- LLM 代理（OpenAI 兼容，非流式返回，客户端包成单次迭代）----
app.post('/llm/chat', async (req, res) => {
  try {
    const { messages } = req.body || {}
    const key = process.env.LLM_API_KEY
    if (!key) return res.status(500).json({ error: 'LLM_API_KEY 未配置' })
    const base = process.env.LLM_BASE_URL || 'https://api.openai.com/v1'
    const r = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify({ model: process.env.LLM_MODEL || 'gpt-4o-mini', messages, stream: false })
    })
    const data = await r.json()
    const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : ''
    res.json({ content })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.listen(PORT, () => console.log('yijian local server listening on ' + PORT))
