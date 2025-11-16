<!-- Language switch: English / 中文 -->
<p align="center">
  <a href="README.md">English</a> · <a href="README-cn.md">中文</a>
</p>

## Preview

Dark & Light Theme

| ![light](assets/README/light.png) | ![dark](assets/README/dark.png) |
| --------------------------------- | ------------------------------- |

Transformers Preview

![transformer](assets/README/transformer.png)

For a live preview, see my [blog](https://vluv.space/shiki_highlight/).

## Install

```bash
bun i hexo-shiki-highlight
```

Add the following to your Hexo `_config.yml`:

```yaml
syntax_highlighter: shiki
```

If you want to customize the highlighter, add a `shiki` section to `_config.yml`:

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
    shrinkButton: true # toggle code collapse/expand

  code_collapse:
    enable: true # Enable code collapse feature. Default: true
    max_lines: 20 # Max lines before collapsing. Default: 20
    show_lines: 10 # Lines to show when collapsed. Default: 10

  # --- Advanced Settings ---
  exclude_languages: ["mermaid"] # Languages excluded from Shiki highlighting
  language_aliases: { "sh": "bash" }
  enable_transformers: true
```

### Themes

Default themes: `catppuccin-latte` (light) and `catppuccin-mocha` (dark).
You can define multiple themes for different modes, e.g.:

```yaml
shiki:
  themes:
    light: "catppuccin-latte"
    dark: "catppuccin-mocha"
    tokyo: "tokyo-night"
```

The plugin may emit spans like:

```html
<span style="color:#1E66F5;--shiki-dark:#89B4FA;--shiki-tokyo:#7AA2F7"
  >name</span
>
```

This plugin automatically switches to the dark theme when the page root has either:

- `data-theme="dark"` or `data-theme="night"`
- `class="dark"` or `class="night"`

For other theme-switching strategies, add your own logic.

Supported themes and languages are listed at [Shiki Themes](https://shiki.style/themes) and [Shiki Languages](https://shiki.style/languages).

### Use your own CSS

You can provide a custom CSS file to replace the default styles:

```yaml
shiki:
  custom_css: "css/shiki-custom.css" # relative to `themes/<your_theme>/source`
```

## Dev

For development, clone the repo and link it locally:

```shell
git clone https://github.com/Efterklang/hexo-shiki-highlight.git ~/Projects/hexo-dev/hexo-shiki-highlight
cd path_to_your_hexo_blog
bun i ~/Projects/hexo-dev/hexo-shiki-highlight
hexo clean
hexo s
```

## Thanks

- [nova1751/hexo-shiki-plugin](https://github.com/nova1751/hexo-shiki-plugin)
- [HPCesia/hexo-highlighter-shiki](https://github.com/HPCesia/hexo-highlighter-shiki)
- [gxt-kt/hexo-plugin-shiki](https://github.com/gxt-kt/hexo-plugin-shiki)
