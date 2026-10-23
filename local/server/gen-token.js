// 生成 JWT（与 PostgREST 共用 JWT_SECRET）：
//  - anon token：role=anon，供未登录读取公共表
//  - dev user token：role=authenticated, sub=dev001，便于本地调试
// 用法：node gen-token.js
require('dotenv').config()
const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET || 'localdev-secret-please-change'
const anon = jwt.sign({ role: 'anon', iss: 'local' }, secret, { expiresIn: '10y' })
const user = jwt.sign({ sub: 'dev001', role: 'authenticated', iss: 'local' }, secret, { expiresIn: '10y' })
console.log('ANON_TOKEN=', anon)
console.log('DEV_USER_TOKEN=', user)
