const api = require('../../utils/api.js')
const util = require('../../utils/util.js')

const MODE_TEXT = {
  chapter: '章节练习',
  round1: '第一轮',
  round2: '第二轮',
  wrong: '错题重做',
  exam: '整卷考试',
  practice: '练习'
}

// 把某次作答记录翻译成「这次到底错在哪」
function buildHistory(rows, answer, options) {
  const textOf = {}
  ;(options || []).forEach(function (o) { textOf[o.key] = o.text })
  return rows.map(function (r) {
    const diff = util.diffOptions(r.selected_options, answer)
    return {
      id: r.id,
      no: r.attempt_no || 1,
      when: util.datetimeText(r.created_at),
      modeText: MODE_TEXT[r.mode] || r.mode || '练习',
      tookText: r.duration_ms ? util.formatSeconds(r.duration_ms) : '—',
      correct: !!r.is_correct,
      picked: (r.selected_options || []).join(' '),
      missed: diff.missed,
      wrongs: diff.wrong,
      // 每一个错选项摊开显示：字母 + 选项原文
      wrongDetail: diff.wrong.map(function (k) {
        return { key: k, text: textOf[k] || '' }
      }),
      missedDetail: diff.missed.map(function (k) {
        return { key: k, text: textOf[k] || '' }
      })
    }
  })
}

Page({
  data: {
    loading: true,
    qid: 0,
    sid: '',
    question: null,
    answerText: '',
    history: [],
    totalAttempts: 0,
    wrongAttempts: 0
  },

  onLoad(query) {
    this.setData({ qid: Number(query.id) || 0, sid: query.sid || '' })
    this.load()
  },

  async load() {
    wx.showLoading({ title: '加载回放' })
    try {
      const q = await api.getQuestionById(this.data.qid)
      if (!q) {
        wx.showToast({ title: '这道题已经不存在了', icon: 'none' })
        this.setData({ loading: false })
        return
      }
      const answer = q.effectiveAnswer || q.answer || []
      const rows = await api.answerHistory(api.questionKeyOf(q.id, q.sid))
      const history = buildHistory(rows, answer, q.options)
      this.setData({
        question: q,
        answerText: answer.join(' '),
        history: history,
        totalAttempts: history.length,
        wrongAttempts: history.filter(function (h) { return !h.correct }).length,
        loading: false
      })
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
      this.setData({ loading: false })
    } finally {
      wx.hideLoading()
    }
  },

  onCorrect() {
    const q = this.data.question
    wx.navigateTo({
      url: '/pages/quiz/correction?id=' + q.id + '&sid=' + encodeURIComponent(q.sid || '') +
        '&subject=' + (q.subject_code || q.subjectCode || '')
    })
  }
})
