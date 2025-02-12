const { createHighlighter, bundledLanguages, bundledThemes } = require("shiki");

// load all languages and themes
async function initializeHighlighter() {
  try {
    const hl = await createHighlighter({
      themes: Object.keys(bundledThemes),
      langs: Object.keys(bundledLanguages),
    });
    return hl;
  } catch (err) {
    console.error("Failed to initialize Shiki highlighter:", err);
    return null;
  }
}

// read config
const config = hexo.config.shiki;
if (!config) return;

// read language_aliases
const language_aliases = new Map(Object.entries(config.language_aliases || {}));

const {
  theme,
  line_number,
  highlight_linenumber_toggle,
  highlight_wrap_toggle,
  highlight_lang,
  highlight_title,
  highlight_copy,
  highlight_raw,
  highlight_fullpage,
  highlight_height_limit,
  is_highlight_shrink,
  copy: { success, error } = {},
  exclude_languages: []
} = config;


const css = hexo.extend.helper.get("css").bind(hexo);
const js = hexo.extend.helper.get("js").bind(hexo);

hexo.extend.injector.register('head_end', () => { return css("https://cdn.jsdelivr.net/gh/Efterklang/hexo-shiki-highlight@main/code_block/code_block.css") });
hexo.extend.injector.register('body_end', () => { return js("https://cdn.jsdelivr.net/gh/Efterklang/hexo-shiki-highlight@main/code_block/code_block.js") });

if (config.highlight_height_limit) {
  hexo.extend.injector.register("head_end", () => {
    return `
    <style>
    .code-expand-btn:not(.expand-done) ~ div.codeblock,
    .code-expand-btn:not(.expand-done) ~ * div.codeblock {
      overflow: hidden;
      height: ${config.highlight_height_limit}px;
    }
    </style>
  `;
  });
}


hexo.extend.injector.register("body_end", () => {
  return `
  <script>
  const CODE_CONFIG = {
    highlightLineNumberToggle: ${highlight_linenumber_toggle},
    highlightWrapToggle: ${highlight_wrap_toggle},
    highlightLang: ${highlight_lang},
    highlightTitle: ${highlight_title},
    highlightCopy: ${highlight_copy},
    highlightRaw: ${highlight_raw},
    highlightFullPage: ${highlight_fullpage},
    isHighlightShrink: ${is_highlight_shrink},
    highlightHeightLimit: ${highlight_height_limit},
    copy: {
      success: '${success}',
      error: '${error}',
    }
  };
  console.log("hexo shiki highlight loaded");
  </script>
  `;
});

