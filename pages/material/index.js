const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const { subjects } = require('../../utils/exam-data.js')

const CATEGORIES = ['讲义', '真题', '笔记', '规范', '其他']

Page({
  data: {
    subjectChips: [],
    categories: CATEGORIES,
    subjectCode: '',
    category: '',
    keyword: '',
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
    this.setData({ loading: true })
    wx.showLoading({ title: '加载资料' })
    try {
      const rows = await api.listMaterials({
        subjectCode: this.data.subjectCode || undefined,
        category: this.data.category || undefined,
        keyword: this.data.keyword || undefined
      })
      rows.forEach(function (r) {
        r.sizeText = util.fileSizeText(r.file_size)
        r.when = util.datetimeText(r.created_at)
        r.from = r.owner_name || '匿名'
      })
      this.setData({ list: rows, loading: false })
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

  onPickCategory(e) {
    const c = e.currentTarget.dataset.c
    this.setData({ category: this.data.category === c ? '' : c })
    this.load()
  },

  onInputKeyword(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    this.load()
  },

  openDetail(e) {
    wx.navigateTo({ url: '/pages/material/detail?id=' + e.currentTarget.dataset.id })
  },

  goAdmin() {
    wx.navigateTo({ url: '/pages/material/admin' })
  }
})
