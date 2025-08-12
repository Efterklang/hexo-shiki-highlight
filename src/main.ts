"use strict";
import { bundledLanguages, createHighlighter, ShikiTransformer } from "shiki";
import type Hexo from "hexo";
import { escapeHTML } from "hexo-util";
import { readFileSync, createReadStream } from "fs";
import { join } from "path";
import {
  transformerCompactLineOptions,
  transformerMetaHighlight,
  transformerMetaWordHighlight,
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
  transformerRemoveLineBreak,
  transformerRemoveNotationEscape,
  transformerRenderWhitespace,
} from "@shikijs/transformers";

interface Config {
  light_theme?: string;
  night_theme?: string;
  exclude_languages?: string[];
  language_aliases?: Record<string, string>;
  enable_transformers?: boolean;
  highlight_wrap_toggle?: boolean;
  highlight_lang?: boolean;
  highlight_title?: boolean;
  highlight_copy?: boolean;
  is_highlight_shrink?: boolean;
  code_collapse?: {
    enable?: boolean;
    max_lines?: number;
    show_lines?: number;
    smart_scroll?: boolean;
  };
  copy?: { success?: string; error?: string };
}

const CODE_REGEX = /(?<quote>[> ]*)(?<ul>(-|\d+\.)?)(?<start>\s*)(?<tick>~{3,}|`{3,}) *(?<lang>\S+)? *(?<title>.*?)\n(?<code>[\s\S]*?)\k<quote>\s*\k<tick>(?<end>\s*)$/gm;

const SUPPORTED_TRANSFORMERS: ShikiTransformer[] = [
  transformerCompactLineOptions(),
  transformerMetaHighlight(),
  transformerMetaWordHighlight(),
  transformerNotationDiff(),
  transformerNotationErrorLevel(),
  transformerNotationFocus(),
  transformerNotationHighlight(),
  transformerNotationWordHighlight(),
  transformerRemoveLineBreak(),
  transformerRemoveNotationEscape(),
  transformerRenderWhitespace(),
];

export async function init(hexo: Hexo): Promise<void> {
  const config = (hexo.config.shiki as Config) || {};

  // 配置默认值
  const lightTheme = config.light_theme || "catppuccin-latte";
  const darkTheme = config.night_theme || "catppuccin-mocha";
  const excludes = config.exclude_languages || [];
  const aliases = new Map(Object.entries(config.language_aliases || {}));
  const enableTransformers = config.enable_transformers ?? true;

  const highlighter = await createHighlighter({
    themes: [lightTheme, darkTheme],
    langs: Object.keys(bundledLanguages),
  });

  // 设置全局变量
  (global as any).hexo = hexo;

  // 生成静态资源文件
  hexo.extend.generator.register("shiki_assets", () => {
    const shikiCss = readFileSync(join(__dirname, "../code_block/shiki.css"), "utf-8");

    return [
      {
        path: "css/code_block/shiki.css",
        data: () => shikiCss,
      },
      {
        path: "js/code_block/shiki.js",
        data: () => createReadStream(join(__dirname, "../code_block/shiki.js")),
      },
    ];
  });

  // 注入CSS和JS资源链接
  hexo.extend.injector.register("head_end",
    () => `<link rel="stylesheet" href="${hexo.config.root}css/code_block/shiki.css">`);
  hexo.extend.injector.register("body_end",
    () => `<script src="${hexo.config.root}js/code_block/shiki.js"></script>`);

  // 注册markdown处理过滤器 - 主要业务逻辑
  hexo.extend.filter.register("before_post_render", (post: any) => {
    post.content = post.content.replace(CODE_REGEX, (...args: any[]) => {
      const groups = args.pop();
      const { quote, ul, start, end, lang = "", title = "", code } = groups;

      // 处理代码缩进
      const indentMatch = code.match(/^[ \t]*/);
      const indent = indentMatch ? indentMatch[0].length : 0;
      const cleanCode = code
        .split("\n")
        .map((line: string) =>
          line.slice(Math.min(indent, line.match(/^[ \t]*/)?.[0].length || 0))
        )
        .join("\n")
        .replace(new RegExp(`^${quote.trimEnd()}`, "gm"), "");

      // 代码高亮处理 - 内联逻辑
      let highlightedHtml: string;

      // 检查是否为排除的语言
      if (excludes.includes(lang)) {
        highlightedHtml = `<pre><code class="${lang}">${escapeHTML(cleanCode)}</code></pre>`;
      } else {
        // 处理语言别名和大小写规范化
        const normalizedLang = lang?.toLowerCase() || "";
        let actualLang = aliases.get(normalizedLang) || normalizedLang || "text";

        // 验证语言是否被 Shiki 支持，如果不支持则回退到 text
        if (actualLang !== "text" && !Object.keys(bundledLanguages).includes(actualLang)) {
          console.warn(`Language '${actualLang}' not supported by Shiki, falling back to 'text'`);
          actualLang = "text";
        }

        try {
          let html = highlighter.codeToHtml(cleanCode, {
            lang: actualLang,
            themes: { light: lightTheme, dark: darkTheme },
            transformers: enableTransformers ? SUPPORTED_TRANSFORMERS : []
          });

          // 清理内联样式
          highlightedHtml = html.replace(/<pre[^>]*>/, (match: string) =>
            match.replace(/\s*style\s*=\s*"[^"]*"\s*tabindex="0"/, "")
          );
        } catch (error) {
          console.warn(`Highlighting failed for ${lang}:`, error);
          highlightedHtml = `<pre><code class="${lang}">${escapeHTML(cleanCode)}</code></pre>`;
        }
      }

      // 生成 shiki-tools HTML
      const createShikiTools = (lang: string, title: string) => {
        const leftSection = `<div class="left">
          <div class="traffic-lights">
            <span class="traffic-light red"></span>
            <span class="traffic-light yellow"></span>
            <span class="traffic-light green"></span>
          </div>
          ${config.highlight_lang ? `<div class="code-lang">${lang.toUpperCase()}</div>` : ''}
        </div>`;

        const centerSection = `<div class="center">
          ${config.highlight_title && title ? `<div class="code-title">${title}</div>` : ''}
        </div>`;

        let rightButtons = '';
        if (config.highlight_wrap_toggle) {
          rightButtons += '<i class="fa-solid fa-arrow-down-wide-short" title="Toggle Wrap"></i>';
        }
        if (config.highlight_copy) {
          rightButtons += '<div class="copy-notice"></div><i class="fas fa-paste copy-button"></i>';
        }
        if (config.is_highlight_shrink !== undefined) {
          const closedClass = config.is_highlight_shrink === false ? ' closed' : '';
          rightButtons += `<i class="fas fa-angle-down expand${closedClass}"></i>`;
        }

        const rightSection = `<div class="right">${rightButtons}</div>`;

        const closedClass = config.is_highlight_shrink === false ? ' closed' : '';
        return `<div class="shiki-tools${closedClass}">${leftSection}${centerSection}${rightSection}</div>`;
      };

      // 构建完整代码块
      const shikiToolsHtml = createShikiTools(lang, title);

      // 检查是否需要折叠代码
      const collapseConfig = config.code_collapse || {};
      const enableCollapse = collapseConfig.enable !== false;
      const maxLines = collapseConfig.max_lines || 50;
      const showLines = collapseConfig.show_lines || 10;
      const smartScroll = collapseConfig.smart_scroll !== false; // 默认启用智能滚动

      let finalHighlightedHtml = highlightedHtml;
      let expandButton = '';
      let collapseAttributes = '';

      if (enableCollapse) {
        // codeLines = span.line 的数量
        const codeLines = highlightedHtml.match(/<span class="line/g)?.length || 0;

        // console.log(`Detected ${codeLines} lines of code.`);

        if (codeLines > maxLines) {
          // 添加展开按钮和相关属性
          expandButton = `<div class="code-expand-btn"><i class="fas fa-angle-double-down"></i></div>`;
          collapseAttributes = ` data-collapsible="true" data-max-lines="${maxLines}" data-show-lines="${showLines}" data-total-lines="${codeLines}" data-smart-scroll="${smartScroll}"`;
        }
      }

      const finalCodeBlock = `<figure class="shiki${lang ? ` ${lang}` : ""}" data_title="${title || ""}"${collapseAttributes}>
    ${shikiToolsHtml}
    ${finalHighlightedHtml}${expandButton}
  </figure>`;      return `${quote + ul + start}<hexoPostRenderCodeBlock>${finalCodeBlock}</hexoPostRenderCodeBlock>${end}`;
    });
  });
}
