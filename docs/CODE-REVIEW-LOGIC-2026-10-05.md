# 代码审查报告 — PF 投产比计算器（重写后版本）

> 审查日期：2026-10-05
> 审查对象：`main` @ `cda4f64`（工作区状态，含 10-05 的终端账本重写）
> 审查范围：**功能实现是否达成、逻辑正确性、潜在 bug 与边界、可读性/可维护性、重写引入的副作用**
> 审查方法：**逐文件精读 + 运行验证**。所有缺陷均在真实构建产物上复现过，附复现步骤。

---

## 一、结论摘要

整体质量**良好**。架构方向正确（单向数据流 + store 分层），工程基线全绿
（`eslint` 0 报错、`tsc --noEmit` 通过、`vitest` 60/60、`vite build` 成功），
并且重写**修好了上一版遗留的一个实质性建模问题**（出金阶段语义）。

但存在 **3 个可复现的功能性缺陷**、**4 个一致性问题**、**4 个可维护性问题**。

| 分类 | 数量 | 说明 |
| :--- | :--- | :--- |
| **P1 功能性缺陷** | 3 | 均有实测复现，用户可触达 |
| **P2 一致性/交互** | 4 | 不崩，但产生"界面说的和实际算的不一样" |
| **P3 可读性/可维护性** | 4 | 死代码、陈旧注释、类型承诺不符 |

**关键结论：重写没有引入架构性错误，但把"输入框与计算值双真值"这个隐患从
隐式变成了显式（新增 `AppState.inputs`），并留下了一批死 API 和陈旧注释。**

---

## 二、P1 功能性缺陷（实测复现）

### P1-1 预设下拉选「自定义」后，界面与状态脱钩

**现象**：先选 Apex 预设（说明区显示 Apex 规则）→ 再从下拉里选「自定义 / 默认示例」
→ **下拉显示"自定义"，但说明区仍然显示 Apex 的内容**，两者矛盾。

**复现（实测输出）**：

```
t1_afterApex          = { selectValue: 'apex-50k-eod', note: 'Apex Trader Funding · $50,000 · 50K · EOD ...' }
t1_afterPickingCustom = { selectValue: 'custom',       note: 'Apex Trader Funding · $50,000 · 50K · EOD ...' }
DESYNC = true
```

**根因**（`src/main.ts:103-110`）：

```ts
presetSelect.addEventListener('change', () => {
  const id = presetSelect.value;
  if (id === CUSTOM_PRESET_ID) return;   // ← 直接 return，没有回写 store
  if (!store.applyPreset(id)) return;
  ...
});
```

选中 `custom` 时直接返回，`store.presetId` 保持不变，而
`syncPresetSelect()` 只在 `state.presetId` **变化**时才触发（`main.ts:278-282`），
所以下拉框停在"自定义"，说明区停在旧预设，两者永久不一致。

**修复建议**（`src/main.ts`）：

```ts
presetSelect.addEventListener('change', () => {
  const id = presetSelect.value;
  if (id === CUSTOM_PRESET_ID) {
    // 显式进入"自定义"状态：保留当前输入，仅摘掉预设归属
    store.applyInputs(form.read(), CUSTOM_PRESET_ID);
    return;
  }
  if (!store.applyPreset(id)) {
    syncPresetSelect(store.get().presetId);  // 未知 id：回滚下拉框，避免假状态
    return;
  }
  form.write(store.get().inputs);
  const preset = getPreset(id);
  if (preset) announce(`${preset.firm} ${pick(preset.variant, getLocale())}`);
});
```

**验证方式**：
```js
preset.value = 'apex-50k-eod'; preset.dispatchEvent(new Event('change'));
preset.value = 'custom';       preset.dispatchEvent(new Event('change'));
// 断言：note.hidden === true
```

---

### P1-2 负数输入静默失效：输入框与实际计算值不一致

**现象**：在「单号成本」输入 `-50`，输入框**保留显示 `-50`**，但所有指标按 `0` 计算，
**界面没有任何提示**。用户会认为 -50 已生效。

**复现（实测输出）**：

