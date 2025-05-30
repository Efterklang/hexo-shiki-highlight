const { createHighlighter, bundledLanguages, bundledThemes } = require("shiki");
const fs = require('hexo-fs');
const path = require('path');

// Constants
const ASSET_PATHS = {
  css: 'css/code_block/shiki.css',
  js: 'js/code_block/shiki.js'
};

const CODE_BLOCK_REGEX = /(?<quote>[> ]*)(?<ul>(-|\d+\.)?)(?<start>\s*)(?<tick>~{3,}|`{3,}) *(?<lang>\S+)? *(?<title>.*?)\n(?<code>[\s\S]*?)\k<quote>\s*\k<tick>(?<end>\s*)$/gm;

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
    theme: config.theme || "catppuccin-mocha",
    line_number: config.line_number,
    exclude_languages: config.exclude_languages || [],
    language_aliases,
    features: {
      highlight_linenumber_toggle: config.highlight_linenumber_toggle,
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
    }
  };

  return { config, settings };
}


// Asset registration
function registerAssets() {
  // Register generator to copy local CSS and JS files
  hexo.extend.generator.register('shiki_local_assets', () => [
    {
      path: ASSET_PATHS.css,
      data: () => fs.createReadStream(path.join(__dirname, 'code_block/shiki.css'))
    },
    {
      path: ASSET_PATHS.js,
      data: () => fs.createReadStream(path.join(__dirname, 'code_block/shiki.js'))
    }
  ]);

  // Inject CSS and JS
  hexo.extend.injector.register('head_end', () => {
    return `<link rel="stylesheet" href="${hexo.config.root}${ASSET_PATHS.css}">`;
  });

  hexo.extend.injector.register('body_end', () => {
    return `<script src="${hexo.config.root}${ASSET_PATHS.js}"></script>`;
  });
}

// Theme CSS injection
function injectThemeCSS(themeInfo) {
  const cssVariables = [
    `--hl-bg: ${themeInfo.bg};`,
    `--hl-color: ${themeInfo.fg};`,
    `--hl-code-type: ${themeInfo.type};`,
    `--hl-code-name: ${themeInfo.name};`,
    `--hl-code-display-name: ${themeInfo.displayName || "none"};`,
  ];

  // Add color replacements
  if (themeInfo.colorReplacements) {
    Object.entries(themeInfo.colorReplacements).forEach(([key, value]) => {
      cssVariables.push(`--hl-code-color-${key.slice(1)}: ${value};`);
    });
  }

  // Add VS Code colors
  if (themeInfo.colors) {
    Object.entries(themeInfo.colors).forEach(([key, value]) => {
      cssVariables.push(`--hl-code-colors-${key}: ${value};`);
    });
  }

  // Add other fields
  cssVariables.push(
    `--hl-code-schema: ${themeInfo.$schema || "none"};`,
    `--hl-code-semantic-highlighting: ${themeInfo.semanticHighlighting || "false"};`
  );

  hexo.extend.injector.register("head_end", () => {
    return `<style>:root { ${cssVariables.join(' ')} }</style>`;
  });
}

// Configuration injection
function injectConfiguration(settings) {
  const configScript = `
    <script>
    const CODE_CONFIG = {
      highlightLineNumberToggle: ${settings.features.highlight_linenumber_toggle},
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
function processCodeBlock(code, lang, title, settings, highlighter) {
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

    let highlightedCode = highlighter.codeToHtml(code, {
      lang: realLang,
      theme: settings.theme,
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
const configResult = setupConfiguration();
if (!configResult) return;

const { config, settings } = configResult;

// Register assets and inject configurations
registerAssets();
injectConfiguration(settings);
injectHeightLimitCSS(settings.features.highlight_height_limit);

// Initialize and setup highlighter
initializeHighlighter().then((highlighter) => {
  if (!highlighter) return;

  const themeInfo = highlighter.getTheme(settings.theme);
  injectThemeCSS(themeInfo);

  // Register code block processor
  hexo.extend.filter.register("before_post_render", (post) => {
    post.content = post.content.replace(CODE_BLOCK_REGEX, (...args) => {
      const groups = args.pop();
      let { quote, ul, start, end, lang, title, code } = groups;

      // Process indentation
      const indentLength = getIndentLength(args[0]);
      const match = new RegExp(`^${quote.trimEnd()}`, "gm");
      code = code.replace(match, "");
      code = stripIndent(code, indentLength);

      // Clean up parameters
      lang = lang || "";
      title = title?.trim() || "";

      const result = processCodeBlock(code, lang, title, settings, highlighter);
      return `${quote + ul + start}<hexoPostRenderCodeBlock>${result}</hexoPostRenderCodeBlock>${end}`;
    });
  });
});
