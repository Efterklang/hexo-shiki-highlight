"use strict";
import type { ShikiTransformer } from "@shikijs/core";
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
import type Hexo from "hexo";

interface Config {
    themes?: Record<string, string>;
    exclude_languages?: string[];
    language_aliases?: Record<string, string>;
    enable_transformers?: boolean;
    style_to_class?: {
        enable?: boolean;
        class_prefix?: string;
    };
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
    custom_css?: string;
}

const REGISTERED_TRANSFORMERS: ShikiTransformer[] = [
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

// 导出配置处理函数
export function processConfig(hexo: Hexo) {
    const config = (hexo.config.shiki as Config) || {};
    const defaultThemes = {
        light: "catppuccin-latte",
        dark: "catppuccin-mocha"
    };
    return {
        raw: config,
        themes: { ...defaultThemes, ...config.themes },
        excludes: config.exclude_languages || [],
        aliases: new Map(Object.entries(config.language_aliases || {})),
        enableTransformers: config.enable_transformers ?? true,
        styleToClass: {
            enable: config.style_to_class?.enable ?? false,
            classPrefix: config.style_to_class?.class_prefix || "shiki-",
        },
        toolbarItems: {
            lang: config.toolbar_items?.lang ?? true,
            title: config.toolbar_items?.title ?? true,
            wrapToggle: config.toolbar_items?.wrapToggle ?? true,
            copyButton: config.toolbar_items?.copyButton ?? true,
            shrinkButton: config.toolbar_items?.shrinkButton ?? true,
        },
        collapseConfig: {
            enable: config.code_collapse?.enable !== false,
            maxLines: config.code_collapse?.max_lines || 20,
            showLines: config.code_collapse?.show_lines || 20
        },
        customCSS: config.custom_css,

    };
}

export { REGISTERED_TRANSFORMERS };