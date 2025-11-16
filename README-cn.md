<!-- 语言切换：English / 中文 -->
<p align="center">
  <a href="README.md">English</a> · <a href="README-cn.md">中文</a>
</p>

## 预览

浅色 & 深色 主题

| ![light](assets/README/light.png) | ![dark](assets/README/dark.png) |
| --------------------------------- | ------------------------------- |

Transformers 预览

![transformer](assets/README/transformer.png)

查看实时预览，请访问我的[博客](https://vluv.space/shiki_highlight/)。

## 安装

```bash
bun i hexo-shiki-highlight
```

在 Hexo 的 `_config.yml` 中添加以下配置：

```yaml
syntax_highlighter: shiki
```

如需自定义高亮器，请在 `_config.yml` 中添加 `shiki` 配置项，例如：

```yaml
shiki:
  themes:
    light: "catppuccin-latte"
    dark: "catppuccin-mocha"

  toolbar_items:
    lang: true
    title: true
    wrapToggle: true
    copyButton: true
    shrinkButton: true # 切换代码折叠/展开

  code_collapse:
    enable: true # 启用代码折叠功能，默认：true
    max_lines: 20 # 超过此行数时折叠，默认：20
    show_lines: 10 # 折叠时显示的行数，默认：10

  # --- 高级设置 ---
  exclude_languages: ["mermaid"] # 排除不需要 Shiki 高亮的语言
  language_aliases: { "sh": "bash" }
  enable_transformers: true
```

### 主题

默认主题：`catppuccin-latte`（浅色）和 `catppuccin-mocha`（深色）。

你也可以为不同模式定义多个主题，例如：

```yaml
shiki:
  themes:
    light: "catppuccin-latte"
    dark: "catppuccin-mocha"
    tokyo: "tokyo-night"
```

插件可能会生成如下 span：

```html
<span style="color:#1E66F5;--shiki-dark:#89B4FA;--shiki-tokyo:#7AA2F7"
  >name</span
>
```

当页面根元素具有以下任一属性或类时，插件会自动切换到深色主题：

- `data-theme="dark"` 或 `data-theme="night"`
- `class="dark"` 或 `class="night"`

若使用其它主题切换方式，请自行添加相应逻辑。

主题与语言列表参见 [Shiki Themes](https://shiki.style/themes) 与 [Shiki Languages](https://shiki.style/languages)。

### 使用自定义 CSS

你可以提供自定义 CSS 覆盖默认样式：

```yaml
shiki:
  custom_css: "css/shiki-custom.css" # 相对于 `themes/<your_theme>/source`
```

## 开发

开发时可以克隆仓库并本地链接：

```shell
git clone https://github.com/Efterklang/hexo-shiki-highlight.git ~/Projects/hexo-dev/hexo-shiki-highlight
cd path_to_your_hexo_blog
bun i ~/Projects/hexo-dev/hexo-shiki-highlight
hexo clean
hexo s
```

## 鸣谢

- [nova1751/hexo-shiki-plugin](https://github.com/nova1751/hexo-shiki-plugin)
- [HPCesia/hexo-highlighter-shiki](https://github.com/HPCesia/hexo-highlighter-shiki)
- [gxt-kt/hexo-plugin-shiki](https://github.com/gxt-kt/hexo-plugin-shiki)
