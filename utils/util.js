function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

function todayText(ts) {
  const d = ts ? new Date(ts) : new Date()
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

function datetimeText(input) {
  if (!input) return ''
  const d = new Date(input)
  if (isNaN(d.getTime())) return String(input)
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

function monthMatrix(year, month) {
  // month: 1-12
  const first = new Date(year, month - 1, 1)
  const start = first.getDay() // 0=周日
  const days = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = 0; i < start; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function durationText(seconds) {
  const s = Math.max(0, Math.round(seconds))
  if (s < 60) return s + ' 秒'
  const m = Math.floor(s / 60)
  if (m < 60) return m + ' 分钟'
  const h = Math.floor(m / 60)
  return h + ' 小时 ' + (m % 60) + ' 分'
}

function formatSeconds(ms) {
  return durationText((ms || 0) / 1000)
}

function fileSizeText(bytes) {
  const b = Number(bytes) || 0
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1024 / 1024).toFixed(1) + ' MB'
}

function countdownText(seconds) {
  const s = Math.max(0, Math.round(seconds))
  return pad(Math.floor(s / 60)) + ':' + pad(s % 60)
}

function sameSet(a, b) {
  const x = Array.isArray(a) ? a.slice().sort() : []
  const y = Array.isArray(b) ? b.slice().sort() : []
  if (x.length !== y.length) return false
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false
  return true
}

// 相对数组 A 缺/多的元素，用于「漏选 / 错选」分析
function diffOptions(selected, answer) {
  const s = Array.isArray(selected) ? selected : []
  const a = Array.isArray(answer) ? answer : []
  return {
    missed: a.filter(function (item) { return s.indexOf(item) < 0 }),
    wrong: s.filter(function (item) { return a.indexOf(item) < 0 })
  }
}

function optionLabel(index) {
  return String.fromCharCode(65 + index)
}

function shuffle(list) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = arr[i]
    arr[i] = arr[j]
    arr[j] = t
  }
  return arr
}

module.exports = {
  pad: pad,
  todayText: todayText,
  datetimeText: datetimeText,
  monthMatrix: monthMatrix,
  durationText: durationText,
  formatSeconds: formatSeconds,
  fileSizeText: fileSizeText,
  countdownText: countdownText,
  sameSet: sameSet,
  diffOptions: diffOptions,
  optionLabel: optionLabel,
  shuffle: shuffle
}
