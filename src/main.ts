"use strict";
import { bundledLanguages, createHighlighter } from "shiki";
import type Hexo from "hexo";
import { HighlightOptions } from "hexo/dist/extend/syntax_highlight";
import { escapeHTML } from "hexo-util";
import { readFileSync, createReadStream, writeFileSync, appendFile } from "fs";
import { processConfig, REGISTERED_TRANSFORMERS } from "./config";
import { join } from "path";
import { transformerStyleToClass } from "@shikijs/transformers";

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
    rightButtons += '<iconify-icon icon="fa6-solid:arrow-down-wide-short" class="toggle-wrap" title="Toggle Wrap"></iconify-icon>';
  }
  if (displayItems.copyButton) {
    rightButtons += '<div class="copy-notice"></div><iconify-icon icon="fa6-solid:paste" class="copy-button"></iconify-icon>';
  }
  if (displayItems.shrinkButton !== undefined) {
    const closedClass = displayItems.shrinkButton === false ? ' closed' : '';
    rightButtons += `<iconify-icon icon="fa6-solid:angle-down" class="expand${closedClass}"></iconify-icon>`;
  }

  const rightSection = `<div class="right">${rightButtons}</div>`;

  const closedClass = displayItems.shrinkButton === false ? ' closed' : '';
  return `<div class="shiki-tools${closedClass}">${leftSection}${centerSection}${rightSection}</div>`;
};


export async function init(hexo: Hexo): Promise<void> {
  const {
    themes, excludes, aliases, enableTransformers, styleToClass, toolbarItems,
    customCSS, collapseConfig
  } = processConfig(hexo);

  const highlighter = await createHighlighter({
    themes: Object.values(themes),
    langAlias: Object.fromEntries(aliases),
    langs: Object.keys(bundledLanguages),
  });

  (global as any).hexo = hexo;

  if (customCSS) {
    hexo.extend.injector.register("head_end", () => {
      return `<link rel="stylesheet" href="${hexo.config.root}${customCSS}">`;
    });
  } else {
    hexo.extend.generator.register("shiki_custom_css", () => {
      return {
        path: "css/code_block/shiki.css",
        data: () => readFileSync(join(__dirname, "../code_block/shiki.css"), "utf-8"),
      }
    });
    hexo.extend.injector.register("head_end", () => `<link rel="stylesheet" href="${hexo.config.root}css/code_block/shiki.css">`);
  }

  hexo.extend.generator.register("shiki_assets", () => {
    return {
      path: "js/code_block/shiki.js",
      data: () => createReadStream(join(__dirname, "../code_block/shiki.js")),
    };
  });
  hexo.extend.injector.register("body_end", () => `<script defer src="${hexo.config.root}js/code_block/shiki.js"></script>`);

  const toClass = transformerStyleToClass({ classPrefix: styleToClass.classPrefix });
  const hexo_highlighter = (code: string, options: HighlightOptions) => {
    if (excludes.includes(options.lang || "")) {
      return `<pre><code class="${options.lang}">${escapeHTML(code)}</code></pre>`;
    }
    let transformers = enableTransformers ? REGISTERED_TRANSFORMERS : [];
    if (styleToClass.enable) {
      transformers = [...transformers, toClass];
    }
    let code_html = highlighter.codeToHtml(code, {
      lang: options.lang || "",
      themes: themes,
      transformers: transformers
    });

    if (styleToClass.enable) {
      const cssContent = toClass.getCSS();
      try {
        writeFileSync(join(process.env.HOME || process.env.USERPROFILE || ".", "Downloads/shiki_style_to_class.css"), cssContent, "utf-8");
      } catch (e) {
        console.log("Ignore error: failed to write shiki_style_to_class.css");
      }
    }

    // rm inline-styles added by shiki
    code_html = code_html.replace(/<pre[^>]*>/, (match: string) =>
      match.replace(/\s*style\s*=\s*"[^"]*"\s*tabindex="0"/, "")
    );
    let shikiToolsHtml = createShikiTools(options.lang || "", options.caption || "", toolbarItems);

    let finalHighlightedHtml = code_html;
    let expandButton = '';
    let collapseAttributes = '';

    if (collapseConfig.enable !== false) {
      const codeLines = code_html.match(/<span class="line/g)?.length || 0;

      if (codeLines > collapseConfig.maxLines) {
        expandButton = `<div class="code-expand-btn"><iconify-icon icon="garden:chevron-double-down-fill-16"></iconify-icon></div>`;
        collapseAttributes = ` data-collapsible="true" data-max-lines="${collapseConfig.maxLines}" data-show-lines="${collapseConfig.showLines}" data-total-lines="${codeLines}"`;
      }
    }

    return `<figure class="shiki${options.lang ? ` ${options.lang}` : ""}" data_title="${options.caption || ""}"${collapseAttributes}> ${shikiToolsHtml} ${finalHighlightedHtml}${expandButton} </figure>`;
  };

  hexo.extend.highlight.register("shiki", hexo_highlighter);
}
