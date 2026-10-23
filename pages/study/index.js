const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const { subjects } = require('../../utils/exam-data.js')

const SUBJECT_NAME = {}
subjects.forEach(function (s) { SUBJECT_NAME[s.code] = s.name })

Page({
  data: {
    logged: false,
    recent: [],
    pendingDrafts: 0
  },

  onShow() {
    this.load()
  },

  async load() {
    const session = await api.currentSession()
    if (!session) {
      this.setData({ logged: false, recent: [], pendingDrafts: 0 })
      return
    }
    try {
      const rows = await api.listNotes()
      const recent = rows.slice(0, 5).map(function (n) {
        return {
          id: n.id,
          title: n.title || '未命名知识点',
          subjectName: SUBJECT_NAME[n.subject_code] || n.subject_code || '',
          when: util.datetimeText(n.updated_at)
        }
      })
      const drafts = await api.listDrafts('pending')
      this.setData({ logged: true, recent: recent, pendingDrafts: drafts.length })
    } catch (e) {
      this.setData({ logged: true, recent: [], pendingDrafts: 0 })
    }
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/study/note-edit' })
  },

  goNotes() {
    wx.navigateTo({ url: '/pages/study/notes' })
  },

  goAi() {
    wx.navigateTo({ url: '/pages/study/ai-gen' })
  },

  goDrafts() {
    wx.navigateTo({ url: '/pages/study/ai-gen?tab=drafts' })
  },

  openNote(e) {
    wx.navigateTo({ url: '/pages/study/note-edit?id=' + e.currentTarget.dataset.id })
  },

  goLogin() {
    wx.switchTab({ url: '/pages/mine/index' })
  }
})
