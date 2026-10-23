const api = require('../../utils/api.js')
const util = require('../../utils/util.js')

const STATUS_TEXT = { pending: '待确认', approved: '已入题库', rejected: '已废弃' }

Page({
  data: {
    tab: 'generate',
    logged: false,
    notes: [],
    noteNames: [],
    noteIndex: 0,
    note: null,
    count: 5,
    qtype: 'single',
    generating: false,
    drafts: [],
    draftsLoading: true,
    filter: 'pending'
  },

  onLoad(query) {
    if (query.tab) this.setData({ tab: query.tab })
    if (query.note) this.noteId = Number(query.note)
    this.load()
  },

  async load() {
    const session = await api.currentSession()
    if (!session) {
      this.setData({ logged: false })
      return
    }
    this.setData({ logged: true })
    this.loadNotes()
    this.loadDrafts()
  },

  async loadNotes() {
    try {
      const rows = await api.listNotes()
      const notes = rows.map(function (n) {
        return { id: n.id, title: n.title || '未命名', subjectCode: n.subject_code, chapterCode: n.chapter_code, content: n.content || '' }
      })
      let idx = 0
      if (this.noteId) {
        notes.forEach(function (n, i) { if (n.id === this.noteId) idx = i }, this)
      }
      this.setData({
        notes: notes,
        noteNames: notes.map(function (n) { return n.title }),
        noteIndex: idx,
        note: notes[idx] || null
      })
    } catch (e) { /* 列表失败时仍可手输 */ }
  },

  async loadDrafts() {
    this.setData({ draftsLoading: true })
    try {
      const rows = await api.listDrafts(this.data.filter === 'all' ? undefined : this.data.filter)
      const drafts = rows.map(function (r) {
        const p = r.payload || {}
        return {
          id: r.id,
          status: r.status,
          statusText: STATUS_TEXT[r.status] || r.status,
          qtype: r.qtype === 'multi' ? '多选' : '单选',
          subjectCode: r.subject_code,
          chapterCode: r.chapter_code,
          stem: p.stem || '',
          options: p.options || [],
          answerText: (p.answer || []).join(''),
          analysis: p.analysis || '',
          when: util.datetimeText(r.created_at)
        }
      })
      this.setData({ drafts: drafts, draftsLoading: false })
    } catch (e) {
      this.setData({ draftsLoading: false })
      wx.showToast({ title: e.message || '草稿加载失败', icon: 'none' })
    }
  },

  onTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab })
  },

  onNoteChange(e) {
    const i = Number(e.detail.value)
    this.setData({ noteIndex: i, note: this.data.notes[i] || null })
  },

  onCount(e) {
    this.setData({ count: Number(e.currentTarget.dataset.n) })
  },

  onType(e) {
    this.setData({ qtype: e.currentTarget.dataset.t })
  },

  onFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.f })
    this.loadDrafts()
  },

  async onGenerate() {
    if (this.data.generating) return
    const note = this.data.note
    if (!note) {
      wx.showToast({ title: '先选一个知识点', icon: 'none' })
      return
    }
    this.setData({ generating: true })
    wx.showLoading({ title: 'AI 正在命题' })
    try {
      const drafts = await api.generateQuestions(note, this.data.count, this.data.qtype)
      wx.hideLoading()
      if (!Array.isArray(drafts) || !drafts.length) {
        wx.showToast({ title: '这次没生成出来，换个知识点或稍后再试', icon: 'none' })
        return
      }
      const saved = await api.saveDrafts(note, drafts)
      wx.showToast({ title: '已生成 ' + saved.length + ' 题，进草稿箱确认' })
      this.setData({ tab: 'drafts', filter: 'pending' })
      this.loadDrafts()
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: e.message || '生成失败', icon: 'none' })
    } finally {
      this.setData({ generating: false })
    }
  },

  onApprove(e) {
    const id = Number(e.currentTarget.dataset.id)
    const draftRow = this.data.drafts.filter(function (d) { return d.id === id })[0]
    if (!draftRow) return
    const self = this
    wx.showModal({
      title: '确认这道题？',
      content: '通过后会写进公共题库（标记为 AI 生成），所有人都能刷到。',
      confirmText: '通过',
      success(r) {
        if (!r.confirm) return
        wx.showLoading({ title: '入库中' })
        api.approveDraft({
          id: id,
          subject_code: draftRow.subjectCode,
          chapter_code: draftRow.chapterCode,
          qtype: draftRow.qtype === '多选' ? 'multi' : 'single',
          payload: {
            stem: draftRow.stem,
            options: draftRow.options,
            answer: draftRow.answerText.split(''),
            analysis: draftRow.analysis,
            difficulty: 3
          }
        }).then(function () {
          wx.hideLoading()
          wx.showToast({ title: '已入题库' })
          self.loadDrafts()
        }, function (err) {
          wx.hideLoading()
          wx.showToast({ title: err.message || '入库失败', icon: 'none' })
        })
      }
    })
  },

  onReject(e) {
    const id = Number(e.currentTarget.dataset.id)
    const self = this
    api.updateDraft(id, { status: 'rejected' }).then(function () {
      wx.showToast({ title: '已废弃', icon: 'none' })
      self.loadDrafts()
    }, function (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    })
  },

  goLogin() {
    wx.switchTab({ url: '/pages/mine/index' })
  },

  goNotes() {
    wx.navigateTo({ url: '/pages/study/notes' })
  }
})
