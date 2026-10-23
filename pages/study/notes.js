const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const { subjects } = require('../../utils/exam-data.js')

const SUBJECT_NAME = {}
subjects.forEach(function (s) { SUBJECT_NAME[s.code] = s.name })

Page({
  data: {
    logged: false,
    subjectChips: [],
    subjectCode: '',
    list: [],
    loading: true
  },

  onLoad() {
    const chips = [{ code: '', name: '全部科目' }].concat(
      subjects.map(function (s) { return { code: s.code, name: s.name } })
    )
    this.setData({ subjectChips: chips })
  },

  onShow() {
    this.load()
  },

  async load() {
    const session = await api.currentSession()
    if (!session) {
      this.setData({ logged: false, loading: false })
      return
    }
    this.setData({ loading: true })
    wx.showLoading({ title: '加载笔记' })
    try {
      const rows = await api.listNotes(this.data.subjectCode || undefined)
      const list = rows.map(function (n) {
        return {
          id: n.id,
          title: n.title || '未命名知识点',
          subjectName: SUBJECT_NAME[n.subject_code] || n.subject_code || '',
          chapter: n.chapter_code || '',
          when: util.datetimeText(n.updated_at),
          brief: String(n.content || '').replace(/\s+/g, ' ').slice(0, 50),
          imgCount: (n.images || []).length
        }
      })
      this.setData({ logged: true, list: list, loading: false })
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
      this.setData({ loading: false })
    } finally {
      wx.hideLoading()
    }
  },

  onPickSubject(e) {
    this.setData({ subjectCode: e.currentTarget.dataset.code })
    this.load()
  },

  openNote(e) {
    wx.navigateTo({ url: '/pages/study/note-edit?id=' + e.currentTarget.dataset.id })
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/study/note-edit' })
  },

  goLogin() {
    wx.switchTab({ url: '/pages/mine/index' })
  }
})
