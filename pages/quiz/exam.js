const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const score = require('../../utils/score.js')

function buildOptions(q, selected) {
  return (q.options || []).map(function (o) {
    return {
      key: o.key,
      text: o.text,
      checked: (selected || []).indexOf(o.key) >= 0
    }
  })
}

Page({
  data: {
    loading: true,
    sessionId: 0,
    session: null,
    list: [],
    answers: {},
    index: 0,
    total: 0,
    cur: null,
    optionsView: [],
    isMulti: false,
    remainingText: '',
    remaining: 0,
    showCard: false,
    card: [],
    fullScore: 0,
    startedAt: 0,
    submitting: false
  },

  onLoad(query) {
    this.setData({ sessionId: Number(query.session) || 0, startedAt: Date.now() })
    this.load()
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer)
  },

  async load() {
    wx.showLoading({ title: '加载试卷' })
    try {
      const s = await api.getExamSession(this.data.sessionId)
      if (!s) {
        wx.showToast({ title: '这场考试不存在', icon: 'none' })
        return
      }
      const list = await api.listQuestionsByIds(s.question_ids || [])
      const answers = {}
      const card = []
      list.forEach(function (q) {
        answers[q.id] = []
        card.push('none')
      })
      const fullScore = score.fullScore(list)
      this.setData({
        session: s,
        list: list,
        answers: answers,
        card: card,
        total: list.length,
        fullScore: fullScore,
        loading: false
      })
      if (list.length) this.renderQuestion()
      this.startTimer(Math.min(this.data.session.duration_seconds || (s.total_count * 60), 4 * 3600))
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
      this.setData({ loading: false })
    } finally {
      wx.hideLoading()
    }
  },

  startTimer(seconds) {
    const self = this
    let left = seconds
    function tick() {
      if (left <= 0) {
        clearInterval(self.timer)
        self.setData({ remainingText: '00:00', remaining: 0 })
        self.confirmSubmit(true)
        return
      }
      left = left - 1
      self.setData({ remaining: left, remainingText: util.countdownText(left) })
    }
    tick()
    this.timer = setInterval(tick, 1000)
  },

  renderQuestion() {
    const q = this.data.list[this.data.index]
    if (!q) return
    this.setData({
      cur: q,
      isMulti: q.type === 'multi',
      optionsView: buildOptions(q, this.data.answers[q.id])
    })
  },

  onToggleOption(e) {
    const key = e.currentTarget.dataset.key
    const q = this.data.cur
    if (!q) return
    let selected = (this.data.answers[q.id] || []).slice()
    if (!this.data.isMulti) {
      selected = selected[0] === key ? [] : [key]
    } else {
      const at = selected.indexOf(key)
      if (at >= 0) selected.splice(at, 1)
      else selected.push(key)
    }
    const answers = Object.assign({}, this.data.answers)
    answers[q.id] = selected
    const card = this.data.card.slice()
    card[this.data.index] = selected.length ? 'done' : 'none'
    this.setData({
      answers: answers,
      card: card,
      optionsView: buildOptions(q, selected)
    })
  },

  goIndex(i) {
    if (i < 0 || i >= this.data.total) return
    this.setData({ index: i, showCard: false })
    this.renderQuestion()
    wx.pageScrollTo({ scrollTop: 0, duration: 0 })
  },

  goPrev() { this.goIndex(this.data.index - 1) },
  goNext() { this.goIndex(this.data.index + 1) },
  onOpenCard() { this.setData({ showCard: !this.data.showCard }) },
  onPickIndex(e) { this.goIndex(Number(e.currentTarget.dataset.i)) },
  noop() {},

  onSubmit() {
    const undone = this.data.card.filter(function (c) { return c === 'none' }).length
    if (undone > 0) {
      wx.showModal({
        title: '还有 ' + undone + ' 题没做',
        content: '交卷后不能再改，确定现在交吗？没答的题按 0 分计。',
        confirmText: '确定交卷',
        cancelText: '继续答题',
        success: (res) => { if (res.confirm) this.confirmSubmit(false) }
      })
      return
    }
    this.confirmSubmit(false)
  },

  async confirmSubmit(auto) {
    if (this.data.submitting) return
    this.setData({ submitting: true })
    if (this.timer) clearInterval(this.timer)
    wx.showLoading({ title: '正在判卷' })

    const answers = this.data.answers
    const list = this.data.list
    let scoreValue = 0
    let correctCount = 0
    for (let i = 0; i < list.length; i++) {
      const q = list[i]
      const picked = answers[q.id] || []
      const r = score.judge(q, picked)
      scoreValue += r.points
      if (r.state === 'right') correctCount += 1

      // 考试里的每一次选择同样进作答流水，错题集里能回放
      if (picked.length) {
        try {
          await api.recordAnswer({
            question: q,
            selected: picked,
            correct: r.state === 'right',
            attemptNo: 1,
            durationMs: 0,
            mode: 'exam'
          })
        } catch (e) { /* 未登录就只算本地成绩 */ }
      }
      if (r.state !== 'right') {
        try {
          await api.upsertWrong({ question: q })
        } catch (e) { /* 同上 */ }
      }
    }

    try {
      await api.submitExamSession(this.data.sessionId, {
        answers: answers,
        score: scoreValue,
        correctCount: correctCount,
        durationSeconds: Math.round((Date.now() - this.data.startedAt) / 1000)
      })
      wx.hideLoading()
      wx.redirectTo({ url: '/pages/quiz/exam-report?session=' + this.data.sessionId + '&auto=' + (auto ? '1' : '0') })
    } catch (e) {
      wx.hideLoading()
      this.setData({ submitting: false })
      wx.showToast({ title: e.message || '交卷失败', icon: 'none' })
    }
  }
})