```
输入框显示          : "-50"
a_savedInputs.cost  : 0        ← 存进 localStorage 的是 0
买号成本卡片         : "$0"
总投入成本卡片       : "$745"
ROI                : "+141.61%"
对比表行            : NEG 测试 | +141.61% | 3.2000% | 31.25 | $745
```

**根因**：两层各自处理，互不告知。

1. `src/ui/form.ts:106-113` — `read()` 原样返回 `parseFloat('-50') = -50`；
2. `src/domain/calculator.ts:53-62` — `sanitizeInputs()` 把它夹到 `0`；
3. 但**没有任何回写**：`form.write()` 只在预设/重置/载入方案时调用，
   所以输入框永远保留 `-50`。

`min="0"` 只是 HTML 校验属性，**不阻止键入负号**，因此真实用户可触达。

**修复建议**（二选一）：

- **A（推荐）输入侧即时纠正**：在 `form.ts` 的 `input` 监听里，若 `value < min`
  则立即回写 `String(min)` 并给输入框加 `data-invalid` 短暂高亮，让用户看见"被改了"。
- **B 显式报错**：在 `renderResult` 里检测 `state.inputs !== state.result.inputs`
  的差异字段，展示"已忽略非法值"提示条。

同时建议把 `min` 提升为真实约束：`form.read()` 里直接
`Math.max(spec.min, parseFloat(...) || 0)`，让"输入框所见"与"计算所用"永远一致。

**验证方式**：
```js
setVal('f-costPerAccount', '-50');
// 断言：document.getElementById('f-costPerAccount').value === '0'
// 或：存在可见的非法值提示
```

---

### P1-3 极端输入渲染出科学计数法字符串

**现象**：输入 `回撤=1 / 目标=99999 / 天数=9`（全部可通过键盘输入），
指标卡片与对比表渲染出 `9.999999999999985e+89`、`$4.899999999999992e+91` 这类字符串，
在卡片里被硬裁成半个乱码。

**复现（实测输出）**：

```
考试通过率    0.00%
出金通过率    0.00%
总通过率      0.0000%
期望购买账号  9.999999999999985e+89      ← 21 字符
预计获资账号  9.999999999999993e+44
买号成本      $4.899999999999992e+91     ← 22 字符
激活费用      $1.4899999999999989e+47
总投入成本    $4.899999999999992e+91

对比表：EXP 测试 | -100.00% | 0.0000% | 9.999999999999985e+89 | $4.899999999999992e+91
```

**根因（关键，容易被忽略）**：`Number.prototype.toFixed()` 在**数值 ≥ 1e21 时返回指数形式**，
所以 `.toFixed(2)` 并不能兜住溢出。Node 实测：

```
1e+20  -> toFixed(2): 100000000000000000000.00
1e+21  -> toFixed(2): 1e+21          ← 从这里开始变成指数
1e+22  -> toFixed(2): 1e+22
9.99e45-> toFixed(2): 9.99e+45
```

受影响的函数（`src/domain/formatter.ts`）：`formatCount`、`formatMoney`、`formatSignedMoney`
（`formatPercent` 走 `*100`，同样可能触发）。
另外 `src/ui/compare.ts:136` **绕过 formatter 模块**手写了 `accounts.toFixed(2)`，同样中招。

**测试缺口**：`tests/calculator.test.ts` 覆盖了 `sanitizeInputs` 的负数夹取和 `NaN` 兜底，
但**没有任何用例覆盖极大数值**——所以这个缺陷不会被 CI 拦住。

**修复建议**：

```ts
// src/domain/formatter.ts
/** 超过此绝对值改用紧凑记法，避免 toFixed 退化为指数形式并撑破卡片。 */
const COMPACT_THRESHOLD = 1e7;

function compact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (abs >= 1e9)  return `${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6)  return `${(value / 1e6).toFixed(1)}M`;
  return value.toFixed(2);
}

