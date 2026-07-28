# Kraft Paper — 回归夹具

一份用于主题预览和回归检查的示例文档。亮色用 `kraft-paper.css`，暗色用 `kraft-paper-dark.css`，对照同一份内容检查色板与对比度。

开发者在改 `src/` 后请：`npm test && npm run build`，再用本文件在 Typora 中走下方清单。

---

## 回归清单

### A. 内容排版（`#write`）

- [ ] 标题 h1–h6 层级与字重清晰；文首 h1 顶距不过大
- [ ] 正文衬线；**粗体**分层（拉丁衬线粗 / 中文黑体不发糊）
- [ ] 链接陶土色；悬停下划线
- [ ] 引用：无底色 + 左侧竖线
- [ ] 表格：表头 / 行线 / 底边分级；行悬停淡橙；**悬停表格时九宫格不被拉成通栏**
- [ ] 任务列表：未勾 / 已勾对比度；完成项删除线 + 弱化
- [ ] 行内代码小圆角暖底；`!=` 不显示为 ≠
- [ ] 代码围栏语法色可读（关键字 / 字符串 / 数字 / 注释）
- [ ] `==高亮==` 在亮暗下均可读
- [ ] 脚注上标与定义区
- [ ] 键盘键帽：<kbd>Ctrl</kbd>+<kbd>F</kbd>

### B. 编辑器 chrome

- [ ] 侧栏激活项：淡橙底 + 陶土左边线
- [ ] 快速打开 / 下拉菜单阴影与面板底正常
- [ ] 查找面板：命中暖琥珀；选项按钮 active 字色为 on-accent
- [ ] 主按钮 / 偏好设置激活项：on-accent 前景

### C. 模式专属

- [ ] **源码模式**（深色）：标题 / 注释 / 字符串 / 链接 / 关键字可读
- [ ] **打印 / 导出 PDF**（深色主题）：自动亮色纸面，非深底白字
- [ ] **滚动条**（深色）：拇指条不刺眼
- [ ] Windows：megamenu / 侧栏图标字体未被界面字族冲掉

### D. 自动化（开发者）

- [ ] `npm test` 通过（token 对齐、结构无硬编码色、明暗结构对等、打印注入）
- [ ] `npm run build` 后 monofile 与 README 色板表更新

---

## 长文阅读体验

好的阅读主题不需要不断提醒读者它的存在。它应当让正文保持稳定的节奏，并通过恰当的留白、字重和色彩帮助视线自然移动。Kraft Paper 使用衬线字体呈现正文，并让**关键结论以独立强调字族突出**（拉丁衬线粗体，中文黑体），从而在不增加额外装饰的情况下建立清晰层级。

中英文混排也应保持自然：A calm interface helps the reader stay focused on the content itself，而不是被界面细节打断。

> 设计不是让信息变得更响亮，而是让重要信息更容易被看见。
>
> 引用块采用简洁的左侧竖线，并保持接近正文的纸面阅读感。

### 二级标题示例

#### 三级与更小

##### 五级标题

###### 六级（眉题感）

---

## 信息组织

### 对比表

| 元素 | 设计处理 | 目标 |
| --- | --- | --- |
| 正文 | 温和的衬线字体与舒展行距 | 支持持续阅读 |
| **粗体** | 强调字族与清晰字重 | 快速识别重点 |
| 引用 | 无底色、左侧竖线 | 减少卡片感 |
| 表格 | 分级暖灰边框 | 提升扫描效率 |
| 栏宽 | 固定 768px measure | 避免大屏行过长 |
| on-accent | 强调底上的前景 | 勾选 / 芯片可读 |

宽表压力测试（横向扫描）：

| Token | Light | Dark | 用途 |
| --- | --- | --- | --- |
| `--bg-color` | 暖纸 | 暖深 | 主纸面 |
| `--accent-color` | 陶土 | 亮陶土 | 交互强调 |
| `--on-accent-color` | 近纸白 | 近纸深 | 强调上前景 |

### 列表

- 无序一项
- 嵌套
  - 子项 A
  - 子项 B
- 回到外层

1. 有序第一
2. 有序第二
   1. 嵌套有序
3. 收尾

### 任务列表

- [x] 统一标题、正文和强调内容的层级
- [x] 优化引用块与表格样式（内容表 / 编辑浮层 seam）
- [x] 完善任务列表的完成状态（`--checkbox-check-image`）
- [x] 提供 Kraft Paper 暗色主题
- [x] 单一结构源 + 双 token 构建
- [ ] 探索第二宿主 adapter（例如 Obsidian；token 已可搬运）

无段落包裹的完成项（兼容路径）：

- [x] bare checked item
- [ ] bare open item

---

## 技术内容

行内代码适合标记文件名和命令，例如 `kraft-paper.css`、`src/tokens/light.css`、`npm run build` 和 `git status`。

高亮可用于划重点：==暖琥珀底的高亮== 在亮暗两色下都应保持可读。

```javascript
const theme = {
  name: "Kraft Paper",
  modes: ["light", "dark"],
  // structure once; tokens per mode
  source: ["src/tokens", "src/structure", "src/host"],
  files: ["kraft-paper.css", "kraft-paper-dark.css"],
  focus: ["reading", "writing", "clarity"],
};

console.log(`${theme.name}: ${theme.focus.join(", ")}`);
// operators must not ligate: != !== <= >=
if (theme.modes.length != 0) {
  theme.ready = true;
}
```

```python
def paper_surface(mode: str) -> str:
    """Return the paper token name for a mode."""
    return "--bg-color"  # shared name; values live in tokens/*
```

脚注也可用于补充说明。[^1]

### YAML / 元信息块（若编辑器展示 front-matter）

主题对 `pre.md-meta-block` 有独立底色；在 Typora 中打开含 front-matter 的文档可检视。

---

## 小结

Kraft Paper 希望在温暖的纸张质感、清晰的信息层级与日常技术写作之间取得平衡。源码层是 **tokens × structure × host adapter**；交付层仍是两个 monofile。暗色版共享 structure，仅替换色板并附加暗色 host 规则。

[^1]: 脚注是论文与长文中的常见元素，主题对其字号与分隔做了单独处理。
