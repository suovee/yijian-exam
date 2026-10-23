// publicConfig —— 来自云服务 activate 返回的前端可公开配置。
// 只有这四个值可以出现在前端代码里；底层环境 id 和密钥都在服务端，不会下发。
const publicConfig = {
  resourceId: 'wbcs_5EBgV29q1sA1AXzkISsdoj',
  endpoint: 'https://mp-api.app.workbuddy.host',
  publishableKey: 'wbpk_HUrc3L12tuG4mAZPRsHCnp_xaRwON2ZID37swWJsfGvG3lnMYF5YrNs'
}

module.exports = { publicConfig }
