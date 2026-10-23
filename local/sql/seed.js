// 由现有前端数据源生成本地库种子 SQL：
//  - subjects / chapters 来自 utils/exam-data.js（与小程序端静态数据同源）
//  - questions 来自 utils/starter-questions.js（32 道原创模拟题）
// 生成 02_seed_subjects.sql / 03_seed_chapters.sql / 04_seed_questions.sql
const fs = require('fs')
const path = require('path')

const { subjects, chapters } = require('../../utils/exam-data.js')
const sq = require('../../utils/starter-questions.js')
const starter = Array.isArray(sq) ? sq : sq.starterQuestions

function q(v) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return "'" + String(v).replace(/'/g, "''") + "'"
}
function j(v) {
  return "'" + JSON.stringify(v === undefined ? [] : v).replace(/'/g, "''") + "'"
}

const subjectsSql =
  'INSERT INTO subjects (code, name, exam_minutes, full_score, pass_score, sort_order) VALUES\n' +
  subjects.map(function (r) {
    return '  (' + [r.code, r.name, r.examMinutes, r.fullScore, r.passScore, r.sortOrder].map(q).join(', ') + ')'
  }).join(',\n') + ';'

const chaptersSql =
  'INSERT INTO chapters (subject_code, code, parent_code, name, level, sort_order) VALUES\n' +
  chapters.map(function (r) {
    return '  (' + [r.subjectCode, r.code, r.parentCode, r.name, r.level, r.sortOrder].map(q).join(', ') + ')'
  }).join(',\n') + ';'

const questionsSql =
  '-- 原创模拟题，来源 source=original；同步到云端前由小程序端用负数 id + sid 占位\n' +
  'INSERT INTO questions (subject_code, chapter_code, type, stem, options, answer, analysis, difficulty, source, tags, contributor_id) VALUES\n' +
  starter.map(function (s) {
    return '  (' + [
      q(s.subjectCode), q(s.chapterCode), q(s.type || 'single'), q(s.stem),
      j(s.options), j(s.answer), q(s.analysis || ''), q(s.difficulty || 3),
      q('original'), j(s.tags || []), 'NULL'
    ].join(', ') + ')'
  }).join(',\n') + ';'

const out = __dirname
fs.writeFileSync(path.join(out, '02_seed_subjects.sql'), subjectsSql)
fs.writeFileSync(path.join(out, '03_seed_chapters.sql'), chaptersSql)
fs.writeFileSync(path.join(out, '04_seed_questions.sql'), questionsSql)
console.log('seed written: subjects=' + subjects.length + ' chapters=' + chapters.length + ' questions=' + starter.length)
