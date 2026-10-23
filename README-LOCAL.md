# 一建备考小程序 · 本地自托管（完全脱离 WorkBuddy 云）部署手册

本目录提供把整套后端搬到你**本机**的方案：数据库用本机 PostgreSQL + PostgREST，微信登录 / 文件存储 / 大模型走一个本地 Node 服务。前端代码零改动（`utils/cloud.js` 按开关切换后端）。

> 与 WorkBuddy 云模式的关系：两者表结构、RLS、接口完全一致。切回云端只需把 `utils/config.js` 的 `USE_LOCAL` 改回 `false`。

---

## 一、架构

```
微信开发者工具（前端，utils/local-client.js）
   │  DB 查询（supabase-js → PostgREST）
   ▼
本机 Docker:  PostgreSQL:5432  +  PostgREST:54321
   │  微信登录 / 文件上传 / LLM 调用
   ▼
本机 Node:    local/server（:8787）—— 签发 JWT / 存文件 / 代理大模型
```

- **数据库**：`local/sql/` 下 4 个文件，首次 `docker compose up` 自动执行（角色 → 表结构 → 科目/章节/题目种子）。
- **REST API**：PostgREST 把 Postgres 直接暴露成 REST，supabase-js 原生可用，RLS 用 JWT 的 `sub` 做行级隔离。
- **本地服务**：处理微信 `code2session`、文件落盘、LLM 转发——这些需要服务端密钥，不能放前端。

---

## 二、前置依赖

- **Docker Desktop**（含 docker compose v2）：https://www.docker.com/products/docker-desktop/
- **Node.js** ≥ 18（本机跑 `local/server`）
- **微信开发者工具**（导入前端项目、构建 npm、真机调试）
- 可选：你的**微信小程序 AppID + AppSecret**（真机登录用；纯本地调试可用 `/dev-login` 跳过）

---

## 三、启动本地后端

### 1) 启动数据库 + PostgREST
```bash
cd yijian-miniprogram/local
docker compose up -d
```
验证：
```bash
curl http://localhost:54321/rest/v1/subjects        # 应返回 4 个科目
curl http://localhost:54321/rest/v1/questions?select=id  # 应返回 32 道题
```

### 2) 启动本地辅助服务
```bash
cd yijian-miniprogram/local/server
cp .env.example .env      # 然后编辑 .env 填入 WX_APPID / WX_SECRET / LLM_API_KEY
npm install
npm start                 # 监听 8787
```
验证：`curl http://localhost:8787/health` → `{"ok":true}`；`curl http://localhost:8787/anon-token` 应返回 token。

> 想自己生成 JWT 调试：`npm run gen-token`（用 `.env` 里的 `JWT_SECRET`，须与 docker-compose 的 `PGRST_JWT_SECRET` 一致）。

---

## 四、小程序端配置

1. **安装依赖 + 构建 npm**
   ```bash
   cd yijian-miniprogram
   npm install
   ```
   微信开发者工具里点 **工具 → 构建 npm**（生成 `miniprogram_npm/`）。

2. **切到本地模式**：编辑 `utils/config.js`
   ```js
   const USE_LOCAL = true
   const LOCAL = {
     restUrl: 'http://localhost:54321',   // 模拟器用 localhost；真机用电脑局域网 IP，如 http://192.168.x.x:54321
     serverUrl: 'http://localhost:8787',  // 同上，真机换成局域网 IP
     llmModel: 'local-llm'
   }
   ```
   > 真机调试时微信客户端访问的是你电脑，必须填电脑的**局域网 IP**（不是 localhost），且防火墙放行 54321 / 8787 端口。

3. **AppID**：把 `project.config.json` 的 `"appid": "touristappid"` 改成你的真实小程序 AppID，否则真机无法登录。

4. **导入项目**：微信开发者工具 → 导入项目 → 选 `yijian-miniprogram` 目录 → 编译运行。

---

## 五、微信登录 & 大模型

