# Intro

个人博客[vluv's space](https://vluv.space/)使用的代码高亮插件，基于 [Shiki](https://shiki.style/) 实现。[^1]

[^1]: For live demo, see [vluv.space/Shiki_Demo](https://vluv.space/Shiki_Demo/); For changelog see, [CHANGELOG.md](./CHANGELOG.md)


| <img width="1386" height="720" alt="image" src="https://github.com/user-attachments/assets/a7e7bc23-3d24-4f65-b9fc-1d7452fcf200" /> | <img width="1394" height="736" alt="image" src="https://github.com/user-attachments/assets/677ca7d3-2b76-4cb6-8392-2de07b2b4406" /> |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |

<img width="2922" height="1854" alt="image" src="https://github.com/user-attachments/assets/06604568-d87e-4549-8c9e-339bc8b6d753" />

## Install

```bash
bun i hexo-shiki-highlight
```

Add the following configuration to your Hexo `_config.yml`:

```yaml _config.yml
shiki:
  light_theme: 'catppuccin-latte' # Shiki theme for light mode.
  dark_theme: 'catppuccin-mocha'  # Shiki theme for dark mode.

  # --- Display Settings ---
  line_number: true # Show line numbers. Default is true.
  highlight_wrap_toggle: true # Show wrap toggle button. Default is true.
  highlight_lang: true # Show language name. Default is true.
  highlight_title: true # Show code block title (if any). Default is true.l
  highlight_copy: true # Show copy button. Default is true.

  # --- Code Block Dimensions ---
  is_highlight_shrink: false # Shrink code block by default. Default is false.

  # --- Code Collapse Settings ---
  code_collapse:
    enable: true # Enable code collapse feature. Default is true.
    max_lines: 50 # Maximum lines to show before collapsing. Default is 50.
    show_lines: 10 # Number of lines to show when collapsed. Default is 10.
    smart_scroll: true # Enable smart scroll adjustment when collapsing. Default is true.

  # --- Advanced Settings ---
  exclude_languages: [] # Languages to exclude from Shiki highlighting.
  language_aliases: {} # Language aliases. e.g., { "vue": "html" }
  enable_transformers: false # default true
```

Supported themes & language can be found at [Shiki Themes](https://shiki.style/themes) & [Shiki Languages](https://shiki.style/languages).

## Dev

```shell
$ git clone https://github.com/Efterklang/hexo-shiki-highlight.git ~/Projects/hexo-dev/hexo-shiki-highlight
$ cd blog
$ bun i ~/Projects/hexo-dev/hexo-shiki-highlight
$ hexo s
```
## Refs

- [github.com/nova1751/hexo-shiki-plugin](https://github.com/nova1751/hexo-shiki-plugin)
- [github.com/HPCesia/hexo-highlighter-shiki](https://github.com/HPCesia/hexo-highlighter-shiki)
- [github.com/gxt-kt/hexo-plugin-shiki](https://github.com/gxt-kt/hexo-plugin-shiki)
