// 数据访问层：所有云读写集中在这里，页面只做展示与交互。
//
// 三条设计底线，改代码时不要破坏：
// 1) 用户自己的数据一律由数据库 RLS 按 owner_id 隔离，前端永远不传 owner_id。
// 2) 已入库的公共题目没有任何客户端 UPDATE/DELETE 权限；用户对答案有异议只能走
//    question_corrections + user_question_overrides 两层，绝不能直接改别人的题。
// 3) answer_records 是只增不改的流水：每一次作答都新增一条，保留当时选了哪几项，
//    这是「错题集能回放每一次错选」的唯一数据来源。

const { getCloud, currentSession, requireLogin } = require('./cloud.js')
const { starterQuestions } = require('./starter-questions.js')

const STARTER_SYNCED_KEY = 'yijian_starter_synced'

function db() {
  return getCloud().database
}

function unwrap(result) {
  if (result && result.error) throw result.error
  return result ? result.data : null
}

function isSynced() {
  try {
    return wx.getStorageSync(STARTER_SYNCED_KEY) === '1'
  } catch (e) {
    return false
  }
}

function setSynced(v) {
  try {
    wx.setStorageSync(STARTER_SYNCED_KEY, v ? '1' : '0')
  } catch (e) { /* 存储不可用时忽略 */ }
}

// ---------------------------------------------------------------- 本地起始题库

let localQuestions = null

function localId(index) {
  return -(1000 + index)
}

function getLocalQuestions() {
  if (localQuestions) return localQuestions
  localQuestions = starterQuestions.map(function (q, i) {
    return {
      id: localId(i),
      sid: q.sid,
      subjectCode: q.subjectCode,
      chapterCode: q.chapterCode,
      type: q.type,
      stem: q.stem,
      options: q.options,
      answer: q.answer,
      analysis: q.analysis,
      difficulty: q.difficulty,
      source: 'original',
      tags: q.tags || [],
      local: true
    }
  })
  return localQuestions
}

function findLocalQuestion(id) {
  const n = Number(id)
  const list = getLocalQuestions()
  for (let i = 0; i < list.length; i++) if (list[i].id === n) return list[i]
  return null
}

// ---------------------------------------------------------------- 覆盖层（个人更正）

async function loadOverrideMap(ids) {
  const map = {}
  const session = await currentSession()
  if (!session || !ids.length) return map
  const { data, error } = await db()
    .from('user_question_overrides')
    .select('question_id, answer, analysis, correction_id')
    .in('question_id', ids)
  if (error) return map
  ;(data || []).forEach(function (row) { map[row.question_id] = row })
  return map
}

// 把云端题目行和覆盖层合成页面可直接渲染的题目对象。
// 对外的字段统一用驼峰（subjectCode / chapterCode），本地起始题也是这个形状，
// 页面层就不用关心题目到底来自云端还是本地。
function decorate(rows, overrideMap) {
  return rows.map(function (row) {
    const ov = overrideMap ? overrideMap[row.id] : null
    return {
      id: row.id,
      sid: row.sid || null,
      subjectCode: row.subject_code,
      chapterCode: row.chapter_code || null,
      type: row.type,
      stem: row.stem,
      options: row.options || [],
      answer: row.answer || [],
      analysis: row.analysis || '',
      difficulty: row.difficulty || 3,
      source: row.source || 'original',
      tags: row.tags || [],
      local: false,
      effectiveAnswer: ov ? ov.answer : (row.answer || []),
      effectiveAnalysis: ov ? ov.analysis : (row.analysis || ''),
      override: ov || null,
      hasOverride: !!ov
    }
  })
}

// 任意来源的题目行 → 统一驼峰形状
function normalizeQuestion(src) {
  if (!src) return null
  if (src.subjectCode) return Object.assign({}, src)
  return decorate([src], {})[0]
}

// ---------------------------------------------------------------- 题目查询

async function fetchCloudQuestions(subjectCode, chapterCode) {
  let query = db().from('questions').select('id, subject_code, chapter_code, type, stem, options, answer, analysis, difficulty, source, tags')
  query = chapterCode ? query.eq('chapter_code', chapterCode) : query.eq('subject_code', subjectCode)
  const res = await query.order('id', { ascending: true }).limit(500)
  if (res.error) throw res.error
  return res.data || []
}

