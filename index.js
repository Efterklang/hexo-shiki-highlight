const { createHighlighter, bundledLanguages, bundledThemes } = require("shiki");
const {
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
} = require("@shikijs/transformers");
const fs = require('hexo-fs');
const path = require('path');

// Constants
const ASSET_PATHS = {
  css: 'css/code_block/shiki.css',
  js: 'js/code_block/shiki.js'
};

const CODE_BLOCK_REGEX = /(?<quote>[> ]*)(?<ul>(-|\d+\.)?)(?<start>\s*)(?<tick>~{3,}|`{3,}) *(?<lang>\S+)? *(?<title>.*?)\n(?<code>[\s\S]*?)\k<quote>\s*\k<tick>(?<end>\s*)$/gm;

// Supported transformers
const supported_transformers = {
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
};

// Utility functions
function stripIndent(code, indentLength) {
  if (indentLength <= 0) return code;

  return code.split('\n')
    .map(line => {
      const lineIndentMatch = line.match(/^[ \t]+/);
      const lineIndentLength = lineIndentMatch ? lineIndentMatch[0].length : 0;
      const stripLength = Math.min(indentLength, lineIndentLength);
      return stripLength > 0 ? line.slice(stripLength) : line;
    })
    .join('\n');
}

function getIndentLength(text) {
  const lines = text.split('\n');
  const firstNonEmptyLine = lines.find(line => line.trim() !== '');
  const indentMatch = firstNonEmptyLine?.match(/^[ \t]*/);
  return indentMatch ? indentMatch[0].length : 0;
}

function escapeHTML(text) {
  return require('hexo-util').escapeHTML(text);
}

// Initialize highlighter
async function initializeHighlighter() {
  try {
    return await createHighlighter({
      themes: Object.keys(bundledThemes),
      langs: Object.keys(bundledLanguages),
    });
  } catch (err) {
    console.error("Failed to initialize Shiki highlighter:", err);
    return null;
  }
}

// Configuration setup
function setupConfiguration() {
  const config = hexo.config.shiki;
  if (!config) return null;

  const language_aliases = new Map(Object.entries(config.language_aliases || {}));

  const settings = {

    light_theme: config.light_theme || "catppuccin-latte",
    dark_theme: config.night_theme || "catppuccin-mocha",
    line_number: config.line_number,
    exclude_languages: config.exclude_languages || [],
    language_aliases,
    transformers: config.transformers || [],
    features: {
      highlight_wrap_toggle: config.highlight_wrap_toggle,
      highlight_lang: config.highlight_lang,
      highlight_title: config.highlight_title,
      highlight_copy: config.highlight_copy,
      highlight_raw: config.highlight_raw,
      is_highlight_shrink: config.is_highlight_shrink,
      highlight_height_limit: config.highlight_height_limit,
    },
    copy: {
      success: config.copy?.success || 'Copied!',
      error: config.copy?.error || 'Copy failed!'
    },
    dark_mode_class: config.dark_mode_class || 'night',
  };
  return settings;
}

// Process transformers
function processTransformers(transformerConfigs) {
  return transformerConfigs
    .map((transformer) => {
      if (typeof transformer === "string") {
        let tfm = supported_transformers[transformer];
        if (!tfm) return null;
        return tfm();
      }
      let tfm = supported_transformers[transformer["name"]];
      if (!tfm) return null;
      let option = transformer["option"];
      if (!option) return tfm();
      return tfm(option);
    })
    .filter((tfm) => tfm !== null);
}

// Configuration injection
function injectConfiguration(settings) {
  const configScript = `
    <script>
    const CODE_CONFIG = {
      highlightWrapToggle: ${settings.features.highlight_wrap_toggle},
      highlightLang: ${settings.features.highlight_lang},
      highlightTitle: ${settings.features.highlight_title},
      highlightCopy: ${settings.features.highlight_copy},
      highlightRaw: ${settings.features.highlight_raw},
      isHighlightShrink: ${settings.features.is_highlight_shrink},
      highlightHeightLimit: ${settings.features.highlight_height_limit},
      copy: {
        success: '${settings.copy.success}',
        error: '${settings.copy.error}',
      }
    };
    console.log("hexo shiki highlight loaded");
    </script>
  `;

  hexo.extend.injector.register("body_end", () => configScript);
}

// Height limit CSS injection
function injectHeightLimitCSS(heightLimit) {
  if (!heightLimit) return;

  const heightLimitCSS = `
    <style>
    .code-expand-btn:not(.expand-done) ~ div.codeblock,
    .code-expand-btn:not(.expand-done) ~ * div.codeblock {
      overflow: hidden;
      height: ${heightLimit}px;
    }
    </style>
  `;

  hexo.extend.injector.register("head_end", () => heightLimitCSS);
}

// Code processing
function processCodeBlock(code, lang, title, settings, highlighter, transformers, options = {}) {
  // Handle excluded languages - return original code without any processing
  if (settings.exclude_languages.includes(lang)) {
    return code;
  }

  // Process with Shiki
  try {
    const normalizedLang = lang?.toLowerCase() || '';
    const realLang = settings.language_aliases.get(normalizedLang) || normalizedLang;

    // Check if the language is supported
    if (realLang && !bundledLanguages[realLang]) {
      console.warn(`Shiki does not support language: ${realLang}, falling back to plain text.`);
      return buildSimpleCodeBlock(code, lang);
    }

    // Create transformer for marked lines
    const transformerMarkedLine = () => {
      return {
        line(node, line) {
          if (options.mark && options.mark.includes(line)) {
            this.addClassToHast(node, "marked");
          }
        },
      };
    };

    let highlightedCode = highlighter.codeToHtml(code, {
      lang: realLang || 'text',
      themes: {
        light: settings.light_theme,
        night: settings.dark_theme,
      },
      transformers: [transformerMarkedLine()].concat(transformers),
    });

    // Remove inline styles from pre tag
    highlightedCode = highlightedCode.replace(/<pre[^>]*>/, (match) => {
      return match.replace(/\s*style\s*=\s*"[^"]*"\s*tabindex="0"/, "");
    });

    return buildCodeBlock(highlightedCode, code, lang, title, settings);
  } catch (error) {
    console.warn('Shiki highlighting failed:', error);
    return buildSimpleCodeBlock(code, lang);
  }
}

function buildSimpleCodeBlock(code, lang) {
  return `<div class='codeblock'><div class="code"><pre><code class="${lang || ''}">${escapeHTML(code)}</code></pre></div>`;
}

function buildCodeBlock(highlightedCode, originalCode, lang, title, settings) {
  const lines = originalCode.split('\n');
  const lineNumbers = lines.map((_, i) => `<span class="line">${i + 1}</span><br>`).join('');
  const gutterStyle = settings.line_number ? '' : 'display: none;';

  return `<figure class="shiki${lang ? ` ${lang}` : ""}" data_title="${title || ""}">
    <div class='codeblock'>
      <div class="gutter" style="${gutterStyle}"><pre>${lineNumbers}</pre></div>
      <div class="code">${highlightedCode}</div>
    </div>
  </figure>`;
}

// Main execution
const settings = setupConfiguration();
if (settings) {
  const transformers = processTransformers(settings.transformers);

  initializeHighlighter().then((highlighter) => {
    if (!highlighter) return;

    // --- Asset and CSS Generation ---
    hexo.extend.generator.register('shiki_assets', () => {
      // Correctly join paths from the plugin directory
      const shikiCssPath = path.join(__dirname, 'code_block/shiki.css');
      const colorCssPath = path.join(__dirname, 'code_block/color.css');

      const shikiCss = fs.readFileSync(shikiCssPath);
      let colorCss = fs.readFileSync(colorCssPath);

      // Replace placeholder with a modern, valid, and grouped CSS selector
      if (settings.dark_mode_class) {
        const className = settings.dark_mode_class;
        // Use the :is() pseudo-class for a clean and correct selector group
        const switcherSelector = `:is(html.${className}, html[data-theme="${className}"])`;
        // Use a global regex to replace all occurrences of the placeholder
        colorCss = colorCss.replace(/\.theme-switcher-class/g, switcherSelector);
      }

      const finalCss = shikiCss + '\n' + colorCss;

      return [
        {
          path: ASSET_PATHS.css,
          data: () => finalCss
        },
        {
          path: ASSET_PATHS.js,
          data: () => fs.createReadStream(path.join(__dirname, 'code_block/shiki.js'))
        }
      ];
    });

    // --- Injectors ---
    hexo.extend.injector.register('head_end', () => `<link rel="stylesheet" href="${hexo.config.root}${ASSET_PATHS.css}">`);
    hexo.extend.injector.register('body_end', () => `<script src="${hexo.config.root}${ASSET_PATHS.js}"></script>`);

    injectConfiguration(settings);
    injectHeightLimitCSS(settings.features.highlight_height_limit);

    // --- Filter Registration ---
    hexo.extend.filter.register("before_post_render", (post) => {
      post.content = post.content.replace(CODE_BLOCK_REGEX, (...args) => {
        const groups = args.pop();
        let { quote, ul, start, end, lang, title, code } = groups;

        const indentLength = getIndentLength(args[0]);
        const match = new RegExp(`^${quote.trimEnd()}`, "gm");
        code = code.replace(match, "");
        code = stripIndent(code, indentLength);

        lang = lang || "";
        title = title?.trim() || "";

        const result = processCodeBlock(code, lang, title, settings, highlighter, transformers);
        return `${quote + ul + start}<hexoPostRenderCodeBlock>${result}</hexoPostRenderCodeBlock>${end}`;
      });
    });
  });
}
