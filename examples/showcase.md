# Kraft Paper

一份用于主题预览和回归检查的示例文档。它集中展示 Kraft Paper 最常用的排版元素，也适合作为 README 截图的内容来源。亮色用 `kraft-paper.css`，暗色用 `kraft-paper-dark.css`，可对照同一份内容检查色板与对比度。

## 长文阅读体验

好的阅读主题不需要不断提醒读者它的存在。它应当让正文保持稳定的节奏，并通过恰当的留白、字重和色彩帮助视线自然移动。Kraft Paper 使用衬线字体呈现正文，并让**关键结论以独立强调字族突出**（拉丁衬线粗体，中文黑体），从而在不增加额外装饰的情况下建立清晰层级。

中英文混排也应保持自然：A calm interface helps the reader stay focused on the content itself，而不是被界面细节打断。

> 设计不是让信息变得更响亮，而是让重要信息更容易被看见。
>
> 引用块采用简洁的左侧竖线，并保持接近正文的纸面阅读感。

## 信息组织

### 对比表

| 元素 | 设计处理 | 目标 |
| --- | --- | --- |
| 正文 | 温和的衬线字体与舒展行距 | 支持持续阅读 |
| **粗体** | 强调字族与清晰字重 | 快速识别重点 |
| 引用 | 无底色、左侧竖线 | 减少卡片感 |
| 表格 | 分级暖灰边框 | 提升扫描效率 |
| 栏宽 | 固定 768px measure | 避免大屏行过长 |

### 任务列表

- [x] 统一标题、正文和强调内容的层级
- [x] 优化引用块与表格样式
- [x] 完善任务列表的完成状态
- [x] 提供 Kraft Paper 暗色主题
- [ ] 探索 Obsidian 适配

## 技术内容

行内代码适合标记文件名和命令，例如 `kraft-paper.css`、`kraft-paper-dark.css`、`README.md` 和 `git status`。

高亮可用于划重点：==暖琥珀底的高亮== 在亮暗两色下都应保持可读。

```javascript
const theme = {
  name: "Kraft Paper",
  modes: ["light", "dark"],
  files: ["kraft-paper.css", "kraft-paper-dark.css"],
  focus: ["reading", "writing", "clarity"],
};

console.log(`${theme.name}: ${theme.focus.join(", ")}`);
```

脚注也可用于补充说明。[^1]

## 小结

Kraft Paper 希望在温暖的纸张质感、清晰的信息层级与日常技术写作之间取得平衡。它不追求夸张的视觉效果，而是让长文、表格、任务和代码能够安静地共处。暗色版保持相同结构，仅替换色板，便于在同一套排版规则下切换环境。

[^1]: 脚注是论文与长文中的常见元素，主题对其字号与分隔做了单独处理。
