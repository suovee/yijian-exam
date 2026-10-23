const api = require('../../utils/api.js')
const util = require('../../utils/util.js')

Page({
  data: {
    logged: false,
    user: null,
    today: { questions: 0, correct: 0, secondsText: '0 秒', checked: false },
    streak: 0,
    checkedDays: 0
  },

  onShow() {
    this.load()
  },

  async load() {
    const session = await api.currentSession()
    if (!session) {
      this.setData({ logged: false, user: null })
      return
    }
    const rows = await api.listCheckins(120)
    const today = util.todayText()
    let streak = 0
    const days = {}
    rows.forEach(function (r) { days[r.day] = r })
    // 连续打卡：从今天（或昨天）往前数
    const oneDay = 24 * 60 * 60 * 1000
    let cursor = new Date()
    if (!days[today]) cursor = new Date(cursor.getTime() - oneDay)
    while (days[util.todayText(cursor)]) {
      streak += 1
      cursor = new Date(cursor.getTime() - oneDay)
    }
    const t = days[today]
    this.setData({
      logged: true,
      user: session.user || {},
      streak: streak,
      checkedDays: rows.length,
      today: {
        questions: t ? t.question_count : 0,
        correct: t ? t.correct_count : 0,
        secondsText: util.durationText(t ? t.study_seconds : 0),
        checked: !!t
      }
    })
  },

  async onLogin() {
    wx.showLoading({ title: '登录中' })
    const res = await api.signIn()
    wx.hideLoading()
    if (res.ok) {
      wx.showToast({ title: '登录成功' })
      this.load()
    } else {
      wx.showToast({ title: res.message || '登录失败', icon: 'none' })
    }
  },

  async onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '退出后本机不再保存登录态，云端数据仍在账号里。',
      success: (r) => {
        if (!r.confirm) return
        api.signOut().then(() => {
          this.setData({ logged: false, user: null })
          wx.showToast({ title: '已退出', icon: 'none' })
        })
      }
    })
  },

  goCheckin() { wx.navigateTo({ url: '/pages/mine/checkin' }) },
  goProgress() { wx.navigateTo({ url: '/pages/mine/progress' }) },
  goWrong() { wx.navigateTo({ url: '/pages/quiz/wrong' }) },
  goCorrections() { wx.navigateTo({ url: '/pages/quiz/correction' }) },
  goStats() { wx.navigateTo({ url: '/pages/quiz/stats' }) },
  goMaterialAdmin() { wx.navigateTo({ url: '/pages/material/admin' }) }
})
