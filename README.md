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
  code_collapse:
    enable: true # Enable code collapse feature. Default: true
    max_lines: 20 # Max lines before collapsing. Default: 20
    show_lines: 10 # Lines to show when collapsed. Default: 10

  exclude_languages: ["mermaid"] # Languages excluded from Shiki highlighting
  enable_transformers: true
```

### toolbar_items

You can configure which items to show in the code block toolbar:

```yaml
shiki:
  toolbar_items:
    lang: true
    title: true
    wrapToggle: true
    copyButton: true
    shrinkButton: true # toggle code collapse/expand
```

### language_aliases

This option allows you to define aliases for language names.

For example, to map `conf` to `nginx` and `gitconfig` to `ini`, you can use:

```yaml
shiki:
  language_aliases:
    conf: nginx
    gitconfig: ini
```

After this configuration, code blocks marked with `conf` or `gitconfig` will be highlighted using the `nginx` and `ini` syntax rules, respectively.

### style_to_class transformer

You can enable `style_to_class` to convert Shiki's inline styles into CSS classes. Example configuration:

```yaml
shiki:
  style_to_class:
    enable: true
    class_prefix: _sk_
```

What this does:

- When enabled, inline `style` attributes produced by Shiki are transformed into unique class names.
- The class names are generated from a hash of the style object; use `class_prefix` to set a custom prefix for those class names.
- A CSS file containing these generated class rules will be written to the `~/Download` directory.
- You must add a link to the generated CSS in your blog (for example in your theme's head) to apply the styles.

Here is an example of the difference in output

```css
/* without style_to_class */
<span
  style="
    color: #d20f39;
    --shiki-light-font-style: italic;
    --shiki-dark: #f38ba8;
    --shiki-dark-font-style: italic;
    --shiki-tokyo: #c0caf5;
    --shiki-tokyo-font-style: italic;
  "
>
  Italic
</span>

/* with style_to_class */
<span class="_sk_1a2b3c">Italic</span>
```

This feature can help reduce HTML size, improve caching, and make it easier to customize styles via CSS.

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
