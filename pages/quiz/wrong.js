const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const { subjects } = require('../../utils/exam-data.js')

const SUBJECT_NAME = {}
subjects.forEach(function (s) { SUBJECT_NAME[s.code] = s.name })

Page({
  data: {
    loading: true,
    onlyUnmastered: true,
    all: [],
    list: [],
    pending: 0
  },

  async onShow() {
    await this.load()
  },

  async load() {
    this.setData({ loading: true })
    wx.showLoading({ title: '加载错题' })
    try {
      const rows = await api.listWrong()
      rows.forEach(function (r) {
        r.subjectName = SUBJECT_NAME[r.subjectCode] || r.subjectCode || '未分类'
        r.brief = String(r.stem || '').replace(/\s+/g, ' ').slice(0, 44)
        r.lastText = util.datetimeText(r.last_wrong_at || r.lastWrongAt)
        r.typeText = r.type === 'multi' ? '多选' : '单选'
      })
      this.setData({ all: rows })
      this.applyFilter()
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
      this.setData({ loading: false })
    }
  },

  applyFilter() {
    const only = this.data.onlyUnmastered
    const list = this.data.all.filter(function (r) { return only ? !r.mastered : true })
    this.setData({
      list: list,
      pending: this.data.all.filter(function (r) { return !r.mastered }).length
    })
  },

  onToggleFilter() {
    this.setData({ onlyUnmastered: !this.data.onlyUnmastered })
    this.applyFilter()
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id
    const sid = e.currentTarget.dataset.sid || ''
    wx.navigateTo({ url: '/pages/quiz/wrong-detail?id=' + id + '&sid=' + encodeURIComponent(sid) })
  },

  async markMastered(e) {
    const id = Number(e.currentTarget.dataset.id)
    try {
      await api.setMastered(id, true)
      const all = this.data.all.map(function (r) {
        return r.id === id ? Object.assign({}, r, { mastered: true }) : r
      })
      this.setData({ all: all })
      this.applyFilter()
      wx.showToast({ title: '已标记为掌握', icon: 'none' })
    } catch (e2) {
      wx.showToast({ title: e2.message || '操作失败', icon: 'none' })
    }
  },

  async removeWrong(e) {
    const id = Number(e.currentTarget.dataset.id)
    try {
      await api.clearWrong(id)
      const all = this.data.all.filter(function (r) { return r.id !== id })
      this.setData({ all: all })
      this.applyFilter()
      wx.showToast({ title: '已移出错题集', icon: 'none' })
    } catch (e2) {
      wx.showToast({ title: e2.message || '操作失败', icon: 'none' })
    }
  },

  goPractice() {
    wx.navigateTo({ url: '/pages/quiz/practice?mode=wrong' })
  }
})
