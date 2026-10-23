const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const { subjects, chapters } = require('../../utils/exam-data.js')

Page({
  data: {
    subjects: subjects,
    activeSubject: 'ECON',
    activeSubjectName: '',
    chapterList: [],
    expanded: {},
    needLogin: false,
    showSync: false,
    syncing: false,
    stats: { answered: 0, correct: 0, wrong: 0, rate: 0 }
  },

  onLoad() {
    this.setData({ showSync: !api.isSynced() })
  },

  onShow() {
    const app = getApp()
    this.setData({ needLogin: !(app && app.globalData.user) })
    this.setData({ activeSubjectName: this.subjectName(this.data.activeSubject) })
    this.loadChapterTree()
    this.loadStats()
  },

  subjectName(code) {
    for (let i = 0; i < subjects.length; i++) {
      if (subjects[i].code === code) return subjects[i].name
    }
    return code
  },

  loadChapterTree() {
    const code = this.data.activeSubject
    const mine = chapters.filter(function (c) { return c.subjectCode === code })
    const roots = mine.filter(function (c) { return !c.parentCode })
      .sort(function (a, b) { return a.sortOrder - b.sortOrder })
    const out = roots.map(function (r) {
      const kids = mine.filter(function (c) { return c.parentCode === r.code })
        .sort(function (a, b) { return a.sortOrder - b.sortOrder })
      return { code: r.code, name: r.name, children: kids, count: kids.length }
    })
    this.setData({ chapterList: out })
  },

  async loadStats() {
    try {
      const session = await api.currentSession()
      if (!session) return
      const counts = await api.recentAnswerCount()
      const wrongList = await api.listWrong()
      const unanswered = wrongList.filter(function (w) { return !w.mastered }).length
      const total = counts.total
      const rate = total > 0 ? Math.round((counts.correct / total) * 100) : 0
      this.setData({
        stats: { answered: total, correct: counts.correct, wrong: unanswered, rate: rate }
      })
    } catch (e) {
      // 统计失败不影响主流程
    }
  },

  onSwitchSubject(e) {
    const code = e.currentTarget.dataset.code
    if (code === this.data.activeSubject) return
    this.setData({ activeSubject: code, activeSubjectName: this.subjectName(code), expanded: {} })
    this.loadChapterTree()
  },

  onToggleGroup(e) {
    const code = e.currentTarget.dataset.code
    const copy = Object.assign({}, this.data.expanded)
    copy[code] = !copy[code]
    this.setData({ expanded: copy })
  },

  goChapter(e) {
    const code = e.currentTarget.dataset.code
    wx.navigateTo({ url: '/pages/quiz/practice?mode=chapter&subject=' + this.data.activeSubject + '&chapter=' + code })
  },

  goRound(e) {
    const round = e.currentTarget.dataset.round
    wx.navigateTo({ url: '/pages/quiz/practice?mode=round' + round + '&subject=' + this.data.activeSubject })
  },

  goExamList(e) {
    const type = e.currentTarget.dataset.type
    wx.navigateTo({ url: '/pages/quiz/exam-list?type=' + type + '&subject=' + this.data.activeSubject })
  },

  goWrong() {
    wx.navigateTo({ url: '/pages/quiz/wrong' })
  },

  goCorrections() {
    wx.navigateTo({ url: '/pages/quiz/correction' })
  },

  goFavorite() {
    wx.navigateTo({ url: '/pages/quiz/stats?tab=favorite' })
  },

  goStats() {
    wx.navigateTo({ url: '/pages/quiz/stats' })
  },

  async onSyncStarter() {
    const session = await api.currentSession()
    if (!session) {
      wx.showToast({ title: '请先在我的页面登录', icon: 'none' })
      return
    }
    this.setData({ syncing: true })
    wx.showLoading({ title: '正在写入云端' })
    try {
      const res = await api.syncStarterToCloud()
      wx.hideLoading()
      if (res.ok) {
        wx.showToast({ title: '已写入 ' + res.count + ' 题' })
        this.setData({ showSync: false })
      } else {
        wx.showToast({ title: res.message, icon: 'none' })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: e.message || '同步失败', icon: 'none' })
    }
    this.setData({ syncing: false })
  },

  goMine() {
    wx.switchTab({ url: '/pages/mine/index' })
  }
})
