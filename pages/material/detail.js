const api = require('../../utils/api.js')
const util = require('../../utils/util.js')

const TYPE_NAME = {
  pdf: 'PDF 文档', doc: 'Word 文档', docx: 'Word 文档',
  xls: 'Excel 表格', xlsx: 'Excel 表格', ppt: 'PPT', pptx: 'PPT',
  png: '图片', jpg: '图片', jpeg: '图片', txt: '文本', zip: '压缩包'
}

Page({
  data: {
    id: 0,
    m: null,
    loading: true,
    typeText: '',
    sizeText: '',
    when: '',
    busy: false
  },

  onLoad(query) {
    this.setData({ id: Number(query.id) || 0 })
    this.load()
  },

  async load() {
    wx.showLoading({ title: '加载' })
    try {
      const m = await api.getMaterial(this.data.id)
      if (!m) {
        wx.showToast({ title: '资料不存在', icon: 'none' })
        return
      }
      this.setData({
        m: m,
        typeText: TYPE_NAME[(m.file_ext || '').toLowerCase()] || m.file_ext || '文件',
        sizeText: util.fileSizeText(m.file_size),
        when: util.datetimeText(m.created_at),
        loading: false
      })
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
      this.setData({ loading: false })
    } finally {
      wx.hideLoading()
    }
  },

  async onOpen() {
    const m = this.data.m
    if (!m || this.data.busy) return
    this.setData({ busy: true })
    wx.showLoading({ title: '准备文件' })
    try {
      const url = await api.signedUrl(m.file_path, 600)
      if (!url) throw new Error('拿不到下载地址')
      const ext = (m.file_ext || 'pdf').toLowerCase()
      if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
        wx.previewImage({ urls: [url] })
        wx.hideLoading()
      } else {
        wx.downloadFile({
          url: url,
          success: (res) => {
            wx.hideLoading()
            wx.openDocument({
              filePath: res.tempFilePath,
              fileType: ext,
              showMenu: true,
              fail: () => {
                wx.showToast({ title: '这个格式本机打不开，可保存后用其他应用打开', icon: 'none' })
              }
            })
          },
          fail: () => {
            wx.hideLoading()
            wx.showToast({ title: '下载失败', icon: 'none' })
          }
        })
      }
      await api.bumpDownload(m.id, m.download_count || 0)
      this.setData({ 'm.download_count': (m.download_count || 0) + 1 })
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: e.message || '打开失败', icon: 'none' })
    } finally {
      this.setData({ busy: false })
    }
  }
})
