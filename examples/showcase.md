# Kraft Paper — 预览 / 自检

亮色：`kraft-paper.css` · 暗色：`kraft-paper-dark.css`

快速看一眼即可：

1. 标题 / 正文 / **粗体** 分层
2. 表格边线与行悬停；悬停时九宫格不要被拉成通栏
3. 任务列表勾选与完成态
4. 代码块与 `==高亮==`
5. 深色：源码模式可读；打印 / PDF 是否回到亮色纸面

---

## 长文

好的阅读主题不需要不断提醒读者它的存在。Kraft Paper 用衬线正文，并让**关键结论以强调字族突出**。

中英混排：A calm interface helps the reader stay focused on the content itself.

> 设计不是让信息变得更响亮，而是让重要信息更容易被看见。

### 对比表

| 元素 | 处理 | 目标 |
| --- | --- | --- |
| 正文 | 衬线 + 行距 1.7 | 持续阅读 |
| **粗体** | 强调字族 | 扫读重点 |
| 表格 | 分级暖灰边 | 扫描 |
| 栏宽 | 768px | 避免行过长 |

### 任务列表

- [x] 明暗主题
- [x] 单一 structure 源
- [ ] 第二宿主（可选）

### 代码

行内：`kraft-paper.css`、`npm run build`。

```javascript
const theme = { name: "Kraft Paper", modes: ["light", "dark"] };
// != should not ligate
if (theme.modes.length != 0) console.log(theme.name);
```

高亮：==暖琥珀== · 脚注。[^1]

[^1]: 脚注字号单独处理。
