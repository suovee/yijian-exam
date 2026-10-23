// 本地自托管门面（USE_LOCAL=true 时启用）
// 用 supabase-js 对接本机 PostgREST，用本地 Node 服务处理微信登录 / 文件存储 / LLM 代理。
// 对外暴露与 WorkBuddy 云 SDK 完全一致的接口形状，api.js 无需任何改动。
const { LOCAL } = require('./config.js')
const { createClient } = require('@supabase/supabase-js')

// ---- wx.request 适配 fetch（supabase-js 需要 Promise<Response> 形态）----
function wxFetch(input, init) {
  return new Promise(function (resolve, reject) {
    wx.request({
      url: input,
      method: (init && init.method) || 'GET',
      header: (init && init.headers) || {},
      data: init ? init.body : undefined,
      success: function (res) {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: '',
          json: function () { return Promise.resolve(res.data) },
          text: function () { return Promise.resolve(typeof res.data === 'string' ? res.data : JSON.stringify(res.data)) }
        })
      },
      fail: function (err) { reject(err) }
    })
  })
}

const SKEY = 'local_session'
function loadSession() {
  try { const s = wx.getStorageSync(SKEY); return s ? JSON.parse(s) : null } catch (e) { return null }
}
function saveSession(s) { try { wx.setStorageSync(SKEY, JSON.stringify(s)) } catch (e) {} }
function clearSession() { try { wx.removeStorageSync(SKEY) } catch (e) {} }

// 同步创建 supabase 客户端；anon token 用静态值（与 PostgREST 的 JWT 密钥同源）
const client = createClient(LOCAL.restUrl, LOCAL.anonToken, {
  fetch: wxFetch,
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
})

async function applySession(s) {
  if (!s) return
  try { await client.auth.setSession({ access_token: s.access_token, refresh_token: s.access_token }) } catch (e) {}
}

const auth = {
  async getSession() {
    const s = loadSession()
    if (!s) return { data: null, error: null }
    await applySession(s)
    return { data: s, error: null }
  },
  async signInWithWechat(code, appid) {
    let res
    try {
      res = await new Promise(function (resolve, reject) {
        wx.request({
          url: LOCAL.serverUrl + '/wechat-login',
          method: 'POST',
          header: { 'content-type': 'application/json' },
          data: JSON.stringify({ code: code, appid: appid }),
          success: function (r) { resolve(r) },
          fail: function (e) { reject(e) }
        })
      })
    } catch (e) {
      return { data: null, error: { message: '本地登录服务不可达，请确认 local/server 已启动' } }
    }
    const d = res.data
    if (!d || !d.access_token) return { data: null, error: { message: (d && d.error) || '本地登录失败' } }
    const session = { user: d.user, access_token: d.access_token, refresh_token: d.access_token }
    saveSession(session)
    await applySession(session)
    return { data: session, error: null }
  },
  async signOut() {
    clearSession()
    try { await client.auth.signOut() } catch (e) {}
    return { error: null }
  }
}

const storage = {
  sharedPath: function (uid, rel) { return 'users/' + uid + '/' + rel },
  async upload(remotePath, body, opts) {
    let base64 = body
    if (body && body instanceof ArrayBuffer) {
      try { base64 = wx.arrayBufferToBase64(body) } catch (e) {}
    }
    const res = await new Promise(function (resolve, reject) {
      wx.request({
        url: LOCAL.serverUrl + '/storage/upload',
        method: 'POST',
        header: { 'content-type': 'application/json' },
        data: JSON.stringify({
          path: remotePath,
          contentType: (opts && opts.contentType) || 'application/octet-stream',
          base64: base64
        }),
        success: function (r) { resolve(r) },
        fail: function (e) { reject(e) }
      })
    })
    const d = res.data || {}
    return { path: d.path, url: LOCAL.serverUrl + (d.url || ''), error: d.error ? { message: d.error } : null }
  },
  async createSignedUrl(path, ttl) {
    return { data: { signedUrl: LOCAL.serverUrl + '/storage/file?path=' + encodeURIComponent(path) }, error: null }
  }
}

const llm = {
  models: {
    async list() {
      return [{ id: LOCAL.llmModel || 'local-llm', supportsImages: true, disabled: false }]
    }
  },
  chat: {
    completions: {
      create: async function (opts) {
        const res = await new Promise(function (resolve, reject) {
          wx.request({
            url: LOCAL.serverUrl + '/llm/chat',
            method: 'POST',
            header: { 'content-type': 'application/json' },
            data: JSON.stringify({ messages: opts.messages, model: opts.model }),
            success: function (r) { resolve(r) },
            fail: function (e) { reject(e) }
          })
        })
        const d = res.data || {}
        const content = d.content || ''
        // api.js 用 for await (chunk of stream) 消费；这里包成单次迭代的 async generator
        return (async function* () { yield { choices: [{ delta: { content: content } }] } })()
      }
    }
  }
}

module.exports = { database: client, auth: auth, storage: storage, llm: llm }
