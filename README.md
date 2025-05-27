## Intro

个人博客[vluv's space](https://vluv.space/)使用的代码高亮插件，基于 [Shiki](https://shiki.style/) 实现。

![Preview](assets/README/1748359303158.png)

## Install

`bun i hexo-shiki-highlight --save`

## Usage

Add the following configuration to your Hexo `_config.yml`:

```yaml
shiki:
  theme: 'catppuccin-mocha' # Default theme. See https://shiki.style/themes for all available themes.
  line_number: true # Show line numbers. Default is true.
  exclude_languages: [] # Languages to exclude from Shiki highlighting.
  language_aliases: {} # Language aliases. e.g., { "vue": "html" }
  highlight_linenumber_toggle: true # Show line number toggle button. Default is true.
  highlight_wrap_toggle: true # Show wrap toggle button. Default is true.
  highlight_lang: true # Show language name. Default is true.
  highlight_title: true # Show code block title (if any). Default is true.
  highlight_copy: true # Show copy button. Default is true.
  highlight_raw: true # Show raw code button. Default is true.
  is_highlight_shrink: false # Shrink code block by default. Default is false.
  highlight_height_limit: 0 # Code block height limit in px. 0 means no limit. Default is 0.
  copy:
    success: 'Copied!' # Message on successful copy.
    error: 'Copy failed!' # Message on failed copy.
```

## Refs

- [github.com/nova1751/hexo-shiki-plugin](https://github.com/nova1751/hexo-shiki-plugin)
- [github.com/HPCesia/hexo-highlighter-shiki](https://github.com/HPCesia/hexo-highlighter-shiki)
- [github.com/gxt-kt/hexo-plugin-shiki](https://github.com/gxt-kt/hexo-plugin-shiki)
