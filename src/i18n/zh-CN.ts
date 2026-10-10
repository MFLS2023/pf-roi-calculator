/**
 * Chinese (Simplified) dictionary — the CANONICAL shape of the app's copy.
 *
 * `Dict` is derived from this object, so `src/i18n/en.ts` is type-checked for
 * key parity: forgetting to translate a string becomes a compile error.
 */

export const zhCN = {
  /* ---------- meta ---------- */
  htmlLang: 'zh-CN',
  appTitle: 'ROI 计算器',
  appSubtitle: 'PF 投产比计算器',
  docTitle: 'PF 投产比计算器 · Prop Firm ROI Calculator',
  githubLabel: '在 GitHub 上查看源码',

  /* ---------- toolbar ---------- */
  presetLabel: '机构预设',
  presetCustom: '自定义 / 默认示例',
  presetVerified: '核实于 {month}',
  presetModified: '参数已修改',
  presetDisclaimer:
    '预设参数为社区维护的参考值（标注了核实月份）。机构规则、账户规模与促销价变动频繁，请以官网为准。',
  languageLabel: '语言',
  reset: '重置变量',

  /* ---------- groups ---------- */
  groupBasics: '基础成本',
  groupExam: '考试阶段',
  groupPayout: '出金阶段',
  tagOnce: '一次性投入',
  tagProbability: '概率计算',
  tagSettlement: '收益结算',

  /* ---------- fields ---------- */
  fieldCostPerAccount: '单号成本',
  fieldActivationFee: '激活费用',
  fieldExamDrawdown: '考试回撤',
  fieldExamTarget: '考试利润',
  fieldExamDays: '考试天数',
  fieldPayoutDrawdown: '出金回撤',
  fieldPayoutTarget: '出金利润',
  fieldPayoutDays: '出金天数',
  fieldActualPayout: '实际出金',
  unitUsd: 'USD',
  unitDays: '天',

  fieldHintCostPerAccount: '购买一个考试账号的费用',
  fieldHintActivationFee: '考核通过、进入获资账号时缴纳的一次性费用',
  fieldHintExamDrawdown: '考试阶段触发失败的最大回撤',
  fieldHintExamTarget: '考试阶段需要达到的利润目标',
  fieldHintExamDays: '考试阶段最少需要的交易日数',
  fieldHintPayoutDrawdown: '出金阶段允许的最大回撤',
  fieldHintPayoutTarget: '申请出金前需要达到的利润目标',
  fieldHintPayoutDays: '出金阶段最少需要的交易日数',
  fieldHintActualPayout: '扣除平台分成后，单个成功账号实际到手的金额',

  /* ---------- actions ---------- */
  exportImage: '导出分享图',
  exporting: '正在生成…',
  exportDone: '分享图已保存',
  exportFailed: '导出失败，请改用截图',

  /* ---------- metrics ---------- */
  metricExamRate: '考试通过率',
  metricPayoutRate: '出金通过率',
  metricTotalRate: '总通过率',
  metricAccountsToBuy: '期望购买账号',
  metricFundedAccounts: '预计获资账号',
  metricAccountCost: '买号成本',
  metricActivationCost: '激活费用',
  metricTotalCost: '总投入成本',

  /* ---------- ROI card ---------- */
  roiTitle: '投产回报率',
  roiActualPayout: '实际出金',
  roiNetProfit: '净盈利',
  roiNetLoss: '净亏损',
  roiInvalid: '请检查输入参数：回撤 + 利润必须大于 0',
  roiVerdictPositive: '期望为正，值得投入',
  roiVerdictNegative: '期望为负，长期必亏',

  /* ---------- comparison ---------- */
  compareTitle: '多方案对比',
  compareHint: '保存不同参数组合，横向比较哪个买号策略更划算。',
  compareSave: '保存当前方案',
  compareNamePlaceholder: '给方案起个名字',
  compareDelete: '删除',
  compareClearAll: '清空全部',
  compareEmpty: '还没有保存的方案。调好参数后点「保存当前方案」。',
  compareBest: '最优',
  compareTh: '方案',
  compareThRoi: 'ROI',
  compareThPassRate: '总通过率',
  compareThAccounts: '期望买号',
  compareThTotalCost: '总投入',
  compareThActions: '',
  compareLimitReached: '最多保存 20 个方案，请先删除一些。',
  compareLoad: '载入',
  compareConfirmClear: '确定清空全部方案？此操作不可撤销。',

  /* ---------- footer ---------- */
  footerModel: '模型：P = (D / (D + T))^N · 零漂移随机游走（赌徒破产）',
  footerDisclaimer:
    '本工具仅做数学期望测算，不构成投资建议。交易有风险，历史概率不代表未来结果。',

  /* ---------- PWA ---------- */
  installApp: '安装到设备',
  installIosHint: 'iOS：点「分享」→「添加到主屏幕」',
  offlineReady: '已可离线使用',

  /* ---------- misc ---------- */
  placeholder: '--',
  barAriaLabel: '跳转到完整结果区',

  /* ---------- navigation & tools ---------- */
  navFirmsBoard: '机构选型看板',
  navLookupModal: '手续费与规格',
} as const satisfies Record<string, string>;

/** Canonical dictionary type — every locale file must satisfy it. */
export type Dict = { [K in keyof typeof zhCN]: string };
