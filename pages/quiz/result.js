const MODE_TEXT = {
  chapter: '章节练习',
  round1: '第一轮',
  round2: '第二轮',
  wrong: '错题重做',
  exam: '整卷考试',
  practice: '练习'
}

Page({
  data: {
    total: 0,
    answered: 0,
    correct: 0,
    wrong: 0,
    rate: 0,
    modeText: '',
    subjectCode: '',
    comment: ''
  },

  onLoad(query) {
    const total = Number(query.total) || 0
    const correct = Number(query.correct) || 0
    const answered = Number(query.answered) || 0
    const wrong = Number(query.wrong) || (answered - correct)
    const rate = answered > 0 ? Math.round((correct / answered) * 100) : 0
    let comment = '继续加油'
    if (answered > 0 && rate >= 90) comment = '状态很好，保持这个节奏'
    else if (rate >= 75) comment = '基础扎实，把错题清掉就有把握了'
    else if (rate >= 60) comment = '刚好压线，建议回教材过一遍薄弱章节'
    this.setData({
      total: total,
      answered: answered,
      correct: correct,
      wrong: wrong,
      rate: rate,
      modeText: MODE_TEXT[query.mode] || '练习',
      subjectCode: query.subject || '',
      comment: comment
    })
  },

  goWrong() {
    wx.navigateTo({ url: '/pages/quiz/wrong' })
  },

  redo() {
    wx.redirectTo({ url: '/pages/quiz/practice?mode=round2&subject=' + this.data.subjectCode })
  },

  goHome() {
    wx.switchTab({ url: '/pages/quiz/index' })
  }
})