export function formatCount(value: number, decimals = 2): string {
  if (!isUsable(value)) return PLACEHOLDER;
  return Math.abs(value) >= COMPACT_THRESHOLD ? compact(value) : value.toFixed(decimals);
}
```

并补两条测试（**当前会失败，正好证明缺陷存在**）：

```ts
it('never emits exponential notation, however large the value', () => {
  expect(formatCount(1e45, 2)).not.toMatch(/e[+-]\d/i);
  expect(formatMoney(1e45)).not.toMatch(/e[+-]\d/i);
});
```

**验证方式**：
```js
setVal('f-examDrawdown','1'); setVal('f-examTarget','99999'); setVal('f-examDays','9');
setVal('f-payoutDrawdown','1'); setVal('f-payoutTarget','99999'); setVal('f-payoutDays','9');
// 断言：所有 .metric__value 的 textContent 都不匹配 /e[+-]\d/
```

---

## 三、P2 一致性 / 交互问题

### P2-1 一旦编辑任何字段，预设说明（含 ⚠️ 警告与来源链接）立即消失

**实测**：

```
应用 FTMO 预设            → note = "FTMO · $100,000 · 100K · 1-Step Challenge ..."
把单号成本 540 改成 541    → note = "(hidden)"
```

**影响**：说明区里承载的是**这个项目最重要的诚实性内容**——官方规则摘要、
`source` 链接、置信度、"days 语义"警告。用户刚想动手试参数，这些就全没了，
恰好是在最需要它的时刻。

**归属**：这是**继承自上一版**的行为（原 `syncPresetSelection` 同样直接 `hidden = true`），
重写没有修，也没有恶化。

**修复建议**：不要 `hidden = true`，而是保留说明并降级为"当前为自定义参数，
以下为该预设的官方规则参考"，即把 `note` 从"当前状态描述"改成"参考资料"。
或者：仅在字段真正偏离该预设**关键字段**（回撤/目标/天数）时才收起，改价格类字段不收起。

---

### P2-2 `verified` 硬编码英文，未走 i18n

**实测**：`document.documentElement.lang === 'zh-CN'` 时，徽章文本为 `verified 2026-10`。

**根因**（`src/main.ts:127`）：

```ts
text: `verified ${preset.verifiedAt}`,
```

`src/i18n/*.ts` 中**没有**对应键。这违反 `CONTRIBUTING.md` 自己写下的
「所有面向用户的文案都要走 `src/i18n`」。`tsc` 不会报错，因为这是裸字符串。

**归属**：**继承自上一版**（原实现同一行）。

**修复建议**：两个字典各加 `presetVerified: '核实于 {month}'` / `'verified {month}'`，
调用处 `t().presetVerified.replace('{month}', preset.verifiedAt)`。

---

### P2-3 `AppState.inputs` 与 `AppState.result.inputs` 双真值（**本次重写新引入**）

`src/state/store.ts:82-91`：

```ts
setInputs(inputs: CalculatorInputs): void {
  ...
  withResult(inputs, stillMatches ? state.presetId : CUSTOM_PRESET_ID);
}
// withResult → set({ inputs, presetId, result: calculate(inputs) })
```

`state.inputs` 存的是**未净化**的原始值（可为负、可超出范围），
而 `state.result.inputs` 存的是 `sanitizeInputs()` 之后的净化值。
**同一个 `AppState` 里存在两份语义不同却同名的 inputs。**

实测证据：输入 `-50` 时，`state.inputs.costPerAccount === -50`，
而 `state.result.inputs.costPerAccount === 0`。

当前恰好没有代码渲染 `state.inputs`，所以还没炸；但这是**明确的类型承诺违约**
（`AppState.inputs: CalculatorInputs` 暗示它已是合法输入），
任何后续新增的"显示当前输入"功能都会踩雷。

**归属**：**本次重写新引入**（上一版没有 store，输入框是唯一真值）。

**修复建议**：`setInputs` 内先净化再存：

```ts
setInputs(inputs: CalculatorInputs): void {
  const safe = sanitizeInputs(inputs);          // 单一真值
  const preset = getPreset(state.presetId);
  const stillMatches = preset !== undefined &&
    (Object.keys(preset.inputs) as Array<keyof CalculatorInputs>)
      .every((key) => preset.inputs[key] === safe[key]);
  withResult(safe, stillMatches ? state.presetId : CUSTOM_PRESET_ID);
}
```
（注意：这样 `form.read()` 也应当返回净化值，见 P1-2 的修复 A，两者配套。）

---

### P2-4 `--positive` / `--negative` 被复用为状态色

`src/styles/components.css:753-759`：

```css
.toast--success { border-left-color: var(--negative); }  /* 语义 = 亏损色 */
.toast--error   { border-left-color: var(--positive); }  /* 语义 = 盈利色 */
```

本项目采用红涨绿跌，所以"成功=绿、错误=红"**当前看着正确，但原因错了**——
它借用的是盈亏语义。一旦有人把配色切回欧美惯例，成功提示会变红、错误变绿，
变成真 bug 且极难定位。

**修复建议**：拆出 `--success` / `--danger` 状态令牌，`--positive`/`--negative` 只服务盈亏数值。

---

## 四、P3 可读性 / 可维护性

### P3-1 陈旧注释引用了不存在的文件

`src/ui/compare.ts:11`：

```
 * callbacks. All state lives in `app.ts`, which makes the panel trivially