async function listQuestions(opts) {
  const subjectCode = opts.subjectCode
  const chapterCode = opts.chapterCode || null
  const includeLocal = opts.includeLocal !== false
  const useLocal = includeLocal && !isSynced()
  let localRows = []
  if (useLocal) {
    localRows = getLocalQuestions().filter(function (q) {
      if (q.subjectCode !== subjectCode) return false
      if (chapterCode && q.chapterCode !== chapterCode) return false
      return true
    })
  }

  const ids = cloudRows.map(function (r) { return r.id }).concat(localRows.map(function (q) { return q.id }))
  const overrideMap = await loadOverrideMap(ids)
  const out = decorate(cloudRows, overrideMap)

  localRows.forEach(function (q) {
    const ov = overrideMap[q.id]
    out.push(Object.assign({}, q, {
      effectiveAnswer: ov ? ov.answer : q.answer,
      effectiveAnalysis: ov ? ov.analysis : q.analysis,
      override: ov || null,
      hasOverride: !!ov
    }))
  })
  return out
}

async function getQuestionById(id) {
  const n = Number(id)
  if (n < 0) {
    const q = findLocalQuestion(n)
    if (!q) return null
    const localMap = await loadOverrideMap([n])
    const ov = localMap[n]
    return Object.assign({}, q, {
      effectiveAnswer: ov ? ov.answer : q.answer,
      effectiveAnalysis: ov ? ov.analysis : q.analysis,
      override: ov || null,
      hasOverride: !!ov
    })
  }
  const res = await db().from('questions').select('*').eq('id', n).maybeSingle()
  if (res.error) throw res.error
  if (!res.data) return null
  const map = await loadOverrideMap([n])
  return decorate([res.data], map)[0]
}

async function countQuestionsBySubject(subjectCode) {
  const res = await db().from('questions').select('id', { count: 'exact', head: true }).eq('subject_code', subjectCode)
  if (res.error) throw res.error
  return res.count || 0
}

// ---------------------------------------------------------------- 作答流水

// 写入一条作答记录。selected 是用户这次勾选的全部选项（含错选），完整保存。
async function recordAnswer(payload) {
  const session = await requireLogin()
  if (!session) return null
  const q = payload.question
  const qid = Number(q.id)
  // 本地起始题还没有云端 id，写入时 question_id 记 0，用 question_sid 兜底；
  // 一旦这些题被同步到云端，后续就是正常 id，sid 留空。
  const row = {
    question_id: qid < 0 ? 0 : qid,
    question_sid: qid < 0 ? q.sid : null,
    subject_code: q.subjectCode,
    chapter_code: q.chapterCode || null,
    selected_options: payload.selected || [],
    is_correct: !!payload.correct,
    attempt_no: payload.attemptNo || 1,
    duration_ms: payload.durationMs || 0,
    mode: payload.mode || 'practice'
  }
  const res = await db().from('answer_records').insert(row).select()
  if (res.error) throw res.error
  return res.data ? res.data[0] : null
}

// local:<sid> 或纯数字id —— 统一用它做「某一道题」的稳定检索键
function questionKeyOf(id, sid) {
  const n = Number(id)
  if (n < 0) return 'local:' + sid
  return String(n)
}

function filterByQuestion(query, key) {
  if (String(key).indexOf('local:') === 0) {
    return query.eq('question_sid', String(key).slice(6))
  }
  return query.eq('question_id', Number(key))
}

async function attemptCount(questionKey) {
  const session = await currentSession()
  if (!session) return 0
  const res = await filterByQuestion(
    db().from('answer_records').select('id', { count: 'exact', head: true }),
    questionKey
  )
  if (res.error) return 0
  return res.count || 0
}

async function answerHistory(questionKey) {
  const session = await requireLogin()
  if (!session) return []
  const res = await filterByQuestion(
    db().from('answer_records').select('id, attempt_no, selected_options, is_correct, duration_ms, created_at, mode'),
    questionKey
  ).order('id', { ascending: false }).limit(50)
  if (res.error) throw res.error
  return res.data || []
}

async function upsertWrong(payload) {
  const q = payload.question
  const qid = Number(q.id)
  const res = await db().from('wrong_questions').select('id, wrong_count').eq('question_id', qid).maybeSingle()
  if (res.error) throw res.error
  if (res.data) {
    const up = await db()
      .from('wrong_questions')
      .update({ wrong_count: res.data.wrong_count + 1, last_wrong_at: new Date().toISOString(), mastered: false })
      .eq('id', res.data.id)
      .select()
    if (up.error) throw up.error
    return up.data
  }
  const ins = await db().from('wrong_questions').insert({
    question_id: qid,
    subject_code: q.subjectCode,
    chapter_code: q.chapterCode || null
  }).select()
  if (ins.error) throw ins.error
  return ins.data
}