initializeHighlighter().then((hl) => {
  if (!hl) return;

  // 获取当前主题
  const currentTheme = theme || "catppuccin-mocha"; // 默认主题
  const themeInfo = hl.getTheme(currentTheme);
  console.log(themeInfo.type);

  // 将主题的所有变量注入到 CSS 的 :root 中
  hexo.extend.injector.register("head_end", () => {
    return `
      <style>
        :root {
          /* 基本颜色 */
          --hl-bg: ${themeInfo.bg};
          --hl-color: ${themeInfo.fg};
          --hl-code-type: ${themeInfo.type};

          /* 主题名称 */
          --hl-code-name: ${themeInfo.name};
          --hl-code-display-name: ${themeInfo.displayName || "none"};

          /* 颜色替换 */
          ${themeInfo.colorReplacements
        ? Object.entries(themeInfo.colorReplacements)
          .map(
            ([key, value]) =>
              `--hl-code-color-${key.slice(1)}: ${value};`,
          )
          .join("\n")
        : ""
      }

          /* VS Code 颜色映射 */
          ${themeInfo.colors
        ? Object.entries(themeInfo.colors)
          .map(([key, value]) => `--hl-code-colors-${key}: ${value};`)
          .join("\n")
        : ""
      }

          /* 其他未使用的字段 */
          --hl-code-schema: ${themeInfo.$schema || "none"};
          --hl-code-semantic-highlighting: ${themeInfo.semanticHighlighting || "false"};
        }
      </style>
    `;
  });

  hexo.extend.filter.register("before_post_render", (post) => {
    const codeMatch =
      /(?<quote>[> ]*)(?<ul>(-|\d+\.)?)(?<start>\s*)(?<tick>~{3,}|`{3,}) *(?<lang>\S+)? *(?<title>.*?)\n(?<code>[\s\S]*?)\k<quote>\s*\k<tick>(?<end>\s*)$/gm;
    post.content = post.content.replace(codeMatch, (...argv) => {
      let { quote, ul, start, end, lang, title, code } = argv.pop();
      let result;
      const match = new RegExp(`^${quote.trimEnd()}`, "gm");
      code = code.replace(match, "");
      const arr = code.split("\n");
      let pre = "";

      // 提取第一个 ``` 所在的行，并计算缩进数
      // 提取第一个非空行
      const lines = argv[0].split("\n");
      let firstLine = "";
      for (let line of lines) {
        if (line.trim() !== "") {
          firstLine = line;
          break;
        }
      }
      const codeBlockIndentMatch = firstLine.match(/^[ \t]*/); // 匹配缩进
      const indentLength = codeBlockIndentMatch ? codeBlockIndentMatch[0].length : 0; // 获取缩进的长度
      // code = require('hexo-utjl').stripIndent(code); // 使用 stripIndent 去除缩进
      // console.log("argv",argv[0])
      // console.log("indentLength",indentLength)
      // console.log("code before strip",code)
      // code = require('hexo-util').stripIndent(code, indentLength);
      // 自定义 stripIndent 逻辑：最多去除 indentLength 的缩进
      if (indentLength > 0) {
        const lines = code.split("\n");
        code = lines
          .map((line) => {
            // 匹配每行开头的缩进（空格或制表符）
            const lineIndentMatch = line.match(/^[ \t]+/);
            const lineIndentLength = lineIndentMatch ? lineIndentMatch[0].length : 0;
            // 去除的缩进数取最小值：indentLength 或 lineIndentLength
            const stripLength = Math.min(indentLength, lineIndentLength);
            return stripLength > 0 ? line.slice(stripLength) : line;
          })
          .join("\n");
      }
      // console.log("code after strip",code)

      // enable exclude_languages
      if (config.exclude_languages.includes(lang)) {
        let result = "<div class='codeblock'>";
        result += `<div class="code"><pre><code class="${lang ? `${lang}` : ""}">${require('hexo-util').escapeHTML(code)}</code></pre></div>`;
        return `${quote + ul + start}<hexoPostRenderCodeBlock>${result}</hexoPostRenderCodeBlock>${end}`;
      }

      try {
        lang = lang || ""; // 如果没有语言，设置为空字符串
        title = title.trim(); // 去除标题前后的空格
        // console.log(title);
        // 将语言转换为小写并与用户定义的别名匹配
        const normalizedLang = lang.toLowerCase();
        const real_lang =
          language_aliases.get(normalizedLang) || normalizedLang;

        // 使用 Shiki 高亮代码
        pre = hl.codeToHtml(code, {
          lang: real_lang,
          theme: currentTheme, // 使用当前主题
        });

        // 移除 Shiki 生成的 <pre> 标签中的内联样式
        pre = pre.replace(/<pre[^>]*>/, (match) => {
          return match.replace(/\s*style\s*=\s*"[^"]*"\s*tabindex="0"/, "");
        });
      } catch (error) {
        console.warn(error);
        pre = `<pre><code>${code}</code></pre>`;
      }

      // 构建代码块 HTML
      result = `<figure class="shiki${lang ? ` ${lang}` : ""}" data_title="${title || ""}">`;
      result += "<div class='codeblock'>";
      // 生成 gutter 的逻辑
      {
        let numbers = '';
        for (let i = 0, len = arr.length; i < len; i++) {
          numbers += `<span class="line">${1 + i}</span><br>`;
        }
        // 根据 line_number 的值决定是否添加 disabled 类
        result += `<div class="gutter" style="${line_number ? '' : 'display: none;'}"><pre>${numbers}</pre></div>`;
      }

      result += `<div class="code">${pre}</div>`;
      result += "</div></figure>";

      return `${quote + ul + start
        }<hexoPostRenderCodeBlock>${result}</hexoPostRenderCodeBlock>${end}`;
    });
  });
});
