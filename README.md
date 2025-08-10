# Intro

个人博客[vluv's space](https://vluv.space/)使用的代码高亮插件，基于 [Shiki](https://shiki.style/) 实现。

| ![image](https://github.com/user-attachments/assets/bc88dd30-e9f6-41d7-885c-b1c2a47cb45d) | ![image](https://github.com/user-attachments/assets/48a35dce-1304-4059-8ef1-6a929056e837) |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |

Live Demo: https://vluv.space.Shiki_Demo/

## Install

```bash
# 使用 Bun (推荐)
bun i hexo-shiki-highlight
```

## Usage

Add the following configuration to your Hexo `_config.yml`:

```yaml
shiki:
  light_theme: 'catppuccin-latte' # Shiki theme for light mode.
  dark_theme: 'catppuccin-mocha'  # Shiki theme for dark mode.

  # --- Display Settings ---
  line_number: true # Show line numbers. Default is true.
  highlight_wrap_toggle: true # Show wrap toggle button. Default is true.
  highlight_lang: true # Show language name. Default is true.
  highlight_title: true # Show code block title (if any). Default is true.
  highlight_copy: true # Show copy button. Default is true.

  # --- Code Block Dimensions ---
  is_highlight_shrink: false # Shrink code block by default. Default is false.

  # --- Advanced Settings ---
  exclude_languages: [] # Languages to exclude from Shiki highlighting.
  language_aliases: {} # Language aliases. e.g., { "vue": "html" }
  enable_transformers: false # default true
```

Supported themes & language can be found at [Shiki Themes](https://shiki.style/themes) & [Shiki Languages](https://shiki.style/languages).

## Refs

- [github.com/nova1751/hexo-shiki-plugin](https://github.com/nova1751/hexo-shiki-plugin)
- [github.com/HPCesia/hexo-highlighter-shiki](https://github.com/HPCesia/hexo-highlighter-shiki)
- [github.com/gxt-kt/hexo-plugin-shiki](https://github.com/gxt-kt/hexo-plugin-shiki)
