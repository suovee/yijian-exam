const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const score = require('../../utils/score.js')

const STATE_TEXT = { right: '完全正确', partial: '漏选，得部分分', wrong: '错误' }

Page({
  data: {
    loading: true,
    auto: false,
    session: null,
    review: [],
    summary: {
      score: 0,
      full: 0,
      pass: 0,
      passed: false,
      correctCount: 0,
      total: 0,
      tookText: '',
      rate: 0
    }
  },

  onLoad(query) {
    this.setData({ auto: query.auto === '1' })
    this.load(Number(query.session) || 0)
  },

  async load(sessionId) {
    wx.showLoading({ title: '生成报告' })
    try {
      const s = await api.getExamSession(sessionId)
      if (!s) {
        wx.showToast({ title: '找不到这场考试', icon: 'none' })
        return
      }
      const list = await api.listQuestionsByIds(s.question_ids || [])
      const answers = s.answers || {}
      const review = []
      let got = 0
      let correctCount = 0
      const full = score.fullScore(list) || s.total_score || 0

      list.forEach(function (q, i) {
        const picked = answers[q.id] || (answers[String(q.id)] || [])
        const r = score.judge(q, picked)
        got += r.points
        if (r.state === 'right') correctCount += 1
        review.push({
          id: q.id,
          sid: q.sid || '',
          no: i + 1,
          brief: String(q.stem || '').replace(/\s+/g, ' ').slice(0, 40),
          pickedText: r.picked.join(' ') || '未作答',
          answerText: r.answer.join(' '),
          pointsText: r.points + ' / ' + r.max + ' 分',
          state: r.state,
          stateText: STATE_TEXT[r.state] || '',
          missedText: r.missed.join(' ') || '',
          wrongText: r.wrong.join(' ') || ''
        })
      })

      const reported = Number(s.score || 0)
      const finalScore = reported > 0 ? reported : got
      const totalCount = list.length || s.total_count || 0
      const rate = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
      const submittedScore = Number(s.score || 0)

      this.setData({
        session: s,
        review: review,
        summary: {
          score: Math.round(finalScore * 100) / 100,
          full: full,
          pass: s.pass_score || Math.round(full * 0.6),
          passed: submittedScore >= Math.round(full * 0.6),
          correctCount: s.correct_count || correctCount,
          total: totalCount,
          tookText: util.durationText(s.duration_seconds || 0),
          rate: rate
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

  openDetail(e) {
    const id = e.currentTarget.dataset.id
    const sid = e.currentTarget.dataset.sid || ''
    wx.navigateTo({ url: '/pages/quiz/wrong-detail?id=' + id + '&sid=' + encodeURIComponent(sid) })
  },

  redoWrong() {
    wx.switchTab({ url: '/pages/quiz/index' })
  },

  goHome() {
    wx.switchTab({ url: '/pages/quiz/index' })
  }
})