async function clearWrong(questionId) {
  const res = await db().delete().from('wrong_questions').eq('question_id', Number(questionId)).select()
  if (res.error) throw res.error
  return Array.isArray(res.data) ? res.data.length : 0
}

async function listWrong() {
  const session = await requireLogin()
  if (!session) return []
  const res = await db()
    .from('wrong_questions')
    .select('id, question_id, subject_code, chapter_code, wrong_count, last_wrong_at, mastered')
    .order('last_wrong_at', { ascending: false })
    .limit(300)
  if (res.error) throw res.error
  const rows = res.data || []
  const ids = rows.map(function (r) { return r.question_id })
  let map = {}
  if (ids.length) {
    const qs = await db().from('questions').select('id, subject_code, chapter_code, type, stem, options, answer, analysis, difficulty, tags').in('id', ids)
    if (!qs.error) {
      (qs.data || []).forEach(function (q) { map[q.id] = q })
    }
  }
  const overrides = await loadOverrideMap(ids)
  return rows.map(function (r) {
    const src = map[r.question_id] || findLocalQuestion(r.question_id)
    if (!src) return null
    const base = normalizeQuestion(src)
    const ov = overrides[r.question_id]
    return Object.assign(base, {
      wrongId: r.id,
      wrongCount: r.wrong_count,
      lastWrongAt: r.last_wrong_at,
      mastered: r.mastered,
      effectiveAnswer: ov ? ov.answer : base.answer,
      effectiveAnalysis: ov ? ov.analysis : base.analysis,
      hasOverride: !!ov
    })
  }).filter(Boolean)
}

async function setMastered(questionId, mastered) {
  const res = await db().from('wrong_questions').update({ mastered: !!mastered }).eq('question_id', Number(questionId)).select()
  if (res.error) throw res.error
  const affected = Array.isArray(res.data) ? res.data : []
  return affected.length
}

// ---------------------------------------------------------------- 题目更正（两层）

async function submitCorrection(payload) {
  const session = await requireLogin()
  if (!session) return null
  const nickname = (session.user && session.user.name) || null
  const res = await db().from('question_corrections').insert({
    question_id: Number(payload.questionId),
    subject_code: payload.subjectCode || null,
    new_answer: payload.answer || [],
    new_analysis: payload.analysis || null,
    reason: payload.reason || null,
    owner_name: nickname
  }).select()
  if (res.error) throw res.error
  return res.data ? res.data[0] : null
}

async function listCorrections(mine) {
  const session = await requireLogin()
  if (!session) return []
  let query = db().from('question_corrections').select('id, owner_id, owner_name, question_id, new_answer, new_analysis, reason, status, created_at')
  if (mine) {
    query = query.eq('owner_id', session.user.id)
  }
  const res = await query.order('id', { ascending: false }).limit(200)
  if (res.error) throw res.error
  return res.data || []
}

async function applyOverride(questionId, correction) {
  const session = await requireLogin()
  if (!session) return null
  const res = await db().from('user_question_overrides').upsert({
    question_id: Number(questionId),
    answer: correction.new_answer || [],
    analysis: correction.new_analysis || null,
    correction_id: correction.id || null
  }, { onConflict: 'owner_id,question_id' }).select()
  if (res.error) throw res.error
  return res.data ? res.data[0] : null
}

async function removeOverride(questionId) {
  const res = await db().from('user_question_overrides').delete().eq('question_id', Number(questionId)).select()
  if (res.error) throw res.error
  return Array.isArray(res.data) ? res.data.length : 0
}

async function listOverrides() {
  const session = await requireLogin()
  if (!session) return []
  const res = await db().from('user_question_overrides').select('id, question_id, answer, analysis, correction_id, created_at').order('id', { ascending: false })
  if (res.error) throw res.error
  return res.data || []
}

// ---------------------------------------------------------------- 收藏

async function listFavorites(refType) {
  const session = await requireLogin()
  if (!session) return []
  const res = await db().from('favorites').select('id, ref_type, ref_id, title, created_at').eq('ref_type', refType).order('id', { ascending: false })
  if (res.error) throw res.error
  return res.data || []
}

