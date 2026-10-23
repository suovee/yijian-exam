const api = require('../../utils/api.js')
const { subjects, chapters } = require('../../utils/exam-data.js')

Page({
  data: {
    logged: false,
    activeSubject: 'ECON',
    subjectsView: [],
    chapterView: [],
    total: { answered: 0, correct: 0, rate: 0 }
  },

  onShow() {
    this.load()
  },

  async load() {
    const session = await api.currentSession()
    if (!session) {
      this.setData({ logged: false })
      return
    }
    const stats = await api.subjectAnswerStats()
    const progress = await api.listProgress()
    const pmap = {}
    progress.forEach(function (p) {
      pmap[p.subject_code + '|' + p.chapter_code] = p
    })

    const subjectsView = subjects.map(function (s) {
      const st = stats[s.code] || { total: 0, correct: 0 }
      return {
        code: s.code,
        name: s.name,
        full: s.fullScore,
        pass: s.passScore,
        answered: st.total,
        correct: st.correct,
        rate: st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0,
        width: st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0
      }
    })

    let answered = 0
    let correct = 0
    Object.keys(stats).forEach(function (k) {
      answered += stats[k].total
      correct += stats[k].correct
    })

    this.setData({
      logged: true,
      subjectsView: subjectsView,
      total: {
        answered: answered,
        correct: correct,
        rate: answered > 0 ? Math.round((correct / answered) * 100) : 0
      }
    })
    this.loadChapters(pmap)
  },

  loadChapters(pmap) {
    const code = this.data.activeSubject
    const chapterView = chapters
      .filter(function (c) { return c.subjectCode === code && c.parentCode })
      .map(function (c) {
        const p = pmap[code + '|' + c.code]
        const done = p ? p.done_questions : 0
        const right = p ? p.correct_questions : 0
        return {
          code: c.code,
          name: c.name,
          done: done,
          right: right,
          rate: done > 0 ? Math.round((right / done) * 100) : 0
        }
      })
    this.setData({ chapterView: chapterView })
  },

  onSwitchSubject(e) {
    this.setData({ activeSubject: e.currentTarget.dataset.code })
    this.load()
  },

  goPractice() {
    wx.switchTab({ url: '/pages/quiz/index' })
  }
})
