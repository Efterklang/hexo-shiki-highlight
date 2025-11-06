"use strict";
import { bundledLanguages, createHighlighter, ShikiTransformer } from "shiki";
import type Hexo from "hexo";
import { HighlightOptions } from "hexo/dist/extend/syntax_highlight";
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
import { transformerColorizedBrackets } from '@shikijs/colorized-brackets'

interface Config {
  light_theme?: string;
  night_theme?: string;
  exclude_languages?: string[];
  language_aliases?: Record<string, string>;
  enable_transformers?: boolean;
  code_collapse?: {
    enable?: boolean;
    max_lines?: number;
    show_lines?: number;
  };
  toolbar_items?: {
    lang?: boolean;
    title?: boolean;
    wrapToggle?: boolean;
    copyButton?: boolean;
    shrinkButton?: boolean;
  };
  copy?: { success?: string; error?: string };
}

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
  transformerColorizedBrackets(),
];

function createShikiTools(lang: string, title: string, displayItems: any): string {
  const leftSection = `<div class="left">
    <div class="traffic-lights">
      <span class="traffic-light red"></span>
      <span class="traffic-light yellow"></span>
      <span class="traffic-light green"></span>
    </div>
    ${displayItems.lang ? `<div class="code-lang">${lang.toUpperCase()}</div>` : ''}
  </div>`;

  const centerSection = `<div class="center">
    ${displayItems.title && title ? `<div class="code-title">${title}</div>` : ''}
  </div>`;

  let rightButtons = '';
  if (displayItems.wrapToggle) {
    rightButtons += '<i class="fa-solid fa-arrow-down-wide-short" title="Toggle Wrap"></i>';
  }
  if (displayItems.copyButton) {
    rightButtons += '<div class="copy-notice"></div><i class="fas fa-paste copy-button"></i>';
  }
  if (displayItems.shrinkButton !== undefined) {
    const closedClass = displayItems.shrinkButton === false ? ' closed' : '';
    rightButtons += `<i class="fas fa-angle-down expand${closedClass}"></i>`;
  }

  const rightSection = `<div class="right">${rightButtons}</div>`;

  const closedClass = displayItems.shrinkButton === false ? ' closed' : '';
  return `<div class="shiki-tools${closedClass}">${leftSection}${centerSection}${rightSection}</div>`;
};


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
    langAlias: Object.fromEntries(aliases),
    langs: Object.keys(bundledLanguages),
  });

  const toolbarItems = {
    lang: config.toolbar_items?.lang ?? true,
    title: config.toolbar_items?.title ?? true,
    wrapToggle: config.toolbar_items?.wrapToggle ?? true,
    copyButton: config.toolbar_items?.copyButton ?? true,
    shrinkButton: config.toolbar_items?.shrinkButton ?? true,
  };

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

  const hexo_highlighter = (code: string, options: HighlightOptions) => {
    if (excludes.includes(options.lang || "")) {
      return `<pre><code class="${options.lang}">${escapeHTML(code)}</code></pre>`;
    }
    let code_html = highlighter.codeToHtml(code, {
      lang: options.lang || "",
      themes: { light: lightTheme, dark: darkTheme },
      transformers: enableTransformers ? SUPPORTED_TRANSFORMERS : []
    });
    // rm inline-styles added by shiki
    code_html = code_html.replace(/<pre[^>]*>/, (match: string) =>
      match.replace(/\s*style\s*=\s*"[^"]*"\s*tabindex="0"/, "")
    );
    let shikiToolsHtml = createShikiTools(options.lang || "", options.caption || "", toolbarItems);

    const collapseConfig = config.code_collapse || {};
    const enableCollapse = collapseConfig.enable !== false;
    const maxLines = collapseConfig.max_lines || 20;
    const showLines = collapseConfig.show_lines || 10;

    let finalHighlightedHtml = code_html;
    let expandButton = '';
    let collapseAttributes = '';

    if (enableCollapse) {
      // codeLines = span.line 的数量
      const codeLines = code_html.match(/<span class="line/g)?.length || 0;

      if (codeLines > maxLines) {
        // 添加展开按钮和相关属性
        expandButton = `<div class="code-expand-btn"><i class="fas fa-angle-double-down"></i></div>`;
        collapseAttributes = ` data-collapsible="true" data-max-lines="${maxLines}" data-show-lines="${showLines}" data-total-lines="${codeLines}"`;
      }
    }

    return `<figure class="shiki${options.lang ? ` ${options.lang}` : ""}" data_title="${options.caption || ""}"${collapseAttributes}> ${shikiToolsHtml} ${finalHighlightedHtml}${expandButton} </figure>`;
  };

  hexo.extend.highlight.register("shiki", hexo_highlighter);
}