async function toggleFavorite(refType, refId, title) {
  const session = await requireLogin()
  if (!session) return null
  const exist = await db().from('favorites').select('id').eq('ref_type', refType).eq('ref_id', String(refId)).maybeSingle()
  if (exist.error) throw exist.error
  if (exist.data) {
    const del = await db().from('favorites').delete().eq('id', exist.data.id)
    if (del.error) throw del.error
    return false
  }
  const ins = await db().from('favorites').insert({ ref_type: refType, ref_id: String(refId), title: title || '' })
  if (ins.error) throw ins.error
  return true
}

// ---------------------------------------------------------------- 打卡与进度

async function addTodayStats(delta) {
  const session = await currentSession()
  if (!session) return null
  const d = new Date()
  const day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  const exist = await db().from('checkins').select('id, question_count, correct_count, study_seconds').eq('day', day).maybeSingle()
  if (exist.error) throw exist.error
  if (exist.data) {
    const up = await db().from('checkins').update({
      question_count: (exist.data.question_count || 0) + (delta.questions || 0),
      correct_count: (exist.data.correct_count || 0) + (delta.correct || 0),
      study_seconds: (exist.data.study_seconds || 0) + (delta.seconds || 0)
    }).eq('id', exist.data.id).select()
    if (up.error) throw up.error
    return up.data ? up.data[0] : null
  }
  const ins = await db().from('checkins').insert({
    day: day,
    question_count: delta.questions || 0,
    correct_count: delta.correct || 0,
    study_seconds: delta.seconds || 0
  }).select()
  if (ins.error) throw ins.error
  return ins.data ? ins.data[0] : null
}

async function listCheckins(limit) {
  const session = await requireLogin()
  if (!session) return []
  const res = await db().from('checkins').select('id, day, question_count, correct_count, study_seconds').order('day', { ascending: false }).limit(limit || 90)
  if (res.error) throw res.error
  return res.data || []
}

async function bumpChapterProgress(subjectCode, chapterCode, doneDelta, correctDelta) {
  const exist = await db()
    .from('study_progress')
    .select('id, total_questions, done_questions, correct_questions')
    .eq('subject_code', subjectCode)
    .eq('chapter_code', chapterCode)
    .maybeSingle()
  if (exist.error) throw exist.error
  if (exist.data) {
    const up = await db().from('study_progress').update({
      done_questions: exist.data.done_questions + doneDelta,
      correct_questions: exist.data.correct_questions + correctDelta,
      updated_at: new Date().toISOString()
    }).eq('id', exist.data.id)
    if (up.error) throw up.error
    return
  }
  const ins = await db().from('study_progress').insert({
    subject_code: subjectCode,
    chapter_code: chapterCode,
    total_questions: 0,
    done_questions: doneDelta,
    correct_questions: correctDelta
  })
  if (ins.error) throw ins.error
}

async function listProgress() {
  const session = await requireLogin()
  if (!session) return []
  const res = await db().from('study_progress').select('subject_code, chapter_code, done_questions, correct_questions, updated_at')
  if (res.error) throw res.error
  return res.data || []
}

async function totalAnswered() {
  const session = await currentSession()
  if (!session) return 0
  const res = await db().from('answer_records').select('id', { count: 'exact', head: true })
  if (res.error) return 0
  return res.count || 0
}

async function recentAnswerCount() {
  const session = await currentSession()
  if (!session) return { total: 0, correct: 0 }
  const total = await db().from('answer_records').select('id', { count: 'exact', head: true })
  const correct = await db().from('answer_records').select('id', { count: 'exact', head: true }).eq('is_correct', true)
  return {
    total: (total.count || 0),
    correct: (correct.count || 0)
  }
}

// 按 id 取题，用于试卷固定的题目集合
async function listQuestionsByIds(ids) {
  const real = (ids || []).map(Number).filter(function (n) { return n > 0 })
  if (!real.length) return []
  const res = await db().from('questions').select('id, subject_code, chapter_code, type, stem, options, answer, analysis, difficulty, source, tags').in('id', real)
  if (res.error) throw res.error
  const map = await loadOverrideMap(real)
  const order = {}
  real.forEach(function (id, i) { order[id] = i })
  return decorate(res.data || [], map).sort(function (a, b) {
    return (order[a.id] === undefined ? 999 : order[a.id]) - (order[b.id] === undefined ? 999 : order[b.id])
  })
}

