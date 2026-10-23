const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const score = require('../../utils/score.js')
const { subjects } = require('../../utils/exam-data.js')

const TYPE_TITLE = { mock: '模拟考试', real: '历年真题' }

Page({
  data: {
    type: 'mock',
    title: '模拟考试',
    subjectCode: 'ECON',
    subjectName: '',
    examMinutes: 120,
    fullScore: 100,
    pickCount: 20,
    papers: [],
    available: 0,
    loading: true
  },

  onLoad(query) {
    const type = query.type || 'mock'
    const code = query.subject || 'ECON'
    let meta = subjects[0]
    subjects.forEach(function (s) { if (s.code === code) meta = s })
    this.setData({
      type: type,
      title: TYPE_TITLE[type] || '考试',
      subjectCode: code,
      subjectName: meta.name,
      examMinutes: meta.examMinutes,
      fullScore: meta.fullScore
    })
    wx.setNavigationBarTitle({ title: this.data.title })
    this.load()
  },

  async load() {
    wx.showLoading({ title: '加载试卷' })
    try {
      const papers = await api.listPapers(this.data.type, this.data.subjectCode)
      const all = await api.listQuestions({ subjectCode: this.data.subjectCode })
      const real = all.filter(function (q) { return Number(q.id) > 0 })
      const papersView = papers.map(function (p) {
        return {
          id: p.id,
          title: p.title,
          yearText: p.year ? p.year + ' 年' : '',
          count: (p.question_ids || []).length,
          minutes: p.duration_minutes || 120,
          ids: p.question_ids || []
        }
      })
      this.setData({
        papers: papersView,
        available: real.length,
        pickCount: Math.min(20, real.length || 20),
        loading: false
      })
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
      this.setData({ loading: false })
    } finally {
      wx.hideLoading()
    }
  },

  onCountChange(e) {
    const n = Number(e.detail.value) || 10
    this.setData({ pickCount: Math.min(n, this.data.available || n) })
  },

  // 用已有试卷开考
  async startPaper(e) {
    const id = Number(e.currentTarget.dataset.id)
    const paper = this.data.papers.filter(function (p) { return p.id === id })[0]
    if (!paper) return
    wx.showLoading({ title: '组卷中' })
    try {
      const session = await api.createExamSession({
        paperId: id,
        subjectCode: this.data.subjectCode,
        paperType: this.data.type,
        title: paper.title,
        questionIds: paper.ids,
        totalScore: paper.count || this.data.fullScore
      })
      wx.hideLoading()
      if (!session) return
      wx.navigateTo({ url: '/pages/quiz/exam?session=' + session.id })
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: e.message || '创建失败', icon: 'none' })
    }
  },

  // 没有预设试卷时的兜底：从当前题库随机抽题组卷
  async startQuick() {
    if (!this.data.available) {
      wx.showToast({ title: '云端还没有这个科目的题', icon: 'none' })
      return
    }
    wx.showLoading({ title: '组卷中' })
    try {
      const all = await api.listQuestions({ subjectCode: this.data.subjectCode })
      const real = all.filter(function (q) { return Number(q.id) > 0 })
      const count = Math.max(1, Math.min(this.data.pickCount, real.length))
      const picked = util.shuffle(real).slice(0, count)
      const ids = picked.map(function (q) { return q.id })
      const session = await api.createExamSession({
        paperId: null,
        subjectCode: this.data.subjectCode,
        paperType: this.data.type,
        title: this.data.subjectName + ' 随机组卷 ' + count + ' 题',
        questionIds: ids,
        totalScore: score.fullScore(picked)
      })
      wx.hideLoading()
      if (!session) return
      wx.navigateTo({ url: '/pages/quiz/exam?session=' + session.id })
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: e.message || '组卷失败', icon: 'none' })
    }
  },

  goHistory() {
    wx.navigateTo({ url: '/pages/quiz/stats?tab=exam' })
  }
})
