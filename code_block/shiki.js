// Constants and Configuration
const SELECTORS = {
  figureHighlight: 'figure.shiki',
  preCode: 'pre code',
  preShiki: 'pre.shiki',
  expandBtn: '.code-expand-btn'
};

const CLASSES = {
  copyTrue: 'copy-true',
  closed: 'closed',
  wrapActive: 'wrap-active',
  expandDone: 'expand-done'
};

// Utility Functions
const Utils = {
  isHidden: (element) => element.offsetHeight === 0 && element.offsetWidth === 0,

  showAlert: (element, text, duration = 800) => {
    element.textContent = text;
    element.style.opacity = 1;
    element.style.visibility = 'visible';
    setTimeout(() => {
      element.style.opacity = 0;
      element.style.visibility = 'hidden';
    }, duration);
  },

  createElement: (tag, className, innerHTML) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
  },

  toggleDisplay: (elements, show) => {
    elements.forEach(element => {
      element.style.display = show ? 'flex' : 'none';
    });
  }
};

// Copy functionality
const CopyHandler = {
  async copy(text, noticeElement) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        this.fallbackCopy(text);
      }
      console.log('Text copied successfully:', text);
      Utils.showAlert(noticeElement, "Copied");
    } catch (err) {
      console.error('Failed to copy:', err);
      Utils.showAlert(noticeElement, "Copy failed!");
    }
  },

  fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position: fixed; opacity: 0;';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    try {
      const successful = document.execCommand('copy');
      if (!successful) throw new Error('execCommand failed');
    } finally {
      document.body.removeChild(textarea);
    }
  }
};

// Feature Handlers
const FeatureHandlers = {
  copy(parentElement, clickElement) {
    const buttonParent = parentElement.parentNode;
    buttonParent.classList.add(CLASSES.copyTrue);

    const codeElement = buttonParent.querySelector(SELECTORS.preCode);
    if (codeElement) {
      CopyHandler.copy(codeElement.innerText, clickElement.previousElementSibling);
    }

    buttonParent.classList.remove(CLASSES.copyTrue);
  },

  shrink(element) {
    const expandButton = element.querySelector('.expand');
    expandButton?.classList.toggle(CLASSES.closed);

    const siblings = [...element.parentNode.children].slice(1);
    const isHidden = Utils.isHidden(siblings[siblings.length - 1]);
    Utils.toggleDisplay(siblings, isHidden);
  },

  toggleWrap(element) {
    const figure = element.closest(SELECTORS.figureHighlight);
    const pre = figure?.querySelector(SELECTORS.preShiki);
    const code = pre?.querySelector('code');

    if (!pre || !code) {
      console.error('Required elements not found!');
      return;
    }

    const isWrapped = pre.style.whiteSpace === 'pre-wrap';

    if (isWrapped) {
      this.disableWrap(pre, code, element);
    } else {
      this.enableWrap(pre, code, element);
    }
  },

  disableWrap(pre, code, element) {
    Object.assign(pre.style, { whiteSpace: 'pre' });
    Object.assign(code.style, {
      whiteSpace: 'pre',
      wordBreak: 'normal',
      overflowWrap: 'normal'
    });
    element.classList.remove(CLASSES.wrapActive);
  },

  enableWrap(pre, code, element) {
    Object.assign(pre.style, { whiteSpace: 'pre-wrap' });
    Object.assign(code.style, {
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      overflowWrap: 'anywhere'
    });
    element.classList.add(CLASSES.wrapActive);
  },

  expandCode(figure) {
    const expandBtn = figure.querySelector(SELECTORS.expandBtn);
    const pre = figure.querySelector(SELECTORS.preShiki);

    if (!expandBtn || !pre) {
      console.error('Required elements for code expansion not found');
      return;
    }

    const isExpanded = figure.classList.contains('expanded');
    const showLines = parseInt(figure.dataset.showLines || '10');

    if (isExpanded) {
      // 折叠代码 - 智能滚动优化
      const figureRect = figure.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const figureTop = figureRect.top + scrollTop;
      const figureBottom = figureRect.bottom + scrollTop;

      // 判断用户当前视窗与代码块的位置关系
      const viewportTop = scrollTop;
      const viewportBottom = scrollTop + viewportHeight;

      // 记录折叠前的状态
      const beforeCollapseHeight = pre.scrollHeight;

      // 计算折叠后的目标高度
      const computedStyle = getComputedStyle(pre);
      const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
      const targetHeight = showLines * lineHeight + paddingTop + paddingBottom;

      // 计算高度差
      const heightDifference = beforeCollapseHeight - targetHeight;

      // 首先设置当前完整高度作为起点
      pre.style.maxHeight = `${beforeCollapseHeight}px`;
      pre.offsetHeight; // 强制重排

      // 应用折叠状态
      requestAnimationFrame(() => {
        figure.classList.remove('expanded');
        pre.style.maxHeight = `${targetHeight}px`;

        // 延迟箭头旋转，等待折叠动画完成
        setTimeout(() => {
          expandBtn.classList.remove(CLASSES.expandDone);
        }, 500); // 与CSS transition时间同步
      });

      // 智能滚动调整
      const smartScrollEnabled = figure.dataset.smartScroll === 'true';
      if (smartScrollEnabled) {
        setTimeout(() => {
          const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
          let targetScrollTop = currentScrollTop;

          // 情况1: 用户在代码块底部附近
          if (viewportTop > figureTop && viewportBottom > figureBottom - 100) {
            // 保持代码块底部相对于视窗的位置
            targetScrollTop = Math.max(0, currentScrollTop - heightDifference * 0.7);
          }
          // 情况2: 用户在代码块中间区域
          else if (viewportTop > figureTop && viewportTop < figureBottom) {
            // 部分补偿滚动位置
            targetScrollTop = Math.max(0, currentScrollTop - heightDifference * 0.3);
          }
          // 情况3: 用户在代码块下方
          else if (viewportTop > figureBottom) {
            // 完全补偿滚动位置
            targetScrollTop = Math.max(0, currentScrollTop - heightDifference);
          }

          // 平滑滚动到目标位置
          if (Math.abs(targetScrollTop - currentScrollTop) > 10) {
            window.scrollTo({
              top: targetScrollTop,
              behavior: 'smooth'
            });
          }
        }, 50); // 稍微延迟以确保DOM更新完成
      }

    } else {
      // 展开代码
      const currentHeight = pre.offsetHeight;
      const fullHeight = pre.scrollHeight;

      // 先设置当前高度作为起点
      pre.style.maxHeight = `${currentHeight}px`;
      pre.offsetHeight; // 强制重排

      // 应用展开状态
      figure.classList.add('expanded');

      requestAnimationFrame(() => {
        pre.style.maxHeight = `${fullHeight}px`;

        // 立即开始箭头旋转动画
        expandBtn.classList.add(CLASSES.expandDone);

        // 动画结束后清除max-height限制，允许内容自然增长
        setTimeout(() => {
          if (figure.classList.contains('expanded')) {
            pre.style.maxHeight = 'none';
          }
        }, 500);
      });
    }
  }
};// Main toolbar event handler
function handleToolbarClick(event) {
  const target = event.target;
  const classList = target.classList;

  const handlers = {
    'expand': () => FeatureHandlers.shrink(this),
    'copy-button': () => FeatureHandlers.copy(this, target),
    'fa-arrow-down-wide-short': () => FeatureHandlers.toggleWrap(this)
  };

  for (const [className, handler] of Object.entries(handlers)) {
    if (classList.contains(className)) {
      handler();
      break;
    }
  }
}

