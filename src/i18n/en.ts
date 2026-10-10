import type { Dict } from './zh-CN';

/** English dictionary. Missing keys are a compile error (see `Dict`). */
export const en: Dict = {
  /* ---------- meta ---------- */
  htmlLang: 'en',
  appTitle: 'ROI Calculator',
  appSubtitle: 'Prop Firm ROI Calculator',
  docTitle: 'Prop Firm ROI Calculator · PF 投产比计算器',
  githubLabel: 'View the source on GitHub',

  /* ---------- toolbar ---------- */
  presetLabel: 'Firm preset',
  presetCustom: 'Custom / reference example',
  presetVerified: 'verified {month}',
  presetModified: 'inputs modified',
  presetDisclaimer:
    'Presets are community-maintained reference values (month verified is shown). Firm rules, account sizes and promo pricing change often — always verify on the official site.',
  languageLabel: 'Language',
  reset: 'Reset',

  /* ---------- groups ---------- */
  groupBasics: 'Base cost',
  groupExam: 'Evaluation phase',
  groupPayout: 'Payout phase',
  tagOnce: 'One-off spend',
  tagProbability: 'Probability',
  tagSettlement: 'Settlement',

  /* ---------- fields ---------- */
  fieldCostPerAccount: 'Account cost',
  fieldActivationFee: 'Activation fee',
  fieldExamDrawdown: 'Evaluation drawdown',
  fieldExamTarget: 'Evaluation target',
  fieldExamDays: 'Evaluation days',
  fieldPayoutDrawdown: 'Payout drawdown',
  fieldPayoutTarget: 'Payout target',
  fieldPayoutDays: 'Payout days',
  fieldActualPayout: 'Actual payout',
  unitUsd: 'USD',
  unitDays: 'days',

  fieldHintCostPerAccount: 'Price of buying one evaluation account',
  fieldHintActivationFee: 'One-off fee charged when the evaluation is passed',
  fieldHintExamDrawdown: 'Max drawdown that fails the evaluation phase',
  fieldHintExamTarget: 'Profit target required to pass the evaluation',
  fieldHintExamDays: 'Minimum trading days required for the evaluation',
  fieldHintPayoutDrawdown: 'Max drawdown allowed during the payout phase',
  fieldHintPayoutTarget: 'Profit target required before requesting a payout',
  fieldHintPayoutDays: 'Minimum trading days required for the payout phase',
  fieldHintActualPayout: 'Cash you actually receive after the profit split, per successful account',

  /* ---------- actions ---------- */
  exportImage: 'Export share image',
  exporting: 'Rendering…',
  exportDone: 'Share image saved',
  exportFailed: 'Export failed — please screenshot instead',

  /* ---------- metrics ---------- */
  metricExamRate: 'Evaluation pass rate',
  metricPayoutRate: 'Payout pass rate',
  metricTotalRate: 'Combined pass rate',
  metricAccountsToBuy: 'Accounts to buy',
  metricFundedAccounts: 'Funded accounts',
  metricAccountCost: 'Account cost',
  metricActivationCost: 'Activation cost',
  metricTotalCost: 'Total cost',

  /* ---------- ROI card ---------- */
  roiTitle: 'Return on investment',
  roiActualPayout: 'Actual payout',
  roiNetProfit: 'Net profit',
  roiNetLoss: 'Net loss',
  roiInvalid: 'Check your inputs — drawdown + target must be greater than 0',
  roiVerdictPositive: 'Positive expectancy — worth funding',
  roiVerdictNegative: 'Negative expectancy — a guaranteed long-run loss',

  /* ---------- comparison ---------- */
  compareTitle: 'Scenario comparison',
  compareHint: 'Save several parameter sets and compare which account-buying strategy pays off.',
  compareSave: 'Save current scenario',
  compareNamePlaceholder: 'Name this scenario',
  compareDelete: 'Delete',
  compareClearAll: 'Clear all',
  compareEmpty: 'No saved scenarios yet. Tune the inputs, then hit "Save current scenario".',
  compareBest: 'Best',
  compareTh: 'Scenario',
  compareThRoi: 'ROI',
  compareThPassRate: 'Pass rate',
  compareThAccounts: 'Accounts',
  compareThTotalCost: 'Total cost',
  compareThActions: '',
  compareLimitReached: 'Up to 20 scenarios. Delete a few first.',
  compareLoad: 'Load',
  compareConfirmClear: 'Clear every saved scenario? This cannot be undone.',

  /* ---------- footer ---------- */
  footerModel: 'Model: P = (D / (D + T))^N · zero-drift random walk (gambler\u2019s ruin)',
  footerDisclaimer:
    'This tool performs a mathematical expectancy estimate only. Nothing here is investment advice. Trading carries risk; past probabilities do not predict future results.',

  /* ---------- PWA ---------- */
  installApp: 'Install app',
  installIosHint: 'iOS: tap Share → Add to Home Screen',
  offlineReady: 'Ready for offline use',

  /* ---------- misc ---------- */
  placeholder: '--',
  barAriaLabel: 'Jump to the full results',

  /* ---------- navigation & tools ---------- */
  navFirmsBoard: 'Prop Firms Board',
  navLookupModal: 'Fees & Specs',
};