- **微信登录**：`local/server/.env` 填 `WX_APPID` / `WX_SECRET`（微信公众平台 → 开发管理 → 开发设置）。前端 `wx.login` 拿到 code → 本地服务 `code2session` → 签发 JWT → 后续请求带此 JWT，RLS 据此隔离数据。
- **纯本地调试跳过微信**：调用本地服务的 `POST /dev-login {uid:"dev001"}` 即可拿到一个 dev 用户 JWT（在「我的」页临时加个按钮调用，或 Postman 测接口）。
- **大模型**：`.env` 填 `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL`（任何 OpenAI 兼容端点；本地可用 Ollama / vLLM 的兼容地址）。

---

## 六、数据迁移说明

当前本地库已自带**结构 + 种子**（4 科目、170 章节、32 道原创题），开箱即用。若要把 WorkBuddy 云上的**业务数据**（你的作答记录、错题、知识点、资料等）迁过来：

1. 在 WorkBuddy 云侧把相关表（`answer_records` / `wrong_questions` / `knowledge_points` / `materials` / `checkins` / `study_progress` / `exam_sessions` / `ai_question_drafts` / `user_question_overrides` / `question_corrections` / `favorites`）导出为 CSV/JSON。
2. 本地用 `psql` 或写一个小脚本，映射到本机 `users` 表的 `owner_id`（云上的 `owner_id` 是微信 openid/uid，本地 `users.id` 是对应的本地 uid），再 `INSERT`。
3. 因本地用 JWT `sub` 作 `owner_id`，只要保证迁移后的 `owner_id` 与本地登录拿到的 uid 一致，RLS 就能正确隔离。

> 云侧数据所有权属于 WorkBuddy 云账号；迁移是一次性导出，不影响线上。

---

## 七、验证清单

- [ ] `docker compose up` 后两个 `curl` 能查到 subjects / questions
- [ ] `local/server` 启动且 `/health`、`/anon-token` 正常
- [ ] 小程序 `构建 npm` 成功，编译无报错
- [ ] 「我的」页能登录（真机走微信；调试走 /dev-login）
- [ ] 题库练习能写入 `answer_records`、错题集能看到记录
- [ ] 「学习」页 AI 出题能返回题目（依赖 LLM_API_KEY 配置正确）

---

## 八、已知注意点

- **supabase-js 在微信运行时的兼容**：已用 `wx.request` 适配 `fetch` 并关闭自动刷新会话；若编译报缺 `AbortController`/`URL` 等，需在开发者工具「详情 → 本地设置」勾选「ES6 转 ES5 / 增强编译」，或在 `local-client.js` 补充对应 polyfill。
- **localhost vs 局域网 IP**：模拟器可用 localhost；真机必须用电脑局域网 IP，且端口放行。
- **JWT 密钥**：`PGRST_JWT_SECRET` 与本地服务 `JWT_SECRET`、前端 `anonToken` 三者基于同一 secret，生产务必更换。
- **切回云端**：`USE_LOCAL = false` 即可，其余代码无需改动。

---

## 九、目录结构

```
yijian-miniprogram/
├─ local/
│  ├─ docker-compose.yml        # PostgreSQL + PostgREST
│  ├─ sql/
│  │  ├─ 00_roles.sql          # 角色 + auth.uid() 兼容函数
│  │  ├─ 01_schema.sql         # 15 张业务表 + RLS
│  │  ├─ 02~04_seed_*.sql      # 科目/章节/原创题种子（由 seed.js 生成）
│  │  └─ seed.js               # 从前端数据源重新生成种子
│  └─ server/                  # 本地 Node 辅助服务
│     ├─ index.js  .env.example  gen-token.js  package.json
├─ utils/
│  ├─ config.js                # USE_LOCAL 开关 + 本地地址
│  ├─ cloud.js                 # 按开关返回 云端 / 本地 门面
│  ├─ local-client.js          # 本地门面（supabase-js + 本地服务）
│  └─ api.js                   # 业务数据层（无需改动）
└─ README-LOCAL.md
```
