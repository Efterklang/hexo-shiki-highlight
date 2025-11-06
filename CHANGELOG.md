# Changelog

All notable changes to this project will be documented in this file.

## [3.0.0] - 2025

- Refactored CSS selectors: replaced descendant selectors (`A B`) with direct child selectors (`A > B`) to improve specificity and rendering performance.
- Adopted `hexo.extend.highlight.register` API to register the Shiki highlighter for better integration with Hexo's highlighting system.
- Updated / adjusted configuration option names and behaviors (settings cleanup & consistency improvements).

## [2.2.0] - 2025

### Added
- Support for colorized brackets

### Changed
- Bumped Shiki to version 3.13.0
- Add `SF Pro` in `pre.shiki code` font-family

## [2.1.0] - 2025

### Added
- More granular CSS variables for highlighting, diffs, and UI elements
- Catppuccin color palette support for both light and dark themes

## [2.0.2] - 2025

### Added
- Basic support for Shiki Transformers
