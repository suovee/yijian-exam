// publicConfig —— 来自云服务 activate 返回的前端可公开配置（云端模式使用）
// 只有这四个值可以出现在前端代码里；底层环境 id 和密钥都在服务端，不会下发。
const publicConfig = {
  resourceId: 'wbcs_5EBgV29q1sA1AXzkISsdoj',
  endpoint: 'https://mp-api.app.workbuddy.host',
  publishableKey: 'wbpk_HUrc3L12tuG4mAZPRsHCnp_xaRwON2ZID37swWJsfGvG3lnMYF5YrNs'
}

// 本地自托管开关：true = 走本机 PostgREST + 本地服务；false = 走 WorkBuddy 云
// 切到本地前，请确保 docker-compose 与 local/server 已经启动（见 README-LOCAL.md）。
const USE_LOCAL = true

// 本地环境连接信息（docker-compose + local/server 启动后，按你本机实际地址填写）
const LOCAL = {
  restUrl: 'http://localhost:54321',   // PostgREST（docker 已把容器内 3000 映射到本机 54321）
  serverUrl: 'http://localhost:8787',  // 本地 Node 服务（微信登录 / 文件存储 / LLM 代理）
  llmModel: 'local-llm',              // 仅作标识，真实模型由服务端 .env 的 LLM_MODEL 控制
  // 与 docker-compose 中 PGRST_JWT_SECRET 同源的静态 anon token（role=anon），供未登录时读取公共表
  anonToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6ImxvY2FsIn0.4uwigzVX3sCa9n5xfjaMo0ox93RIb6uORrt9LYOPZKs'
}

module.exports = { publicConfig, USE_LOCAL, LOCAL }
