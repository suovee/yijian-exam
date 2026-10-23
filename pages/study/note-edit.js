const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const { subjects, chapters } = require('../../utils/exam-data.js')

Page({
  data: {
    logged: false,
    id: 0,
    isNew: true,
    subjectChips: [],
    subjectCode: 'ECON',
    subjectIndex: 0,
    subjectNames: [],
    chapterNames: [],
    chapterIndex: 0,
    title: '',
    content: '',
    images: [],
    recognizing: false,
    saving: false
  },

  onLoad(query) {
    const chips = subjects.map(function (s) { return { code: s.code, name: s.name } })
    const names = subjects.map(function (s) { return s.name })
    this.setData({ subjectChips: chips, subjectNames: names })
    if (query.id) {
      this.setData({ id: Number(query.id), isNew: false })
      this.loadNote(Number(query.id))
    } else {
      this.refreshChapters(this.data.subjectCode)
    }
  },

  async loadNote(id) {
    wx.showLoading({ title: '加载' })
    try {
      const n = await api.getNote(id)
      if (!n) {
        wx.showToast({ title: '这条知识点不是你的或已删除', icon: 'none' })
        return
      }
      let si = 0
      subjects.forEach(function (s, i) { if (s.code === n.subject_code) si = i })
      this.setData({
        logged: true,
        subjectCode: n.subject_code || 'ECON',
        subjectIndex: si,
        title: n.title || '',
        content: n.content || '',
        images: n.images || []
      })
      this.refreshChapters(this.data.subjectCode, n.chapter_code)
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  refreshChapters(subjectCode, preferred) {
    const list = chapters.filter(function (c) {
      return c.subjectCode === subjectCode && c.parentCode
    }).map(function (c) { return c.code + ' ' + c.name })
    let idx = 0
    if (preferred) {
      chapters.forEach(function (c, i) {
        if (c.code === preferred && c.subjectCode === subjectCode && c.parentCode) idx = i
      })
    }
    this.setData({ chapterNames: list, chapterIndex: Math.min(idx, list.length - 1) })
  },

  onSubjectChange(e) {
    const i = Number(e.detail.value)
    this.setData({ subjectIndex: i, subjectCode: subjects[i].code })
    this.refreshChapters(subjects[i].code)
  },

  onChapterChange(e) {
    this.setData({ chapterIndex: Number(e.detail.value) })
  },

  onInputTitle(e) {
    this.setData({ title: e.detail.value })
  },

  onInputContent(e) {
    this.setData({ content: e.detail.value })
  },

  onAddImage() {
    const self = this
    if (this.data.images.length >= 3) {
      wx.showToast({ title: '最多配 3 张图', icon: 'none' })
      return
    }
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success(res) {
        self.setData({ images: self.data.images.concat([res.tempFiles[0].tempFilePath]) })
      }
    })
  },

  onRemoveImage(e) {
    const i = Number(e.currentTarget.dataset.i)
    const images = this.data.images.slice()
    images.splice(i, 1)
    this.setData({ images: images })
  },

  onPreviewImage(e) {
    const i = Number(e.currentTarget.dataset.i)
    wx.previewImage({ urls: this.data.images, current: this.data.images[i] })
  },

  // 拍教材页 → 识别成文字 → 追加进正文
  async onRecognize() {
    if (this.data.recognizing) return
    const self = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      success: async (res) => {
        self.setData({ recognizing: true })
        wx.showLoading({ title: '正在识别图片' })
        try {
          const text = await api.recognizeImage({ title: self.data.title || '拍照识别' }, res.tempFiles[0].tempFilePath)
          wx.hideLoading()
          if (!text) {
            wx.showToast({ title: '没认出文字，换个角度试试', icon: 'none' })
            return
          }
          const merged = (self.data.content ? self.data.content + '\n\n' : '') + text
          self.setData({ content: merged })
          wx.showToast({ title: '已写入正文' })
        } catch (e) {
          wx.hideLoading()
          wx.showToast({ title: e.message || '识别失败', icon: 'none' })
        } finally {
          self.setData({ recognizing: false })
        }
      }
    })
  },

  chapterCodeOf() {
    const line = this.data.chapterNames[this.data.chapterIndex] || ''
    return line.split(' ')[0] || null
  },

  async uploadImages() {
    const urls = []
    for (let i = 0; i < this.data.images.length; i++) {
      const p = this.data.images[i]
      if (p.indexOf('tmp') >= 0 || p.indexOf('temp') >= 0 || p.indexOf('http://tmp') === 0) {
        const rel = 'notes/' + Date.now() + '_' + i + '.jpg'
        const stored = await api.uploadFile(p, rel, 'image/jpeg')
        urls.push(stored)
      } else {
        urls.push(p)
      }
    }
    return urls
  },

  async onSave() {
    if (this.data.saving) return
    if (!this.data.title) {
      wx.showToast({ title: '给知识点起个标题', icon: 'none' })
      return
    }
    const session = await api.currentSession()
    if (!session) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    wx.showLoading({ title: '保存中' })
    try {
      let images = this.data.images
      try {
        images = await this.uploadImages()
      } catch (e) { /* 图片传不上不阻塞文字保存 */ }

      const payload = {
        subjectCode: this.data.subjectCode,
        chapterCode: this.chapterCodeOf(),
        title: this.data.title,
        content: this.data.content,
        images: images
      }
      if (this.data.isNew) {
        const row = await api.createNote(payload)
        wx.hideLoading()
        if (!row) throw new Error('没有保存成功')
        this.setData({ id: row.id, isNew: false, images: images })
        wx.showToast({ title: '已保存' })
      } else {
        await api.updateNote(this.data.id, payload)
        wx.hideLoading()
        this.setData({ images: images })
        wx.showToast({ title: '已更新' })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: e.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  },

  onGen() {
    if (this.data.isNew) {
      wx.showToast({ title: '先保存这个知识点', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/study/ai-gen?note=' + this.data.id })
  },

  onDelete() {
    const self = this
    if (this.data.isNew) return
    wx.showModal({
      title: '删除这条知识点？',
      content: '删除后无法恢复，关联的 AI 草稿不受影响。',
      confirmText: '删除',
      confirmColor: '#d54941',
      success(r) {
        if (!r.confirm) return
        api.deleteNote(self.data.id).then(function () {
          wx.showToast({ title: '已删除' })
          setTimeout(function () { wx.navigateBack() }, 600)
        }, function (err) {
          wx.showToast({ title: err.message || '删除失败', icon: 'none' })
        })
      }
    })
  }
})
