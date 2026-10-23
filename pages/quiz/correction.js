const api = require('../../utils/api.js')
const util = require('../../utils/util.js')

// 题目更正页有两种形态：
//   带上 id  → 针对某一道题编辑并提交更正
//   不带 id  → 列出所有已提交的更正，可以选择采纳到自己的题库
// 无论哪种，公共题库都不允许客户端直接改，这是底线。

Page({
  data: {
    shape: 'list',
    loading: true,
    qid: 0,
    sid: '',
    subjectCode: '',
    question: null,
    origAnswerText: '',
    optionsView: [],
    selected: [],
    isMulti: false,
    analysis: '',
    reason: '',
    list: [],
    hasOverride: false,
    adoptedId: 0
  },

  onLoad(query) {
    if (query.id) {
      this.setData({
        shape: 'detail',
        qid: Number(query.id),
        sid: query.sid || '',
        subjectCode: query.subject || ''
      })
      wx.setNavigationBarTitle({ title: '更正这道题' })
    } else {
      wx.setNavigationBarTitle({ title: '题目更正' })
    }
    this.load()
  },

  async load() {
    wx.showLoading({ title: '加载中' })
    try {
      if (this.data.shape === 'detail') await this.loadDetail()
      else await this.loadList()
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
      this.setData({ loading: false })
    }
  },

  async loadDetail() {
    const q = await api.getQuestionById(this.data.qid)
    if (!q) {
      wx.showToast({ title: '题目不存在', icon: 'none' })
      return
    }
    const self = this
    const rows = await api.listCorrections(false)
    const mineHere = rows.filter(function (r) { return Number(r.question_id) === Number(self.data.qid) })
    mineHere.forEach(function (r) {
      r.answerText = (r.new_answer || []).join(' ')
      r.when = util.datetimeText(r.created_at)
      r.from = r.owner_name || '匿名同学'
      r.adopted = false
    })
    const overrides = await api.listOverrides()
    let adoptedId = 0
    let hasOverride = false
    for (let i = 0; i < overrides.length; i++) {
      if (Number(overrides[i].question_id) === Number(this.data.qid)) {
        adoptedId = Number(overrides[i].correction_id) || 0
        hasOverride = true
      }
    }
    mineHere.forEach(function (r) { r.adopted = Number(r.id) === adoptedId })

    this.setData({
      question: q,
      origAnswerText: (q.answer || []).join(' '),
      isMulti: q.type === 'multi',
      subjectCode: q.subject_code || q.subjectCode || this.data.subjectCode,
      analysis: q.effectiveAnalysis || '',
      selected: [],
      optionsView: this.buildOptions(q, []),
      list: mineHere,
      hasOverride: hasOverride,
      adoptedId: adoptedId
    })
  },

  async loadList() {
    const rows = (await api.listCorrections(false)).slice(0, 40)
    const out = []
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      let brief = '这道题暂时取不到题干'
      try {
        const q = await api.getQuestionById(r.question_id)
        if (q) brief = String(q.stem || '').slice(0, 40)
      } catch (e) { /* 题可能已被清理 */ }
      out.push({
        id: r.id,
        questionId: r.question_id,
        answerText: (r.new_answer || []).join(' '),
        reason: r.reason || '',
        from: r.owner_name || '匿名同学',
        when: util.datetimeText(r.created_at),
        brief: brief
      })
    }
    this.setData({ list: out })
  },

  buildOptions(q, selected) {
    return (q.options || []).map(function (o) {
      return {
        key: o.key,
        text: o.text,
        checked: selected.indexOf(o.key) >= 0
      }
    })
  },

  onToggleKey(e) {
    const key = e.currentTarget.dataset.key
    let selected = this.data.selected.slice()
    if (!this.data.isMulti) {
      selected = selected[0] === key ? [] : [key]
    } else {
      const at = selected.indexOf(key)
      if (at >= 0) selected.splice(at, 1)
      else selected.push(key)
    }
    this.setData({ selected: selected, optionsView: this.buildOptions(this.data.question, selected) })
  },

  onInputAnalysis(e) {
    this.setData({ analysis: e.detail.value })
  },

  onInputReason(e) {
    this.setData({ reason: e.detail.value })
  },

  // 提交更正 + 立刻在自己账号里采纳（最常见的用法）
  async onAdoptMyEdit() {
    if (!this.data.selected.length) {
      wx.showToast({ title: '先选一个你认为对的答案', icon: 'none' })
      return
    }
    wx.showLoading({ title: '提交中' })
    try {
      const row = await api.submitCorrection({
        questionId: this.data.qid,
        subjectCode: this.data.subjectCode,
        answer: this.data.selected,
        analysis: this.data.analysis,
        reason: this.data.reason || '本人订正'
      })
      if (!row) {
        wx.hideLoading()
        wx.showToast({ title: '请先登录', icon: 'none' })
        return
      }
      await api.applyOverride(this.data.qid, row)
      wx.hideLoading()
      wx.showToast({ title: '已按你的答案判题' })
      await this.load()
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: e.message || '提交失败', icon: 'none' })
    }
  },

  async onAdoptRow(e) {
    const cid = Number(e.currentTarget.dataset.cid)
    const row = this.data.list.filter(function (r) { return Number(r.id) === cid })[0]
    if (!row) return
    wx.showLoading({ title: '采纳中' })
    try {
      await api.applyOverride(this.data.qid, {
        new_answer: row.new_answer,
        new_analysis: row.new_analysis
      })
      wx.hideLoading()
      wx.showToast({ title: '已采纳' })
      await this.load()
    } catch (e2) {
      wx.hideLoading()
      wx.showToast({ title: e2.message || '采纳失败', icon: 'none' })
    }
  },

  async onCancelAdopt() {
    wx.showLoading({ title: '处理中' })
    try {
      await api.removeOverride(this.data.qid)
      wx.hideLoading()
      wx.showToast({ title: '已恢复原题答案' })
      await this.load()
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: e.message || '操作失败', icon: 'none' })
    }
  }
})