// 分科作答统计
async function subjectAnswerStats() {
  const session = await currentSession()
  if (!session) return {}
  const res = await db().from('answer_records').select('subject_code, is_correct').limit(3000)
  if (res.error) throw res.error
  const out = {}
  ;(res.data || []).forEach(function (r) {
    const k = r.subject_code || 'other'
    if (!out[k]) out[k] = { total: 0, correct: 0 }
    out[k].total += 1
    if (r.is_correct) out[k].correct += 1
  })
  return out
}

// 「做过的题」的稳定键集合，用于第二轮练习：只刷已经答过的题
async function answeredQuestionKeys() {
  const session = await currentSession()
  if (!session) return null
  const res = await db().from('answer_records').select('question_id, question_sid')
  if (res.error) throw res.error
  const out = {}
  ;(res.data || []).forEach(function (r) {
    out[questionKeyOf(r.question_id, r.question_sid)] = true
  })
  return out
}

// 「错过的题」的稳定键集合
async function wrongQuestionKeys() {
  const session = await currentSession()
  if (!session) return null
  const res = await db().from('wrong_questions').select('question_id')
  if (res.error) throw res.error
  const out = {}
  ;(res.data || []).forEach(function (r) { out[String(r.question_id)] = true })
  return out
}

// ---------------------------------------------------------------- 试卷与考试

async function listPapers(paperType, subjectCode) {
  let query = db().from('exam_papers').select('id, subject_code, paper_type, round_no, year, title, question_ids, duration_minutes, total_score, sort_order')
  query = paperType ? query.eq('paper_type', paperType) : query
  query = subjectCode ? query.eq('subject_code', subjectCode) : query
  const res = await query.order('sort_order', { ascending: false }).limit(100)
  if (res.error) throw res.error
  return res.data || []
}

async function createExamSession(payload) {
  const session = await requireLogin()
  if (!session) return null
  const res = await db().from('exam_sessions').insert({
    paper_id: payload.paperId || null,
    subject_code: payload.subjectCode,
    paper_type: payload.paperType || 'mock',
    title: payload.title,
    question_ids: payload.questionIds || [],
    total_count: (payload.questionIds || []).length,
    total_score: payload.totalScore || 0
  }).select()
  if (res.error) throw res.error
  return res.data ? res.data[0] : null
}

async function submitExamSession(sessionId, result) {
  const session = await requireLogin()
  if (!session) return null
  const res = await db().from('exam_sessions').update({
    answers: result.answers || {},
    score: result.score || 0,
    correct_count: result.correctCount || 0,
    duration_seconds: result.durationSeconds || 0,
    submitted_at: new Date().toISOString()
  }).eq('id', Number(sessionId)).select()
  if (res.error) throw res.error
  const affected = Array.isArray(res.data) ? res.data : []
  if (affected.length === 0) throw new Error('成绩没有写入成功，可能这条考试记录不属于当前账号')
  return affected[0]
}

async function listExamSessions(limit) {
  const session = await requireLogin()
  if (!session) return []
  const res = await db().from('exam_sessions').select('id, paper_id, subject_code, paper_type, title, score, total_score, correct_count, total_count, duration_seconds, started_at, submitted_at').order('id', { ascending: false }).limit(limit || 50)
  if (res.error) throw res.error
  return res.data || []
}

async function getExamSession(sessionId) {
  const res = await db().from('exam_sessions').select('*').eq('id', Number(sessionId)).maybeSingle()
  if (res.error) throw res.error
  return res.data || null
}

// ---------------------------------------------------------------- 知识点

async function listNotes(subjectCode, chapterCode) {
  let query = db().from('knowledge_points').select('id, owner_id, owner_name, subject_code, chapter_code, title, content, images, mastery, updated_at')
  query = subjectCode ? query.eq('subject_code', subjectCode) : query
  query = chapterCode ? query.eq('chapter_code', chapterCode) : query
  const res = await query.order('updated_at', { ascending: false }).limit(200)
  if (res.error) throw res.error
  return res.data || []
}

async function getNote(id) {
  const res = await db().from('knowledge_points').select('*').eq('id', Number(id)).maybeSingle()
  if (res.error) throw res.error
  return res.data || null
}

async function createNote(payload) {
  const session = await requireLogin()
  if (!session) return null
  const res = await db().from('knowledge_points').insert({
    subject_code: payload.subjectCode,
    chapter_code: payload.chapterCode,
    title: payload.title,
    content: payload.content || '',
    images: payload.images || [],
    mastery: payload.mastery || 0,
    owner_name: (session.user && session.user.name) || null
  }).select()
  if (res.error) throw res.error
  return res.data ? res.data[0] : null
}

