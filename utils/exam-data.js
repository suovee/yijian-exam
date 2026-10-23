// 本文件由 tests/seed/build-chapters.js 生成 —— 不要手工编辑。
// 一建四科的科目元数据与官方教材章节树（实务目前只含机电工程）。

const subjects = [
  {
    "code": "ECON",
    "name": "建设工程经济",
    "examMinutes": 120,
    "fullScore": 100,
    "passScore": 60,
    "sortOrder": 1
  },
  {
    "code": "LAW",
    "name": "建设工程法规及相关知识",
    "examMinutes": 120,
    "fullScore": 130,
    "passScore": 78,
    "sortOrder": 2
  },
  {
    "code": "MGMT",
    "name": "建设工程项目管理",
    "examMinutes": 180,
    "fullScore": 130,
    "passScore": 78,
    "sortOrder": 3
  },
  {
    "code": "ELEC",
    "name": "机电工程管理与实务",
    "examMinutes": 240,
    "fullScore": 160,
    "passScore": 96,
    "sortOrder": 4
  }
]

const chapters = [
  {
    "subjectCode": "ECON",
    "code": "1Z101000",
    "parentCode": null,
    "name": "工程经济",
    "level": 1,
    "sortOrder": 100
  },
  {
    "subjectCode": "ECON",
    "code": "1Z101010",
    "parentCode": "1Z101000",
    "name": "资金时间价值的计算及应用",
    "level": 2,
    "sortOrder": 101
  },
  {
    "subjectCode": "ECON",
    "code": "1Z101020",
    "parentCode": "1Z101000",
    "name": "技术方案经济效果评价",
    "level": 2,
    "sortOrder": 102
  },
  {
    "subjectCode": "ECON",
    "code": "1Z101030",
    "parentCode": "1Z101000",
    "name": "技术方案不确定性分析",
    "level": 2,
    "sortOrder": 103
  },
  {
    "subjectCode": "ECON",
    "code": "1Z101040",
    "parentCode": "1Z101000",
    "name": "技术方案现金流量表的编制",
    "level": 2,
    "sortOrder": 104
  },
  {
    "subjectCode": "ECON",
    "code": "1Z101050",
    "parentCode": "1Z101000",
    "name": "设备更新分析",
    "level": 2,
    "sortOrder": 105
  },
  {
    "subjectCode": "ECON",
    "code": "1Z101060",
    "parentCode": "1Z101000",
    "name": "价值工程在工程建设中的应用",
    "level": 2,
    "sortOrder": 106
  },
  {
    "subjectCode": "ECON",
    "code": "1Z101070",
    "parentCode": "1Z101000",
    "name": "新技术新工艺和新材料方案的技术经济分析",
    "level": 2,
    "sortOrder": 107
  },
  {
    "subjectCode": "ECON",
    "code": "1Z102000",
    "parentCode": null,
    "name": "工程财务",
    "level": 1,
    "sortOrder": 200
  },
  {
    "subjectCode": "ECON",
    "code": "1Z102010",
    "parentCode": "1Z102000",
    "name": "财务会计基础",
    "level": 2,
    "sortOrder": 201
  },
  {
    "subjectCode": "ECON",
    "code": "1Z102020",
    "parentCode": "1Z102000",
    "name": "成本与费用",
    "level": 2,
    "sortOrder": 202
  },
  {
    "subjectCode": "ECON",
    "code": "1Z102030",
    "parentCode": "1Z102000",
    "name": "收入",
    "level": 2,
    "sortOrder": 203
  },
  {
    "subjectCode": "ECON",
    "code": "1Z102040",
    "parentCode": "1Z102000",
    "name": "利润和所得税费用",
    "level": 2,
    "sortOrder": 204
  },
  {
    "subjectCode": "ECON",
    "code": "1Z102050",
    "parentCode": "1Z102000",
    "name": "企业财务报表",
    "level": 2,
    "sortOrder": 205
  },
  {
    "subjectCode": "ECON",
    "code": "1Z102060",
    "parentCode": "1Z102000",
    "name": "财务分析",
    "level": 2,
    "sortOrder": 206
  },
  {
    "subjectCode": "ECON",
    "code": "1Z102070",
    "parentCode": "1Z102000",
    "name": "筹资管理",
    "level": 2,
    "sortOrder": 207
  },
  {
    "subjectCode": "ECON",
    "code": "1Z102080",
    "parentCode": "1Z102000",
    "name": "流动资产财务管理",
    "level": 2,
    "sortOrder": 208
  },
  {
    "subjectCode": "ECON",
    "code": "1Z103000",
    "parentCode": null,
    "name": "建设工程估价",
    "level": 1,
    "sortOrder": 300
  },
  {
    "subjectCode": "ECON",
    "code": "1Z103010",
    "parentCode": "1Z103000",
    "name": "建设项目总投资",
    "level": 2,
    "sortOrder": 301
  },
  {
    "subjectCode": "ECON",
    "code": "1Z103020",
    "parentCode": "1Z103000",
    "name": "建设工程定额",
    "level": 2,
    "sortOrder": 302
  },
  {
    "subjectCode": "ECON",
    "code": "1Z103030",
    "parentCode": "1Z103000",
    "name": "建设工程项目设计概算",
    "level": 2,
    "sortOrder": 303
  },
  {
    "subjectCode": "ECON",
    "code": "1Z103040",
    "parentCode": "1Z103000",
    "name": "建设工程项目施工图预算",
    "level": 2,
    "sortOrder": 304
  },
  {
    "subjectCode": "ECON",
    "code": "1Z103050",
    "parentCode": "1Z103000",
    "name": "工程量清单编制",
    "level": 2,
    "sortOrder": 305
  },
  {
    "subjectCode": "ECON",
    "code": "1Z103060",
    "parentCode": "1Z103000",
    "name": "工程量清单计价",
    "level": 2,
    "sortOrder": 306
  },
  {
    "subjectCode": "ECON",
    "code": "1Z103070",
    "parentCode": "1Z103000",
    "name": "计量与支付",
    "level": 2,
    "sortOrder": 307
  },
  {
    "subjectCode": "ECON",
    "code": "1Z103080",
    "parentCode": "1Z103000",
    "name": "国际工程投标报价",
    "level": 2,
    "sortOrder": 308
  },
  {
    "subjectCode": "LAW",
    "code": "1Z301000",
    "parentCode": null,
    "name": "建设工程法律制度",
    "level": 1,
    "sortOrder": 100
  },
  {
    "subjectCode": "LAW",
    "code": "1Z301010",
    "parentCode": "1Z301000",
    "name": "建设工程法律体系",
    "level": 2,
    "sortOrder": 101
  },
  {
    "subjectCode": "LAW",
    "code": "1Z301020",
    "parentCode": "1Z301000",
    "name": "建设工程法人制度",
    "level": 2,
    "sortOrder": 102
  },
  {
    "subjectCode": "LAW",
    "code": "1Z301030",
    "parentCode": "1Z301000",
    "name": "建设工程代理制度",
    "level": 2,
    "sortOrder": 103
  },
  {
    "subjectCode": "LAW",
    "code": "1Z301040",
    "parentCode": "1Z301000",
    "name": "建设工程物权制度",
    "level": 2,
    "sortOrder": 104
  },
  {
    "subjectCode": "LAW",
    "code": "1Z301050",
    "parentCode": "1Z301000",
    "name": "建设工程债权制度",
    "level": 2,
    "sortOrder": 105
  },
  {
    "subjectCode": "LAW",
    "code": "1Z301060",
    "parentCode": "1Z301000",
    "name": "建设工程知识产权制度",
    "level": 2,
    "sortOrder": 106
  },
  {
    "subjectCode": "LAW",
    "code": "1Z301070",
    "parentCode": "1Z301000",
    "name": "建设工程担保制度",
    "level": 2,
    "sortOrder": 107
  },
  {
    "subjectCode": "LAW",
    "code": "1Z301080",
    "parentCode": "1Z301000",
    "name": "建设工程保险制度",
    "level": 2,
    "sortOrder": 108
  },
  {
    "subjectCode": "LAW",
    "code": "1Z301090",
    "parentCode": "1Z301000",
    "name": "建设工程法律责任制度",
    "level": 2,
    "sortOrder": 109
  },
  {
    "subjectCode": "LAW",
    "code": "1Z302000",
    "parentCode": null,
    "name": "施工许可法律制度",
    "level": 1,
    "sortOrder": 200
  },
  {
    "subjectCode": "LAW",
    "code": "1Z302010",
    "parentCode": "1Z302000",
    "name": "建设工程施工许可制度",
    "level": 2,
    "sortOrder": 201
  },
  {
    "subjectCode": "LAW",
    "code": "1Z302020",
    "parentCode": "1Z302000",
    "name": "施工企业从业资格制度",
    "level": 2,
    "sortOrder": 202
  },
  {
    "subjectCode": "LAW",
    "code": "1Z302030",
    "parentCode": "1Z302000",
    "name": "建造师注册执业制度",
    "level": 2,
    "sortOrder": 203
  },
  {
    "subjectCode": "LAW",
    "code": "1Z303000",
    "parentCode": null,
    "name": "建设工程发承包法律制度",
    "level": 1,
    "sortOrder": 300
  },
  {
    "subjectCode": "LAW",
    "code": "1Z303010",
    "parentCode": "1Z303000",
    "name": "建设工程招标投标制度",
    "level": 2,
    "sortOrder": 301
  },
  {
    "subjectCode": "LAW",
    "code": "1Z303020",
    "parentCode": "1Z303000",
    "name": "建设工程承包制度",
    "level": 2,
    "sortOrder": 302
  },
  {
    "subjectCode": "LAW",
    "code": "1Z303030",
    "parentCode": "1Z303000",
    "name": "建筑市场信用体系建设",
    "level": 2,
    "sortOrder": 303
  },
  {
    "subjectCode": "LAW",
    "code": "1Z304000",
    "parentCode": null,
    "name": "建设工程合同和劳动合同法律制度",
    "level": 1,
    "sortOrder": 400
  },
  {
    "subjectCode": "LAW",
    "code": "1Z304010",
    "parentCode": "1Z304000",
    "name": "建设工程合同制度",
    "level": 2,
    "sortOrder": 401
  },
  {
    "subjectCode": "LAW",
    "code": "1Z304020",
    "parentCode": "1Z304000",
    "name": "劳动合同及劳动关系制度",
    "level": 2,
    "sortOrder": 402
  },
  {
    "subjectCode": "LAW",
    "code": "1Z304030",
    "parentCode": "1Z304000",
    "name": "相关合同制度",
    "level": 2,
    "sortOrder": 403
  },
  {
    "subjectCode": "LAW",
    "code": "1Z305000",
    "parentCode": null,
    "name": "施工环境保护、节约能源和文物保护法律制度",
    "level": 1,
    "sortOrder": 500
  },
  {
    "subjectCode": "LAW",
    "code": "1Z305010",
    "parentCode": "1Z305000",
    "name": "施工现场环境保护制度",
    "level": 2,
    "sortOrder": 501
  },
  {
    "subjectCode": "LAW",
    "code": "1Z305020",
    "parentCode": "1Z305000",
    "name": "施工节约能源制度",
    "level": 2,
    "sortOrder": 502
  },
  {
    "subjectCode": "LAW",
    "code": "1Z305030",
    "parentCode": "1Z305000",
    "name": "施工文物保护制度",
    "level": 2,
    "sortOrder": 503
  },
  {
    "subjectCode": "LAW",
    "code": "1Z306000",
    "parentCode": null,
    "name": "建设工程安全生产法律制度",
    "level": 1,
    "sortOrder": 600
  },
  {
    "subjectCode": "LAW",
    "code": "1Z306010",
    "parentCode": "1Z306000",
    "name": "施工安全生产许可证制度",
    "level": 2,
    "sortOrder": 601
  },
  {
    "subjectCode": "LAW",
    "code": "1Z306020",
    "parentCode": "1Z306000",
    "name": "施工安全生产责任和安全生产教育培训制度",
    "level": 2,
    "sortOrder": 602
  },
  {
    "subjectCode": "LAW",
    "code": "1Z306030",
    "parentCode": "1Z306000",
    "name": "施工现场安全防护制度",
    "level": 2,
    "sortOrder": 603
  },
  {
    "subjectCode": "LAW",
    "code": "1Z306040",
    "parentCode": "1Z306000",
    "name": "施工安全事故的应急救援与调查处理",
    "level": 2,
    "sortOrder": 604
  },
  {
    "subjectCode": "LAW",
    "code": "1Z306050",
    "parentCode": "1Z306000",
    "name": "建设单位和相关单位的安全责任制度",
    "level": 2,
    "sortOrder": 605
  },
  {
    "subjectCode": "LAW",
    "code": "1Z307000",
    "parentCode": null,
    "name": "建设工程质量法律制度",
    "level": 1,
    "sortOrder": 700
  },
  {
    "subjectCode": "LAW",
    "code": "1Z307010",
    "parentCode": "1Z307000",
    "name": "工程建设标准",
    "level": 2,
    "sortOrder": 701
  },
  {
    "subjectCode": "LAW",
    "code": "1Z307020",
    "parentCode": "1Z307000",
    "name": "施工单位的质量责任和义务",
    "level": 2,
    "sortOrder": 702
  },
  {
    "subjectCode": "LAW",
    "code": "1Z307030",
    "parentCode": "1Z307000",
    "name": "建设单位及相关单位的质量责任和义务",
    "level": 2,
    "sortOrder": 703
  },
  {
    "subjectCode": "LAW",
    "code": "1Z307040",
    "parentCode": "1Z307000",
    "name": "建设工程竣工验收制度",
    "level": 2,
    "sortOrder": 704
  },
  {
    "subjectCode": "LAW",
    "code": "1Z307050",
    "parentCode": "1Z307000",
    "name": "建设工程质量保修制度",
    "level": 2,
    "sortOrder": 705
  },
  {
    "subjectCode": "LAW",
    "code": "1Z308000",
    "parentCode": null,
    "name": "解决建设工程纠纷法律制度",
    "level": 1,
    "sortOrder": 800
  },
  {
    "subjectCode": "LAW",
    "code": "1Z308010",
    "parentCode": "1Z308000",
    "name": "建设工程纠纷主要种类和法律解决途径",
    "level": 2,
    "sortOrder": 801
  },
  {
    "subjectCode": "LAW",
    "code": "1Z308020",
    "parentCode": "1Z308000",
    "name": "民事诉讼制度",
    "level": 2,
    "sortOrder": 802
  },
  {
    "subjectCode": "LAW",
    "code": "1Z308030",
    "parentCode": "1Z308000",
    "name": "仲裁制度",
    "level": 2,
    "sortOrder": 803
  },
  {
    "subjectCode": "LAW",
    "code": "1Z308040",
    "parentCode": "1Z308000",
    "name": "调解、和解制度与争议评审",
    "level": 2,
    "sortOrder": 804
  },
  {
    "subjectCode": "LAW",
    "code": "1Z308050",
    "parentCode": "1Z308000",
    "name": "行政复议和行政诉讼制度",
    "level": 2,
    "sortOrder": 805
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z201000",
    "parentCode": null,
    "name": "建设工程项目的组织与管理",
    "level": 1,
    "sortOrder": 100
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z201010",
    "parentCode": "1Z201000",
    "name": "建设工程管理的内涵和任务",
    "level": 2,
    "sortOrder": 101
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z201020",
    "parentCode": "1Z201000",
    "name": "建设工程项目管理的目标和任务",
    "level": 2,
    "sortOrder": 102
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z201030",
    "parentCode": "1Z201000",
    "name": "建设工程项目的组织",
    "level": 2,
    "sortOrder": 103
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z201040",
    "parentCode": "1Z201000",
    "name": "建设工程项目策划",
    "level": 2,
    "sortOrder": 104
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z201050",
    "parentCode": "1Z201000",
    "name": "建设工程项目采购的模式",
    "level": 2,
    "sortOrder": 105
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z201060",
    "parentCode": "1Z201000",
    "name": "建设工程项目管理规划的内容和编制方法",
    "level": 2,
    "sortOrder": 106
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z201070",
    "parentCode": "1Z201000",
    "name": "施工组织设计的内容和编制方法",
    "level": 2,
    "sortOrder": 107
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z201080",
    "parentCode": "1Z201000",
    "name": "建设工程项目目标的动态控制",
    "level": 2,
    "sortOrder": 108
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z201090",
    "parentCode": "1Z201000",
    "name": "施工企业项目经理的工作性质、任务和责任",
    "level": 2,
    "sortOrder": 109
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z201100",
    "parentCode": "1Z201000",
    "name": "建设工程项目的风险和风险管理的工作流程",
    "level": 2,
    "sortOrder": 110
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z201110",
    "parentCode": "1Z201000",
    "name": "建设工程监理的工作性质、工作任务和工作方法",
    "level": 2,
    "sortOrder": 111
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z202000",
    "parentCode": null,
    "name": "建设工程项目成本管理",
    "level": 1,
    "sortOrder": 200
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z202010",
    "parentCode": "1Z202000",
    "name": "成本管理的任务、程序和措施",
    "level": 2,
    "sortOrder": 201
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z202020",
    "parentCode": "1Z202000",
    "name": "成本计划",
    "level": 2,
    "sortOrder": 202
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z202030",
    "parentCode": "1Z202000",
    "name": "成本控制",
    "level": 2,
    "sortOrder": 203
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z202040",
    "parentCode": "1Z202000",
    "name": "成本核算",
    "level": 2,
    "sortOrder": 204
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z202050",
    "parentCode": "1Z202000",
    "name": "成本分析和成本考核",
    "level": 2,
    "sortOrder": 205
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z203000",
    "parentCode": null,
    "name": "建设工程项目进度控制",
    "level": 1,
    "sortOrder": 300
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z203010",
    "parentCode": "1Z203000",
    "name": "建设工程项目进度控制与进度计划系统",
    "level": 2,
    "sortOrder": 301
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z203020",
    "parentCode": "1Z203000",
    "name": "建设工程项目总进度目标的论证",
    "level": 2,
    "sortOrder": 302
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z203030",
    "parentCode": "1Z203000",
    "name": "建设工程项目进度计划的编制和调整方法",
    "level": 2,
    "sortOrder": 303
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z203040",
    "parentCode": "1Z203000",
    "name": "建设工程项目进度控制的措施",
    "level": 2,
    "sortOrder": 304
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z204000",
    "parentCode": null,
    "name": "建设工程项目质量控制",
    "level": 1,
    "sortOrder": 400
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z204010",
    "parentCode": "1Z204000",
    "name": "建设工程项目质量控制的内涵",
    "level": 2,
    "sortOrder": 401
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z204020",
    "parentCode": "1Z204000",
    "name": "建设工程项目质量控制体系",
    "level": 2,
    "sortOrder": 402
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z204030",
    "parentCode": "1Z204000",
    "name": "建设工程项目施工质量控制",
    "level": 2,
    "sortOrder": 403
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z204040",
    "parentCode": "1Z204000",
    "name": "建设工程项目施工质量验收",
    "level": 2,
    "sortOrder": 404
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z204050",
    "parentCode": "1Z204000",
    "name": "施工质量不合格的处理",
    "level": 2,
    "sortOrder": 405
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z204060",
    "parentCode": "1Z204000",
    "name": "数理统计方法在工程质量管理中的应用",
    "level": 2,
    "sortOrder": 406
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z204070",
    "parentCode": "1Z204000",
    "name": "建设工程项目质量的政府监督",
    "level": 2,
    "sortOrder": 407
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z205000",
    "parentCode": null,
    "name": "建设工程职业健康安全与环境管理",
    "level": 1,
    "sortOrder": 500
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z205010",
    "parentCode": "1Z205000",
    "name": "职业健康安全管理体系与环境管理体系",
    "level": 2,
    "sortOrder": 501
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z205020",
    "parentCode": "1Z205000",
    "name": "建设工程安全生产管理",
    "level": 2,
    "sortOrder": 502
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z205030",
    "parentCode": "1Z205000",
    "name": "建设工程生产安全事故应急预案和事故处理",
    "level": 2,
    "sortOrder": 503
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z205040",
    "parentCode": "1Z205000",
    "name": "建设工程施工现场职业健康安全与环境管理的要求",
    "level": 2,
    "sortOrder": 504
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z206000",
    "parentCode": null,
    "name": "建设工程合同与合同管理",
    "level": 1,
    "sortOrder": 600
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z206010",
    "parentCode": "1Z206000",
    "name": "建设工程施工招标与投标",
    "level": 2,
    "sortOrder": 601
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z206020",
    "parentCode": "1Z206000",
    "name": "建设工程合同的内容",
    "level": 2,
    "sortOrder": 602
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z206030",
    "parentCode": "1Z206000",
    "name": "合同计价方式",
    "level": 2,
    "sortOrder": 603
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z206040",
    "parentCode": "1Z206000",
    "name": "建设工程施工合同风险管理、工程保险和工程担保",
    "level": 2,
    "sortOrder": 604
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z206050",
    "parentCode": "1Z206000",
    "name": "建设工程施工合同实施",
    "level": 2,
    "sortOrder": 605
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z206060",
    "parentCode": "1Z206000",
    "name": "建设工程索赔",
    "level": 2,
    "sortOrder": 606
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z206070",
    "parentCode": "1Z206000",
    "name": "国际建设工程施工承包合同",
    "level": 2,
    "sortOrder": 607
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z207000",
    "parentCode": null,
    "name": "建设工程项目信息管理",
    "level": 1,
    "sortOrder": 700
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z207010",
    "parentCode": "1Z207000",
    "name": "建设工程项目信息管理的目的和任务",
    "level": 2,
    "sortOrder": 701
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z207020",
    "parentCode": "1Z207000",
    "name": "建设工程项目信息的分类、编码和处理",
    "level": 2,
    "sortOrder": 702
  },
  {
    "subjectCode": "MGMT",
    "code": "1Z207030",
    "parentCode": "1Z207000",
    "name": "建设工程管理信息化及项目管理信息系统的功能",
    "level": 2,
    "sortOrder": 703
  },
  {
    "subjectCode": "ELEC",
    "code": "1H410000",
    "parentCode": null,
    "name": "机电工程技术",
    "level": 1,
    "sortOrder": 100
  },
  {
    "subjectCode": "ELEC",
    "code": "1H411000",
    "parentCode": "1H410000",
    "name": "机电工程常用材料及工程设备",
    "level": 2,
    "sortOrder": 200
  },
  {
    "subjectCode": "ELEC",
    "code": "1H411010",
    "parentCode": "1H411000",
    "name": "机电工程常用材料",
    "level": 3,
    "sortOrder": 201
  },
  {
    "subjectCode": "ELEC",
    "code": "1H411020",
    "parentCode": "1H411000",
    "name": "机电工程常用工程设备",
    "level": 3,
    "sortOrder": 202
  },
  {
    "subjectCode": "ELEC",
    "code": "1H412000",
    "parentCode": "1H410000",
    "name": "机电工程专业技术",
    "level": 2,
    "sortOrder": 300
  },
  {
    "subjectCode": "ELEC",
    "code": "1H412010",
    "parentCode": "1H412000",
    "name": "工程测量技术",
    "level": 3,
    "sortOrder": 301
  },
  {
    "subjectCode": "ELEC",
    "code": "1H412020",
    "parentCode": "1H412000",
    "name": "起重技术",
    "level": 3,
    "sortOrder": 302
  },
  {
    "subjectCode": "ELEC",
    "code": "1H412030",
    "parentCode": "1H412000",
    "name": "焊接技术",
    "level": 3,
    "sortOrder": 303
  },
  {
    "subjectCode": "ELEC",
    "code": "1H413000",
    "parentCode": "1H410000",
    "name": "工业机电工程安装技术",
    "level": 2,
    "sortOrder": 400
  },
  {
    "subjectCode": "ELEC",
    "code": "1H413010",
    "parentCode": "1H413000",
    "name": "机械设备安装技术",
    "level": 3,
    "sortOrder": 401
  },
  {
    "subjectCode": "ELEC",
    "code": "1H413020",
    "parentCode": "1H413000",
    "name": "电气工程安装技术",
    "level": 3,
    "sortOrder": 402
  },
  {
    "subjectCode": "ELEC",
    "code": "1H413030",
    "parentCode": "1H413000",
    "name": "管道工程安装技术",
    "level": 3,
    "sortOrder": 403
  },
  {
    "subjectCode": "ELEC",
    "code": "1H413040",
    "parentCode": "1H413000",
    "name": "静置设备及金属结构安装技术",
    "level": 3,
    "sortOrder": 404
  },
  {
    "subjectCode": "ELEC",
    "code": "1H413050",
    "parentCode": "1H413000",
    "name": "发电设备安装技术",
    "level": 3,
    "sortOrder": 405
  },
  {
    "subjectCode": "ELEC",
    "code": "1H413060",
    "parentCode": "1H413000",
    "name": "自动化仪表工程安装技术",
    "level": 3,
    "sortOrder": 406
  },
  {
    "subjectCode": "ELEC",
    "code": "1H413070",
    "parentCode": "1H413000",
    "name": "防腐蚀工程施工技术",
    "level": 3,
    "sortOrder": 407
  },
  {
    "subjectCode": "ELEC",
    "code": "1H413080",
    "parentCode": "1H413000",
    "name": "绝热工程施工技术",
    "level": 3,
    "sortOrder": 408
  },
  {
    "subjectCode": "ELEC",
    "code": "1H413090",
    "parentCode": "1H413000",
    "name": "炉窑砌筑工程施工技术",
    "level": 3,
    "sortOrder": 409
  },
  {
    "subjectCode": "ELEC",
    "code": "1H414000",
    "parentCode": "1H410000",
    "name": "建筑机电工程安装技术",
    "level": 2,
    "sortOrder": 500
  },
  {
    "subjectCode": "ELEC",
    "code": "1H414010",
    "parentCode": "1H414000",
    "name": "建筑管道工程安装技术",
    "level": 3,
    "sortOrder": 501
  },
  {
    "subjectCode": "ELEC",
    "code": "1H414020",
    "parentCode": "1H414000",
    "name": "建筑电气工程安装技术",
    "level": 3,
    "sortOrder": 502
  },
  {
    "subjectCode": "ELEC",
    "code": "1H414030",
    "parentCode": "1H414000",
    "name": "建筑给水排水与供暖工程安装技术",
    "level": 3,
    "sortOrder": 503
  },
  {
    "subjectCode": "ELEC",
    "code": "1H414040",
    "parentCode": "1H414000",
    "name": "建筑智能化工程安装技术",
    "level": 3,
    "sortOrder": 504
  },
  {
    "subjectCode": "ELEC",
    "code": "1H414050",
    "parentCode": "1H414000",
    "name": "电梯工程安装技术",
    "level": 3,
    "sortOrder": 505
  },
  {
    "subjectCode": "ELEC",
    "code": "1H414060",
    "parentCode": "1H414000",
    "name": "消防工程安装技术",
    "level": 3,
    "sortOrder": 506
  },
  {
    "subjectCode": "ELEC",
    "code": "1H420000",
    "parentCode": null,
    "name": "机电工程项目施工管理",
    "level": 1,
    "sortOrder": 600
  },
  {
    "subjectCode": "ELEC",
    "code": "1H420010",
    "parentCode": "1H420000",
    "name": "机电工程项目及其建设程序",
    "level": 2,
    "sortOrder": 601
  },
  {
    "subjectCode": "ELEC",
    "code": "1H420020",
    "parentCode": "1H420000",
    "name": "机电工程项目管理的任务",
    "level": 2,
    "sortOrder": 602
  },
  {
    "subjectCode": "ELEC",
    "code": "1H420030",
    "parentCode": "1H420000",
    "name": "机电工程施工招标投标管理",
    "level": 2,
    "sortOrder": 603
  },
  {
    "subjectCode": "ELEC",
    "code": "1H420040",
    "parentCode": "1H420000",
    "name": "机电工程施工合同管理",
    "level": 2,
    "sortOrder": 604
  },
  {
    "subjectCode": "ELEC",
    "code": "1H420050",
    "parentCode": "1H420000",
    "name": "机电工程设备采购管理",
    "level": 2,
    "sortOrder": 605
  },
  {
    "subjectCode": "ELEC",
    "code": "1H420060",
    "parentCode": "1H420000",
    "name": "机电工程施工组织设计",
    "level": 2,
    "sortOrder": 606
  },
  {
    "subjectCode": "ELEC",
    "code": "1H420070",
    "parentCode": "1H420000",
    "name": "机电工程施工资源管理",
    "level": 2,
    "sortOrder": 607
  },
  {
    "subjectCode": "ELEC",
    "code": "1H420080",
    "parentCode": "1H420000",
    "name": "机电工程施工协调管理",
    "level": 2,
    "sortOrder": 608
  },
  {
    "subjectCode": "ELEC",
    "code": "1H420090",
    "parentCode": "1H420000",
    "name": "机电工程施工进度管理",
    "level": 2,
    "sortOrder": 609
  },
  {
    "subjectCode": "ELEC",
    "code": "1H420100",
    "parentCode": "1H420000",
    "name": "机电工程施工成本管理",
    "level": 2,
    "sortOrder": 610
  },
  {
    "subjectCode": "ELEC",
    "code": "1H420110",
    "parentCode": "1H420000",
    "name": "机电工程施工预结算",
    "level": 2,
    "sortOrder": 611
  },
  {
    "subjectCode": "ELEC",
    "code": "1H420120",
    "parentCode": "1H420000",
    "name": "机电工程施工现场职业健康安全与环境管理",
    "level": 2,
    "sortOrder": 612
  },
  {
    "subjectCode": "ELEC",
    "code": "1H420130",
    "parentCode": "1H420000",
    "name": "机电工程施工质量管理",
    "level": 2,
    "sortOrder": 613
  },
  {
    "subjectCode": "ELEC",
    "code": "1H420140",
    "parentCode": "1H420000",
    "name": "机电工程试运行管理",
    "level": 2,
    "sortOrder": 614
  },
  {
    "subjectCode": "ELEC",
    "code": "1H420150",
    "parentCode": "1H420000",
    "name": "机电工程竣工验收管理",
    "level": 2,
    "sortOrder": 615
  },
  {
    "subjectCode": "ELEC",
    "code": "1H420160",
    "parentCode": "1H420000",
    "name": "机电工程保修与回访管理",
    "level": 2,
    "sortOrder": 616
  },
  {
    "subjectCode": "ELEC",
    "code": "1H430000",
    "parentCode": null,
    "name": "机电工程项目施工相关法规与标准",
    "level": 1,
    "sortOrder": 700
  },
  {
    "subjectCode": "ELEC",
    "code": "1H431000",
    "parentCode": "1H430000",
    "name": "机电工程项目施工相关法规",
    "level": 2,
    "sortOrder": 800
  },
  {
    "subjectCode": "ELEC",
    "code": "1H431010",
    "parentCode": "1H431000",
    "name": "计量的法律规定",
    "level": 3,
    "sortOrder": 801
  },
  {
    "subjectCode": "ELEC",
    "code": "1H431020",
    "parentCode": "1H431000",
    "name": "建设用电及施工的法律规定",
    "level": 3,
    "sortOrder": 802
  },
  {
    "subjectCode": "ELEC",
    "code": "1H431030",
    "parentCode": "1H431000",
    "name": "特种设备的法律规定",
    "level": 3,
    "sortOrder": 803
  },
  {
    "subjectCode": "ELEC",
    "code": "1H432000",
    "parentCode": "1H430000",
    "name": "机电工程项目施工相关标准",
    "level": 2,
    "sortOrder": 900
  },
  {
    "subjectCode": "ELEC",
    "code": "1H432010",
    "parentCode": "1H432000",
    "name": "工业安装工程施工质量验收统一要求",
    "level": 3,
    "sortOrder": 901
  },
  {
    "subjectCode": "ELEC",
    "code": "1H432020",
    "parentCode": "1H432000",
    "name": "建筑安装工程施工质量验收统一要求",
    "level": 3,
    "sortOrder": 902
  },
  {
    "subjectCode": "ELEC",
    "code": "1H433000",
    "parentCode": "1H430000",
    "name": "一级建造师（机电工程）注册执业管理规定及相关要求",
    "level": 2,
    "sortOrder": 1000
  },
  {
    "subjectCode": "ELEC",
    "code": "1H433010",
    "parentCode": "1H433000",
    "name": "注册执业管理规定",
    "level": 3,
    "sortOrder": 1001
  }
]

module.exports = { subjects, chapters }