// Code expand button event handler
function handleExpandBtnClick(event) {
  event.preventDefault();
  event.stopPropagation();

  const expandBtn = event.currentTarget;
  const figure = expandBtn.closest(SELECTORS.figureHighlight);

  if (figure) {
    FeatureHandlers.expandCode(figure);
  }
}

// Main initialization function
function addHighlightTool() {
  const figures = document.querySelectorAll(SELECTORS.figureHighlight);
  if (!figures.length) return;

  figures.forEach(figure => {
    // Add event listener to existing shiki-tools
    const toolbar = figure.querySelector('.shiki-tools');
    if (toolbar) {
      toolbar.addEventListener('click', handleToolbarClick);
    }

    // Add event listener to code expand button
    const expandBtn = figure.querySelector(SELECTORS.expandBtn);
    if (expandBtn) {
      expandBtn.addEventListener('click', handleExpandBtnClick);
    }

    // Initialize collapsed state for collapsible code blocks
    if (figure.dataset.collapsible === 'true') {
      const pre = figure.querySelector(SELECTORS.preShiki);
      const showLines = parseInt(figure.dataset.showLines || '10');

      if (pre) {
        // 确保元素已经渲染完成后再设置高度
        requestAnimationFrame(() => {
          const lineHeight = parseFloat(getComputedStyle(pre).lineHeight) || 20;
          const maxHeight = showLines * lineHeight;
          pre.style.maxHeight = `${maxHeight}px`;
          pre.style.overflow = 'hidden';
        });
      }
    }
  });
}// Event listeners
document.addEventListener('pjax:success', addHighlightTool);
document.addEventListener('DOMContentLoaded', addHighlightTool);
window.addEventListener('hexo-blog-decrypt', addHighlightTool);
