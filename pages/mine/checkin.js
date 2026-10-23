const api = require('../../utils/api.js')
const util = require('../../utils/util.js')

const WEEK = ['日', '一', '二', '三', '四', '五', '六']

Page({
  data: {
    year: 0,
    month: 0,
    monthText: '',
    week: WEEK,
    cells: [],
    today: {},
    streak: 0,
    monthDays: 0,
    monthChecked: 0,
    logged: false
  },

  onLoad() {
    const d = new Date()
    this.setData({ year: d.getFullYear(), month: d.getMonth() + 1 })
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
    const rows = await api.listCheckins(120)
    const map = {}
    rows.forEach(function (r) { map[r.day] = r })

    const today = util.todayText()
    const t = map[today]

    // 连续打卡
    const oneDay = 24 * 60 * 60 * 1000
    let streak = 0
    let cursor = new Date()
    if (!map[today]) cursor = new Date(cursor.getTime() - oneDay)
    while (map[util.todayText(cursor)]) {
      streak += 1
      cursor = new Date(cursor.getTime() - oneDay)
    }

    // 月历
    const y = this.data.year
    const m = this.data.month
    const matrix = util.monthMatrix(y, m)
    const cells = matrix.map(function (dayNum) {
      if (!dayNum) return { day: '', state: 'blank' }
      const key = y + '-' + util.pad(m) + '-' + util.pad(dayNum)
      const rec = map[key]
      return {
        day: dayNum,
        state: key === today ? 'today' : (rec ? 'checked' : 'normal'),
        count: rec ? rec.question_count : 0
      }
    })

    let monthChecked = 0
    cells.forEach(function (c) { if (c.state === 'checked' || c.state === 'today') if (map[y + '-' + util.pad(m) + '-' + util.pad(c.day)]) monthChecked += 1 })

    this.setData({
      logged: true,
      cells: cells,
      monthText: y + ' 年 ' + m + ' 月',
      today: {
        checked: !!t,
        questions: t ? t.question_count : 0,
        correct: t ? t.correct_count : 0,
        secondsText: util.durationText(t ? t.study_seconds : 0)
      },
      streak: streak,
      monthChecked: monthChecked,
      monthDays: matrix.filter(function (c) { return c }).length
    })
  },

  async onCheckin() {
    if (this.data.today.checked) {
      wx.showToast({ title: '今天已经打过卡啦', icon: 'none' })
      return
    }
    // 做过题打卡自然生效；这里允许空打卡，把当天这一行补上
    try {
      await api.addTodayStats({})
      wx.showToast({ title: '打卡成功' })
      this.load()
    } catch (e) {
      wx.showToast({ title: e.message || '打卡失败', icon: 'none' })
    }
  },

  onPrevMonth() {
    let y = this.data.year
    let m = this.data.month - 1
    if (m < 1) { m = 12; y = y - 1 }
    this.setData({ year: y, month: m })
    this.load()
  },

  onNextMonth() {
    const now = new Date()
    if (this.data.year === now.getFullYear() && this.data.month === now.getMonth() + 1) return
    let y = this.data.year
    let m = this.data.month + 1
    if (m > 12) { m = 1; y = y + 1 }
    this.setData({ year: y, month: m })
    this.load()
  }
})
