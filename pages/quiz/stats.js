const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const { subjects } = require('../../utils/exam-data.js')

const TYPE_TEXT = { mock: '模拟考试', real: '历年真题', quick: '随机组卷' }

Page({
  data: {
    tab: 'subject',
    subjectsView: [],
    progressView: [],
    examView: [],
    favView: [],
    totals: { answered: 0, correct: 0, rate: 0 },
    loading: true
  },

  onLoad(query) {
    this.setData({ tab: query.tab || 'subject' })
    this.load()
  },

  async load() {
    wx.showLoading({ title: '统计中' })
    try {
      const stats = await api.subjectAnswerStats()
      const subjectsView = subjects.map(function (s) {
        const st = stats[s.code] || { total: 0, correct: 0 }
        return {
          code: s.code,
          name: s.name,
          total: st.total,
          correct: st.correct,
          rate: st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0,
          width: Math.min(100, st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0)
        }
      })
      let answered = 0
      let correct = 0
      Object.keys(stats).forEach(function (k) {
        answered += stats[k].total
        correct += stats[k].correct
      })

      const progress = await api.listProgress()
      const progressView = progress
        .sort(function (a, b) { return b.done_questions - a.done_questions })
        .slice(0, 12)
        .map(function (p) {
          return {
            chapter: p.chapter_code,
            done: p.done_questions,
            correct: p.correct_questions,
            rate: p.done_questions > 0 ? Math.round((p.correct_questions / p.done_questions) * 100) : 0
          }
        })

      const exams = await api.listExamSessions(50)
      const examView = exams
        .filter(function (e) { return e.submitted_at })
        .map(function (e) {
          return {
            id: e.id,
            title: e.title,
            typeText: TYPE_TEXT[e.paper_type] || e.paper_type || '考试',
            scoreText: Number(e.score || 0) + ' 分',
            percent: e.total_score ? Math.round((Number(e.score || 0) / e.total_score) * 100) : 0,
            when: util.datetimeText(e.submitted_at)
          }
        })

      const qf = await api.listFavorites('question')
      const nf = await api.listFavorites('note')
      const favView = qf.concat(nf).slice(0, 60).map(function (f) {
        return { id: f.id, refId: f.ref_id, typeText: f.ref_type === 'note' ? '知识点' : '题目', title: f.title || '' }
      })

      this.setData({
        subjectsView: subjectsView,
        progressView: progressView,
        examView: examView,
        favView: favView,
        totals: {
          answered: answered,
          correct: correct,
          rate: answered > 0 ? Math.round((correct / answered) * 100) : 0
        },
        loading: false
      })
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
      this.setData({ loading: false })
    } finally {
      wx.hideLoading()
    }
  },

  onSwitchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab })
  },

  openExam(e) {
    wx.navigateTo({ url: '/pages/quiz/exam-report?session=' + e.currentTarget.dataset.id })
  },

  openQuestion(e) {
    const id = e.currentTarget.dataset.refid
    if (String(id).indexOf('-') === 0) return
    wx.navigateTo({ url: '/pages/quiz/wrong-detail?id=' + id })
  }
})
