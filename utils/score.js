// 判分规则照搬一建笔试：
//   单选题 —— 选对得 1 分，否则 0 分
//   多选题 —— 全对得 2 分；漏选但没选错，每个正确项得 0.5 分；只要选错一项就是 0 分
// 这套规则和官方一致，所以「漏选」在考试里是能拿部分分的，平时练习也要区分开看。

function maxPoints(q) {
  return q.type === 'multi' ? 2 : 1
}

function judge(q, selected) {
  const answer = q.effectiveAnswer || q.answer || []
  const picked = selected || []
  const max = maxPoints(q)

  const wrongPicks = picked.filter(function (k) { return answer.indexOf(k) < 0 })
  const missedPicks = answer.filter(function (k) { return picked.indexOf(k) < 0 })

  let points = 0
  let state = 'wrong'
  if (wrongPicks.length === 0 && missedPicks.length === 0) {
    points = max
    state = 'right'
  } else if (q.type === 'multi' && wrongPicks.length === 0 && picked.length > 0) {
    points = 0.5 * picked.length
    state = 'partial'
  }
  if (!picked.length) {
    points = 0
    state = 'wrong'
  }

  return {
    points: points,
    max: max,
    state: state,
    missed: missedPicks,
    wrong: wrongPicks,
    picked: picked,
    answer: answer
  }
}

function fullScore(list) {
  return (list || []).reduce(function (sum, q) { return sum + maxPoints(q) }, 0)
}

module.exports = {
  maxPoints: maxPoints,
  judge: judge,
  fullScore: fullScore
}