async function updateNote(id, payload) {
  const row = { updated_at: new Date().toISOString(), title: payload.title, content: payload.content || '' }
  if (payload.images) row.images = payload.images
  if (payload.mastery !== undefined) row.mastery = payload.mastery
  const res = await db().from('knowledge_points').update(row).eq('id', Number(id)).select()
  if (res.error) throw res.error
  const affected = Array.isArray(res.data) ? res.data : []
  if (affected.length === 0) throw new Error('这条笔记不是你的，改不了')
  return affected[0]
}

async function deleteNote(id) {
  const res = await db().from('knowledge_points').delete().eq('id', Number(id)).select()
  if (res.error) throw res.error
  return Array.isArray(res.data) ? res.data.length : 0
}

// ---------------------------------------------------------------- AI 出题

async function pickModel(preferImage) {
  const models = await getCloud().llm.models.list()
  if (!models || models.length === 0) return null
  const usable = models.filter(function (m) { return m.disabled !== true })
  if (!usable.length) return null
  if (preferImage) {
    const vision = usable.filter(function (m) { return m.supportsImages === true })
    if (vision.length) return vision[0]
  }
  return usable[0]
}

async function callLLM(messages, modelId) {
  let text = ''
  const stream = await getCloud().llm.chat.completions.create({
    model: modelId,
    messages: messages,
    stream: true
  })
  for await (const chunk of stream) {
    const delta = chunk.choices && chunk.choices[0] ? chunk.choices[0].delta : null
    if (delta && delta.content) text += delta.content
  }
  return text
}

function extractJson(raw) {
  let s = String(raw || '').trim()
  if (s.indexOf('```') === 0) {
    s = s.replace(/^```[a-zA-Z]*\s*/, '').replace(/```\s*$/, '')
  } else {
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fence) s = fence[1].trim()
  }
  const start = s.indexOf('[')
  const end = s.lastIndexOf(']')
  if (start >= 0 && end > start) s = s.slice(start, end + 1)
  return JSON.parse(s)
}

async function generateQuestions(note, count, qtype) {
  const session = await requireLogin()
  if (!session) return []
  const model = await pickModel(false)
  if (!model) throw new Error('当前没有可用的模型')
  const system = '你是中国一级建造师执业资格考试的资深命题老师。只能根据用户提供的知识点出题，严格按要求的 JSON 格式输出，不要输出任何多余文字。'
  const user = [
    '科目代码：', note.subject_code,
    '；章节名称：', note.chapter_code,
    '；知识点标题：', note.title,
    '\n知识点正文：\n', note.content ? String(note.content).slice(0, 4000) : '（无正文，仅依据标题）',
    '\n请生成 ', String(count), ' 道', qtype === 'multi' ? '多项选择题（每题2个或以上正确答案）' : '单项选择题（每题只有1个正确答案）',
    '。输出格式为 JSON 数组，每个元素包含：type、stem、options（数组，每项 {key,text}，key 依次为 A/B/C/D/E）、answer（正确答案 key 的数组）、analysis（不少于60字的解析）、difficulty（1-5 的整数）。'
  ].join('')
  const raw = await callLLM([
    { role: 'system', content: system },
    { role: 'user', content: user }
  ], model.id)
  return extractJson(raw)
}

async function recognizeImage(note, filePath) {
  const fs = wx.getFileSystemManager()
  const base64 = fs.readFileSync(filePath, 'base64')
  const model = await pickModel(true)
  if (!model) throw new Error('当前没有支持图片识别的模型，请改用手动录入')
  const system = '你把用户拍下的教材页面整理成 Markdown 文本。只输出识别到的正文内容，不要评论，不要臆造看不清的字。'
  const raw = await callLLM([
    { role: 'system', content: system },
    {
      role: 'user',
      content: [
        { type: 'text', text: '请把这张图片里的文字整理出来。' },
        { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + base64 } }
      ]
    }
  ], model.id)
  return String(raw || '').trim()
}

async function saveDrafts(note, drafts) {
  const session = await requireLogin()
  if (!session) return []
  const rows = drafts.map(function (d) {
    return {
      knowledge_point_id: note.id,
      subject_code: note.subject_code,
      chapter_code: note.chapter_code,
      qtype: d.type === 'multi' ? 'multi' : 'single',
      payload: d
    }
  })
  const res = await db().from('ai_question_drafts').insert(rows).select()
  if (res.error) throw res.error
  return res.data || []
}