```

**`app.ts` 已不存在**（现在是 `main.ts` + `state/store.ts`）。
而且描述也已过时——状态现在在 store 里，不在视图模块。

**归属**：**本次重写引入**（重命名/重构后未同步注释）。
这类"注释与代码脱节"最伤新人，建议顺手全仓扫一遍
（`grep -rn "app\.ts\|src/core" src` 只剩这一处）。

---

### P3-2 死 API：三个导出的方法无人调用

| 位置 | 方法 | 调用次数 |
| :--- | :--- | ---: |
| `src/ui/compare.ts:175` | `peekName()` | **0** |
| `src/ui/compare.ts:185` | `focusName()` | **0** |
| `src/ui/form.ts:134` | `focusFirst()` | **0** |

`peekName()` 是上一版为顶部"保存"按钮引入的；重写把保存入口收敛到对比面板后，
它就成了孤儿。`focusName()` / `focusFirst()` 同样从未接线。

**修复建议**：删除，或真正接线（例如预设切换后 `form.focusFirst()`，
这在桌面端是合理的交互）。

---

### P3-3 对比表绕过 formatter 模块

`src/ui/compare.ts:136`：

```ts
h('td', { text: accounts > 0 ? accounts.toFixed(2) : '--' }),
```

同一份"数量格式化"逻辑，`metrics.ts` 与 `export-image.ts` 都走
`formatCount(value, 2)` / `PLACEHOLDER`，只有这里手写。
结果是**同一组数字在卡片和表格里可能显示不同**，并且 P1-3 的指数缺陷在这里重复出现。

**修复建议**：改为 `formatCount(accounts, 2)`（`accounts === 0` 时 `formatCount` 会输出 `0.00`，
若需要 `--` 请显式用 `PLACEHOLDER` 常量）。

---

### P3-4 `export-image.ts` 体积偏大且与 UI 耦合

324 行的单文件 Canvas 绘制，包含硬编码的 `W/H/CARD/PAD` 与 `INK` 颜色常量
（`INK` 与 `tokens.css` 是两份独立的颜色定义）。若主题色调整，
分享图不会跟着变——**双份真值**。

**修复建议**：把 `INK` 改为从 CSS 自定义属性读取
（`getComputedStyle(document.documentElement).getPropertyValue('--text-strong')`），
让分享图与主题共用一份调色板。

---

## 五、重写引入 / 修好的东西（对比清单）

| 项 | 归属 | 说明 |
| :--- | :--- | :--- |
| `AppState.inputs` 双真值 | ⚠️ **重写新引入** | 见 P2-3 |
| `peekName` / `focusName` / `focusFirst` 死代码 | ⚠️ **重写新引入** | 见 P3-2 |
| `compare.ts` 陈旧 `app.ts` 注释 | ⚠️ **重写新引入** | 见 P3-1 |
| `CREDIT_URL` 硬编码第三方 B 站外链 + 页脚致谢 | ⚠️ **重写新引入** | 需确认授权（`target="_blank" rel="noopener noreferrer"` 已正确设置 ✅） |
| `PROJECT_URL` 换成真实仓库 `MFLS2023/pf-roi-calculator` | ⚠️ **重写新引入** | 占位符已全部替换，`your-name` 残留 0 处 ✅ |
| **出金阶段语义修正**（`days=1` + 单次尝试建模） | ✅ **重写修好** | 见 `d188406`，说明文字质量很高，是本次最重要的实质改进 |
| **`normalizeScenarios` 超限时保留最新条目** | ✅ **重写修好** | 与 `persistScenarios` 的 `slice(-MAX)` 语义对齐了 |
| **`prefers-reduced-motion` 全局降级** | ✅ **重写修好** | 一行 `*{animation-duration:.01ms}` 兜住全部动效 |
| 移动端 ROI 悬浮条 | ✅ 新增 | 避让 toast、安全区、`aria-label` 都处理了 |
| 4 列指标网格 | ✅ 新增 | 消除了 3×3 的空占位格 |
| 测试 52 → 60 项 | ✅ 新增 | 但仍有 P1-3 的覆盖缺口 |
| 负数静默失效 / 预设下拉脱钩 / 说明消失 / `verified` 硬编码 / 指数记数法 | ⚪ **继承未修** | 上一版就存在，重写既未修也未恶化 |

---

## 六、建议的修复顺序

| 顺序 | 项 | 改动量 | 建议 |
| :--- | :--- | :--- | :--- |
| 1 | P1-3 指数记数法 + 补测试 | ~20 行 | **优先**，有明确测试可锁死 |
| 2 | P1-1 预设下拉脱钩 | ~8 行 | 一行 `return` 引发的状态不一致 |
| 3 | P1-2 负数静默失效 | ~10 行 | 建议与 P2-3 一起改（同一处净化） |
| 4 | P2-3 双真值 | ~5 行 | 与 P1-2 配套，一次改到位 |
| 5 | P2-2 i18n 补键 | ~4 行 | 两个字典各加一行 |
| 6 | P3-1 / P3-2 清理 | ~10 行 | 删死代码、改注释 |
| 7 | P2-1 说明区保留策略 | 中 | 涉及交互设计，建议先定策略 |
| 8 | P2-4 / P3-3 / P3-4 | 中 | 结构性整理，可排后 |

---

## 七、可复现性

```bash
npm ci
npm run build
npm run preview          # 打开 :4173
```

在 DevTools Console 中粘贴以下探针即可复现全部 P1：

```js
const nativeSet = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
const setVal = (id, v) => { const el = document.getElementById(id);
  nativeSet.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
const preset = document.getElementById('preset-select');
const note = document.getElementById('preset-note');

// P1-1 预设下拉脱钩
preset.value = 'apex-50k-eod'; preset.dispatchEvent(new Event('change'));
preset.value = 'custom';       preset.dispatchEvent(new Event('change'));
console.log('P1-1 脱钩?', preset.value === 'custom' && !note.hidden);   // true

// P1-2 负数静默失效
document.getElementById('reset-btn').click();
setVal('f-costPerAccount', '-50');
console.log('P1-2 输入框:', document.getElementById('f-costPerAccount').value,   // -50
            '卡片:', document.querySelector('[data-metric="account-cost"] .metric__value').textContent); // $0

// P1-3 指数记数法
document.getElementById('reset-btn').click();
setVal('f-examDrawdown','1'); setVal('f-examTarget','99999'); setVal('f-examDays','9');
setVal('f-payoutDrawdown','1'); setVal('f-payoutTarget','99999'); setVal('f-payoutDays','9');
console.log('P1-3 指数?', [...document.querySelectorAll('.metric__value')]
  .some(v => /e[+-]\d/.test(v.textContent)));                            // true
```

单元测试层可直接用这两条断言锁死 P1-3：

```ts
expect(formatCount(1e45, 2)).not.toMatch(/e[+-]\d/i);   // 当前失败
expect(formatMoney(1e45)).not.toMatch(/e[+-]\d/i);      // 当前失败
```

---

## 附：本次审查未覆盖的范围

- **Tauri 桌面壳**：本机无 Rust，未做构建验证（配置与图标已静态检查，无异常）。
- **Service Worker 离线行为**：上一轮已实测（`workbox-precache` 生效、SW active），本次未重复。
- **视觉/配色对比度**：已在 `CODE-REVIEW-2026-10-05.md` 单独出报告，本次不重复。
