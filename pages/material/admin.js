const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const { subjects } = require('../../utils/exam-data.js')

const CATEGORIES = ['讲义', '真题', '笔记', '规范', '其他']

function extOf(path) {
  const m = String(path || '').split('?')[0].split('.')
  return m.length > 1 ? m[m.length - 1].toLowerCase() : ''
}

Page({
  data: {
    logged: false,
    categories: CATEGORIES,
    subjectChips: [],
    subjectCode: '',
    category: '讲义',
    title: '',
    description: '',
    filePath: '',
    fileName: '',
    fileExt: '',
    fileSize: 0,
    sizeText: '',
    uploading: false,
    mine: []
  },

  onLoad() {
    const chips = [{ code: 'common', name: '公共' }].concat(
      subjects.map(function (s) { return { code: s.code, name: s.name } })
    )
    this.setData({ subjectChips: chips })
  },

  onShow() {
    this.load()
  },

  async load() {
    const session = await api.currentSession()
    this.setData({ logged: !!session })
    if (!session) return
    try {
      const rows = await api.listMaterials({})
      const uid = session.user && session.user.id
      const mine = rows.filter(function (r) { return r.owner_id === uid })
      mine.forEach(function (r) {
        r.sizeText = util.fileSizeText(r.file_size)
        r.when = util.datetimeText(r.created_at)
      })
      this.setData({ mine: mine })
    } catch (e) { /* 列表失败不影响上传 */ }
  },

  onPickSubject(e) {
    this.setData({ subjectCode: e.currentTarget.dataset.code })
  },

  onPickCategory(e) {
    this.setData({ category: e.currentTarget.dataset.c })
  },

  onInputTitle(e) {
    this.setData({ title: e.detail.value })
  },

  onInputDesc(e) {
    this.setData({ description: e.detail.value })
  },

  onChooseFile() {
    const self = this
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success(res) {
        const f = res.tempFiles[0]
        self.setData({
          filePath: f.path,
          fileName: f.name || '未命名',
          fileExt: extOf(f.name || f.path),
          fileSize: f.size || 0,
          sizeText: util.fileSizeText(f.size || 0)
        })
        if (!self.data.title) {
          self.setData({ title: (f.name || '').replace(/\.[^.]+$/, '') })
        }
      }
    })
  },

  onChooseImage() {
    const self = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success(res) {
        const f = res.tempFiles[0]
        self.setData({
          filePath: f.tempFilePath,
          fileName: '图片_' + util.todayText().replace(/-/g, ''),
          fileExt: 'jpg',
          fileSize: f.size || 0,
          sizeText: util.fileSizeText(f.size || 0)
        })
      }
    })
  },

  async onSubmit() {
    if (this.data.uploading) return
    if (!this.data.title) {
      wx.showToast({ title: '填个标题', icon: 'none' })
      return
    }
    if (!this.data.filePath) {
      wx.showToast({ title: '先选一个文件', icon: 'none' })
      return
    }
    const session = await api.currentSession()
    if (!session) {
      wx.showToast({ title: '请先在「我的」页面登录', icon: 'none' })
      return
    }

    this.setData({ uploading: true })
    wx.showLoading({ title: '上传中，别退出' })
    try {
      const safeName = (this.data.fileName || 'file')
        .replace(/[^\w\u4e00-\u9fa5.-]/g, '_')
      const relPath = 'materials/' + Date.now() + '_' + safeName
      const path = await api.uploadFile(
        this.data.filePath,
        relPath,
        this.contentTypeOf(this.data.fileExt)
      )
      const row = await api.createMaterial({
        title: this.data.title,
        subjectCode: this.data.subjectCode || 'common',
        category: this.data.category,
        description: this.data.description,
        filePath: path,
        fileExt: this.data.fileExt || 'pdf',
        fileSize: this.data.fileSize
      })
      wx.hideLoading()
      if (!row) throw new Error('资料信息没写进数据库')
      wx.showToast({ title: '上传成功' })
      this.setData({
        title: '', description: '', filePath: '', fileName: '', fileExt: '', fileSize: 0, sizeText: ''
      })
      this.load()
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: e.message || '上传失败', icon: 'none' })
    } finally {
      this.setData({ uploading: false })
    }
  },

  contentTypeOf(ext) {
    const map = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      txt: 'text/plain',
      zip: 'application/zip'
    }
    return map[ext] || 'application/octet-stream'
  },

  async onDelete(e) {
    const id = Number(e.currentTarget.dataset.id)
    const self = this
    wx.showModal({
      title: '删除这份资料？',
      content: '删除后所有人都无法再下载，数据库记录和云端文件都会移除。',
      confirmText: '删除',
      confirmColor: '#d54941',
      success(r) {
        if (!r.confirm) return
        api.deleteMaterial(id).then(function () {
          wx.showToast({ title: '已删除', icon: 'none' })
          self.load()
        }, function (err) {
          wx.showToast({ title: err.message || '删除失败', icon: 'none' })
        })
      }
    })
  },

  goLogin() {
    wx.switchTab({ url: '/pages/mine/index' })
  }
})
