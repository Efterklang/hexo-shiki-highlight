# Hexo Shiki Highlight

基于 Shiki 语法高亮库的 Hexo 插件，支持双主题自适应切换功能。

## 功能特性

- 🎨 **双主题支持**: 自动适应明暗主题切换
- 🌓 **响应式设计**: 支持系统级暗色模式检测 (`@media (prefers-color-scheme: dark)`)
- 🎯 **类名切换**: 支持基于 `html.dark` 选择器的主题切换
- 🎪 **CSS变量驱动**: 使用 CSS 变量实现无缝主题过渡
- 📝 **完整语法高亮**: 基于 Shiki 提供准确的语法高亮
- 🛠️ **丰富工具栏**: 支持行号切换、代码复制、换行切换等功能

## 安装

```bash
npm install hexo-shiki-highlight
```

## 配置

在 Hexo 的 `_config.yml` 文件中添加以下配置：

```yaml
# Shiki 语法高亮配置
shiki:
  # 明亮主题配置
  light-theme: 'min-light'
  # 暗色主题配置
  dark-theme: 'nord'
  # 显示行号
  line_number: true

  # 排除的语言（这些语言不会被高亮处理）
  exclude_languages: []

  # 语言别名映射
  language_aliases:
    js: javascript
    ts: typescript
    py: python

  # 工具栏功能开关
  highlight_linenumber_toggle: true  # 行号切换按钮
  highlight_wrap_toggle: true        # 换行切换按钮
  highlight_lang: true               # 显示语言标签
  highlight_title: true              # 显示代码标题
  highlight_copy: true               # 复制按钮
  highlight_raw: true                # 原始代码查看按钮
  is_highlight_shrink: true          # 代码块折叠功能
  highlight_height_limit: 300        # 代码块高度限制（像素）

  # 复制功能提示文本
  copy:
    success: '复制成功!'
    error: '复制失败!'
```

## 支持的主题

### 明亮主题
- `min-light` (推荐)
- `github-light`
- `github-light-default`
- `light-plus`
- `material-theme-lighter`
- `one-light`
- `slack-ochin`
- `solarized-light`

### 暗色主题
- `nord` (推荐)
- `github-dark`
- `github-dark-default`
- `dark-plus`
- `dracula`
- `material-theme-darker`
- `monokai`
- `one-dark-pro`
- `slack-dark`
- `solarized-dark`

## 主题切换实现

### 系统级暗色模式检测

插件会自动检测用户的系统主题偏好：

```css
@media (prefers-color-scheme: dark) {
  .shiki,
  .shiki span {
    color: var(--shiki-dark) !important;
    background-color: var(--shiki-dark-bg) !important;
  }
}
```

### 基于类名的主题切换

如果你的网站支持手动主题切换，可以通过在 `html` 元素上添加 `dark` 类来切换到暗色主题：

```css
html.dark .shiki,
html.dark .shiki span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
}
```

### JavaScript 主题切换示例

```javascript
// 切换到暗色主题
document.documentElement.classList.add('dark');

// 切换到明亮主题
document.documentElement.classList.remove('dark');

// 切换主题
document.documentElement.classList.toggle('dark');
```

## 使用方法

在 Markdown 文件中使用标准的代码块语法：

````markdown
```javascript 示例代码
function greet(name) {
  console.log(`Hello, ${name}!`);
}

greet('World');
```
````

## CSS 变量

插件生成的代码块包含以下 CSS 变量：

- `--shiki-light`: 明亮主题文字颜色
- `--shiki-light-bg`: 明亮主题背景颜色
- `--shiki-dark`: 暗色主题文字颜色
- `--shiki-dark-bg`: 暗色主题背景颜色

你可以在自定义 CSS 中覆盖这些变量来调整主题样式。

## 生成的 HTML 结构

```html
<figure class="shiki shiki-themes javascript" data_title="示例代码">
  <div class="shiki-tools">
    <!-- 工具栏内容 -->
  </div>
  <div class="codeblock">
    <div class="gutter">
      <pre><!-- 行号 --></pre>
    </div>
    <div class="code">
      <pre class="shiki shiki-themes" style="background-color:var(--shiki-light-bg);color:var(--shiki-light)" data-language="javascript" data-theme="min-light nord">
        <code>
          <!-- 高亮后的代码 -->
        </code>
      </pre>
    </div>
  </div>
</figure>
```