async function listDrafts(status) {
  const session = await requireLogin()
  if (!session) return []
  let query = db().from('ai_question_drafts').select('id, knowledge_point_id, subject_code, chapter_code, qtype, payload, status, created_at')
  query = status ? query.eq('status', status) : query
  const res = await query.order('id', { ascending: false }).limit(200)
  if (res.error) throw res.error
  return res.data || []
}

async function updateDraft(id, patch) {
  const res = await db().from('ai_question_drafts').update(patch).eq('id', Number(id)).select()
  if (res.error) throw res.error
  const affected = Array.isArray(res.data) ? res.data : []
  if (affected.length === 0) throw new Error('这条记录不是你的，改不了')
  return affected[0]
}

async function deleteDraft(id) {
  const res = await db().from('ai_question_drafts').delete().eq('id', Number(id)).select()
  if (res.error) throw res.error
  return Array.isArray(res.data) ? res.data.length : 0
}

// 审核通过 → 写入公共题库（source 标为 ai，与原创题、真题库区分展示）
async function approveDraft(draft) {
  const session = await requireLogin()
  if (!session) return null
  const p = draft.payload || {}
  const res = await db().from('questions').insert({
    subject_code: draft.subject_code,
    chapter_code: draft.chapter_code,
    type: draft.qtype === 'multi' ? 'multi' : 'single',
    stem: p.stem || '',
    options: p.options || [],
    answer: p.answer || [],
    analysis: p.analysis || '',
    difficulty: Number(p.difficulty) || 3,
    source: 'ai',
    tags: ['AI生成'],
    contributor_name: (session.user && session.user.name) || null
  }).select()
  if (res.error) throw res.error
  await updateDraft(draft.id, { status: 'approved' })
  return res.data ? res.data[0] : null
}

// ---------------------------------------------------------------- 资料

async function listMaterials(filters) {
  let query = db().from('materials').select('id, owner_id, owner_name, title, subject_code, category, description, file_path, file_ext, file_size, download_count, created_at')
  if (filters && filters.subjectCode) query = query.eq('subject_code', filters.subjectCode)
  if (filters && filters.category) query = query.eq('category', filters.category)
  if (filters && filters.keyword) query = query.ilike('title', '%' + filters.keyword + '%')
  const res = await query.order('id', { ascending: false }).limit(200)
  if (res.error) throw res.error
  return res.data || []
}

async function getMaterial(id) {
  const res = await db().from('materials').select('*').eq('id', Number(id)).maybeSingle()
  if (res.error) throw res.error
  return res.data || null
}

async function createMaterial(payload) {
  const session = await requireLogin()
  if (!session) return null
  const res = await db().from('materials').insert({
    title: payload.title,
    subject_code: payload.subjectCode || 'common',
    category: payload.category || '讲义',
    description: payload.description || '',
    file_path: payload.filePath,
    file_ext: payload.fileExt || 'pdf',
    file_size: payload.fileSize || 0,
    owner_name: (session.user && session.user.name) || null
  }).select()
  if (res.error) throw res.error
  return res.data ? res.data[0] : null
}

async function bumpDownload(id, current) {
  const res = await db().from('materials').update({ download_count: (Number(current) || 0) + 1 }).eq('id', Number(id)).select()
  if (res.error) throw res.error
  const affected = Array.isArray(res.data) ? res.data : []
  if (affected.length === 0) throw new Error('这条资料不存在，或你没有修改权限')
  return affected[0]
}

async function deleteMaterial(id) {
  const res = await db().from('materials').delete().eq('id', Number(id)).select()
  if (res.error) throw res.error
  return Array.isArray(res.data) ? res.data.length : 0
}

async function uploadFile(localPath, relPath, contentType) {
  const cloud = getCloud()
  const session = await requireLogin()
  if (!session) return null
  const path = cloud.storage.sharedPath(session.user.id, relPath)
  const fs = wx.getFileSystemManager()
  const body = fs.readFileSync(localPath)
  try {
    const res = await cloud.storage.upload(path, body, { contentType: contentType || 'application/octet-stream', upsert: true })
    if (res && res.error) throw res.error
    return path
  } catch (e) {
    throw e
  }
}

async function signedUrl(path, ttl) {
  const cloud = getCloud()
  const res = await cloud.storage.createSignedUrl(path, ttl || 600)
  if (res && res.error) throw res.error
  return res && res.data ? res.data.signedUrl : null
}

// ---------------------------------------------------------------- 起始题库同步到云端

