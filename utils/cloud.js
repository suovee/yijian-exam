const { USE_LOCAL, publicConfig } = require('./config.js')
const { createDiagnosticWx } = require('./workbuddy-cloud-diagnostics.js')

// ---------------- WorkBuddy 云模式 ----------------
let cloud = null
function getWorkBuddyCloud() {
  if (cloud) return cloud
  const { createMiniProgramWorkBuddyCloud } = require('@tencent-ai/workbuddy-cloud-sdk/miniprogram')
  cloud = createMiniProgramWorkBuddyCloud({
    endpoint: publicConfig.endpoint,
    publishableKey: publicConfig.publishableKey,
    wx: createDiagnosticWx(wx)
  })
  return cloud
}

// ---------------- 本地自托管模式 ----------------
let localCloud = null
function getLocalCloud() {
  if (!localCloud) localCloud = require('./local-client.js')
  return localCloud
}

// 根据开关返回统一的后端门面（都暴露 database / auth / llm / storage）
function getCloud() {
  return USE_LOCAL ? getLocalCloud() : getWorkBuddyCloud()
}

// 统一的登录态读取。任何读写用户私有数据前必须先过这道门。
async function currentSession() {
  const { data, error } = await getCloud().auth.getSession()
  if (error || !data) return null
  const app = getApp()
  if (app) app.setSession(data)
  return data
}

async function currentUserId() {
  const session = await currentSession()
  return (session && session.user && session.user.id) || null
}

// 需要登录的操作统一在这里拦一道，避免每个页面写一遍
async function requireLogin() {
  const session = await currentSession()
  if (!session) {
    wx.showToast({ title: '请先登录', icon: 'none' })
    return null
  }
  return session
}

module.exports = {
  getCloud,
  currentSession,
  currentUserId,
  requireLogin,
  publicConfig
}
