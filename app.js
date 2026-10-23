App({
  globalData: {
    session: null,
    user: null,
    sessionReady: false,
    // 一建四科，实务只做机电工程（后续扩展专业时在此追加）
    subjects: []
  },

  onLaunch() {
    this.restoreSession()
  },

  // 启动时恢复登录态；失败不抛错，页面自行引导登录
  async restoreSession() {
    try {
      const cloud = require('./utils/cloud.js').getCloud()
      const { data, error } = await cloud.auth.getSession()
      if (!error && data) {
        this.globalData.session = data
        this.globalData.user = data.user || null
      }
    } catch (e) {
      console.info('[app] restore session skipped', e && e.message ? e.message : e)
    }
    this.globalData.sessionReady = true
    if (this.sessionReadyCallback) this.sessionReadyCallback()
  },

  setSession(session) {
    this.globalData.session = session || null
    this.globalData.user = (session && session.user) || null
  }
})