async function syncStarterToCloud() {
  const session = await requireLogin()
  if (!session) return { ok: false, message: '请先登录' }
  const rows = starterQuestions.map(function (q) {
    return {
      subject_code: q.subjectCode,
      chapter_code: q.chapterCode,
      type: q.type,
      stem: q.stem,
      options: q.options,
      answer: q.answer,
      analysis: q.analysis,
      difficulty: q.difficulty,
      source: 'original',
      tags: q.tags || [],
      contributor_name: (session.user && session.user.name) || null
    }
  })
  const res = await db().from('questions').insert(rows).select('id')
  if (res.error) throw res.error
  setSynced(true)
  return { ok: true, count: (res.data || []).length }
}

// ---------------------------------------------------------------- 登录

// 微信登录：wx.login 拿 code，再换成云服务会话。
// 登录失败绝不能伪造一个本地会话，页面要如实显示失败状态。
function signIn() {
  return new Promise(function (resolve) {
    wx.login({
      success: function (res) {
        if (!res.code) {
          resolve({ ok: false, message: '没有拿到微信登录凭证' })
          return
        }
        let appid = ''
        try {
          appid = wx.getAccountInfoSync().miniProgram.appId
        } catch (e) { /* 开发者工具里可能取不到 */ }
        getCloud().auth.signInWithWechat(res.code, appid).then(function (out) {
          if (out && out.error) {
            resolve({ ok: false, message: out.error.message || '登录失败' })
            return
          }
          const session = out && out.data
          const app = getApp()
          if (app && app.setSession && session) app.setSession(session)
          resolve(session ? { ok: true, session: session } : { ok: false, message: '登录失败' })
        }, function (err) {
          resolve({ ok: false, message: (err && err.message) || '登录失败' })
        })
      },
      fail: function () {
        resolve({ ok: false, message: '微信登录被取消或失败' })
      }
    })
  })
}

async function signOut() {
  try {
    await getCloud().auth.signOut()
  } catch (e) { /* 忽略 */ }
  const app = getApp()
  if (app && app.setSession) app.setSession(null)
  return true
}

module.exports = {
  getCloud: getCloud,
  signIn: signIn,
  signOut: signOut,
  currentSession: currentSession,
  requireLogin: requireLogin,
  unwrap: unwrap,
  isSynced: isSynced,
  setSynced: setSynced,
  getLocalQuestions: getLocalQuestions,
  listQuestions: listQuestions,
  listQuestionsByIds: listQuestionsByIds,
  subjectAnswerStats: subjectAnswerStats,
  getQuestionById: getQuestionById,
  countQuestionsBySubject: countQuestionsBySubject,
  recordAnswer: recordAnswer,
  questionKeyOf: questionKeyOf,
  attemptCount: attemptCount,
  answerHistory: answerHistory,
  upsertWrong: upsertWrong,
  clearWrong: clearWrong,
  listWrong: listWrong,
  setMastered: setMastered,
  submitCorrection: submitCorrection,
  listCorrections: listCorrections,
  applyOverride: applyOverride,
  removeOverride: removeOverride,
  listOverrides: listOverrides,
  listFavorites: listFavorites,
  toggleFavorite: toggleFavorite,
  addTodayStats: addTodayStats,
  listCheckins: listCheckins,
  bumpChapterProgress: bumpChapterProgress,
  listProgress: listProgress,
  totalAnswered: totalAnswered,
  recentAnswerCount: recentAnswerCount,
  answeredQuestionKeys: answeredQuestionKeys,
  wrongQuestionKeys: wrongQuestionKeys,
  listPapers: listPapers,
  createExamSession: createExamSession,
  submitExamSession: submitExamSession,
  listExamSessions: listExamSessions,
  getExamSession: getExamSession,
  listNotes: listNotes,
  getNote: getNote,
  createNote: createNote,
  updateNote: updateNote,
  deleteNote: deleteNote,
  pickModel: pickModel,
  generateQuestions: generateQuestions,
  recognizeImage: recognizeImage,
  saveDrafts: saveDrafts,
  listDrafts: listDrafts,
  updateDraft: updateDraft,
  deleteDraft: deleteDraft,
  approveDraft: approveDraft,
  listMaterials: listMaterials,
  getMaterial: getMaterial,
  createMaterial: createMaterial,
  bumpDownload: bumpDownload,
  deleteMaterial: deleteMaterial,
  uploadFile: uploadFile,
  signedUrl: signedUrl,
  syncStarterToCloud: syncStarterToCloud
}
