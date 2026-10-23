const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const { subjects, chapters } = require('../../utils/exam-data.js')

const MODE_TITLE = {
  chapter: '章节练习',
  round1: '第一轮练习',
  round2: '第二轮练习',
  wrong: '错题重做'
}

// 把题目原始选项 + 本次选择 + 是否已揭晓，合成页面可直接渲染的视图数据。
// state 四种：checked（选中未判）/ right（选对）/ bad（错选）/ missed（漏选）
function buildOptions(q, selected, revealed) {
  const answer = q.effectiveAnswer || q.answer || []
  const picked = selected || []
  return (q.options || []).map(function (o) {
    const checked = picked.indexOf(o.key) >= 0
    let state = ''
    if (revealed) {
      const inAnswer = answer.indexOf(o.key) >= 0
      if (checked && inAnswer) state = 'right'
      else if (checked && !inAnswer) state = 'bad'
      else if (!checked && inAnswer) state = 'missed'
    } else {
      state = checked ? 'checked' : ''
    }
    return { key: o.key, text: o.text, checked: checked, state: state }
  })
}

function keyOf(q) {
  return api.questionKeyOf(q.id, q.sid)
}

Page({
  data: {
    loading: true,
    mode: 'chapter',
    title: '',
    subjectCode: '',
    subjectName: '',
    chapterCode: '',
    chapterName: '',
    list: [],
    card: [],
    index: 0,
    total: 0,
    cur: null,
    optionsView: [],
    selected: [],
    isMulti: false,
    revealed: false,
    lastCorrect: true,
    answerText: '',
    missedText: '',
    wrongText: '',
    attempts: 0,
    favorited: false,
    correctCount: 0,
    wrongCount: 0,
    answeredCount: 0,
    finished: false,
    showCard: false,
    startedAt: 0
  },

  onLoad(query) {
    const mode = query.mode || 'chapter'
    const subjectCode = query.subject || 'ECON'
    const chapterCode = query.chapter || ''
    let subjectName = subjectCode
    for (let i = 0; i < subjects.length; i++) {
      if (subjects[i].code === subjectCode) subjectName = subjects[i].name
    }
    let chapterName = ''
    if (chapterCode) {
      for (let i = 0; i < chapters.length; i++) {
        if (chapters[i].code === chapterCode) chapterName = chapters[i].name
      }
    }
    this.setData({
      mode: mode,
      subjectCode: subjectCode,
      subjectName: subjectName,
      chapterCode: chapterCode,
      chapterName: chapterName,
      title: MODE_TITLE[mode] || '练习'
    })
    wx.setNavigationBarTitle({ title: this.data.title })
    this.load()
  },

  async load() {
    this.setData({ loading: true })
    wx.showLoading({ title: '加载题目' })
    try {
      let list = []
      if (this.data.mode === 'wrong') {
        const rows = await api.listWrong()
        list = rows.filter(function (w) { return !w.mastered })
      } else {
        const all = await api.listQuestions({
          subjectCode: this.data.subjectCode,
          chapterCode: this.data.chapterCode || null
        })
        if (this.data.mode === 'round2') {
          const keys = await api.answeredQuestionKeys()
          if (keys) {
            const wrongKeys = await api.wrongQuestionKeys() || {}
            const flagged = all.filter(function (q) { return !!keys[keyOf(q)] })
            // 错过的排前面，其余保持教材顺序
            const bad = flagged.filter(function (q) { return !!wrongKeys[String(q.id)] })
            const rest = flagged.filter(function (q) { return !wrongKeys[String(q.id)] })
            list = bad.concat(rest)
          } else {
            list = all
          }
        } else {
          list = all
        }
      }

      const card = []
      for (let i = 0; i < list.length; i++) card.push('none')
      this.setData({ list: list, card: card, total: list.length, index: 0, finished: list.length === 0 })
      if (list.length) this.renderQuestion()
    } catch (e) {
      wx.showToast({ title: e.message || '题目加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
      this.setData({ loading: false })
    }
  },

  renderQuestion() {
    const q = this.data.list[this.data.index]
    if (!q) {
      this.setData({ finished: true, cur: null })
      return
    }
    this.setData({
      cur: q,
      isMulti: q.type === 'multi',
      answerText: (q.effectiveAnswer || q.answer || []).join(' '),
      selected: [],
      revealed: false,
      lastCorrect: true,
      missedText: '',
      wrongText: '',
      attempts: 0,
      favorited: false,
      optionsView: buildOptions(q, [], false),
      startedAt: Date.now()
    })
    this.refreshMeta(keyOf(q), q.id)
  },

  // 拉取这道题的历史作答次数与收藏状态
  async refreshMeta(key, id) {
    try {
      const n = await api.attemptCount(key)
      if (n) this.setData({ attempts: n })
    } catch (e) { /* 未登录时不显示 */ }
    try {
      const favs = await api.listFavorites('question')
      const hit = favs.filter(function (f) { return String(f.ref_id) === String(id) })
      if (hit.length) this.setData({ favorited: true })
    } catch (e) { /* 忽略 */ }
  },

  onToggleOption(e) {
    if (this.data.revealed) return
    const key = e.currentTarget.dataset.key
    let selected = this.data.selected.slice()
    if (!this.data.isMulti) {
      selected = selected[0] === key ? [] : [key]
    } else {
      const at = selected.indexOf(key)
      if (at >= 0) selected.splice(at, 1)
      else selected.push(key)
    }
    this.setData({
      selected: selected,
      optionsView: buildOptions(this.data.cur, selected, false)
    })
  },

  async onMainAction() {
    if (this.data.revealed) {
      if (this.data.index >= this.data.total - 1) this.goResult()
      else this.goIndex(this.data.index + 1)
      return
    }
    await this.commit()
  },

  // 提交一次作答。这里必须把「这一次勾选的全部选项」原样写进 answer_records，
  // 错题集回放每一次错选全靠这条流水，不能只存对错。
  async commit() {
    const selected = this.data.selected.slice()
    if (!selected.length) {
      wx.showToast({ title: '请先选择答案', icon: 'none' })
      return
    }
    const q = this.data.cur
    const answer = q.effectiveAnswer || q.answer || []
    const correct = util.sameSet(selected, answer)
    const diff = util.diffOptions(selected, answer)
    const durationMs = Date.now() - this.data.startedAt
    const attemptNo = this.data.attempts + 1
    const index = this.data.index

    const card = this.data.card.slice()
    card[index] = correct ? 'right' : 'wrong'
    const correctCount = this.data.correctCount + (correct ? 1 : 0)
    const wrongCount = this.data.wrongCount + (correct ? 0 : 1)

    this.setData({
      revealed: true,
      lastCorrect: correct,
      optionsView: buildOptions(q, selected, true),
      missedText: diff.missed.join('  '),
      wrongText: diff.wrong.join('  '),
      attempts: attemptNo,
      card: card,
      correctCount: correctCount,
      wrongCount: wrongCount,
      answeredCount: this.data.answeredCount + 1
    })

    try {
      await api.recordAnswer({
        question: q,
        selected: selected,
        correct: correct,
        attemptNo: attemptNo,
        durationMs: durationMs,
        mode: this.data.mode
      })
    } catch (e) {
      wx.showToast({ title: '作答流水未保存：' + (e.message || ''), icon: 'none' })
    }

    // 错题入册 + 今日统计 + 章节进度，任何一条失败都不影响做题本身
    const jobs = []
    if (!correct) jobs.push(api.upsertWrong({ question: q }))
    jobs.push(api.addTodayStats({
      questions: 1,
      correct: correct ? 1 : 0,
      seconds: Math.max(1, Math.round(durationMs / 1000))
    }))
    if (q.chapterCode) {
      jobs.push(api.bumpChapterProgress(q.subjectCode, q.chapterCode, 1, correct ? 1 : 0))
    }
    try {
      await Promise.all(jobs)
    } catch (e) {
      // 进度写不进去通常是没登录，不打断答题
    }
  },

  goIndex(i) {
    if (i < 0 || i >= this.data.total) return
    this.setData({ index: i, showCard: false })
    this.renderQuestion()
    wx.pageScrollTo({ scrollTop: 0, duration: 0 })
  },

  goPrev() {
    this.goIndex(this.data.index - 1)
  },

  goNext() {
    this.goIndex(this.data.index + 1)
  },

  onOpenCard() {
    this.setData({ showCard: !this.data.showCard })
  },

  onPickIndex(e) {
    this.goIndex(Number(e.currentTarget.dataset.i))
  },

  goResult() {
    const url = '/pages/quiz/result' +
      '?total=' + this.data.total +
      '&answered=' + this.data.answeredCount +
      '&correct=' + this.data.correctCount +
      '&wrong=' + this.data.wrongCount +
      '&mode=' + this.data.mode +
      '&subject=' + this.data.subjectCode
    wx.redirectTo({ url: url })
  },

  async onFavorite() {
    const q = this.data.cur
    if (!q) return
    try {
      await api.toggleFavorite('question', String(q.id), (q.stem || '').slice(0, 40))
      const favs = await api.listFavorites('question')
      const hit = favs.filter(function (f) { return String(f.ref_id) === String(q.id) })
      this.setData({ favorited: hit.length > 0 })
      if (hit.length) wx.showToast({ title: '已收藏', icon: 'none' })
      else wx.showToast({ title: '已取消收藏', icon: 'none' })
    } catch (e) {
      wx.showToast({ title: e.message || '收藏失败', icon: 'none' })
    }
  },

  // 跳转到更正页：带上 id 与 sid（本地题还没有云端 id，靠 sid 兜底）
  onCorrect() {
    const q = this.data.cur
    if (!q) return
    wx.navigateTo({
      url: '/pages/quiz/correction?id=' + q.id + '&sid=' + encodeURIComponent(q.sid || '') +
        '&subject=' + (q.subjectCode || '')
    })
  },

  onHistory() {
    const q = this.data.cur
    if (!q) return
    wx.navigateTo({
      url: '/pages/quiz/wrong-detail?id=' + q.id + '&sid=' + encodeURIComponent(q.sid || '')
    })
  },

  onBack() {
    wx.navigateBack()
  },

  noop() {}
})
