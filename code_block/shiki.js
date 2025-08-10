// Constants and Configuration
const SELECTORS = {
  figureHighlight: 'figure.shiki',
  preCode: 'pre code',
  preShiki: 'pre.shiki'
};

const CLASSES = {
  copyTrue: 'copy-true',
  closed: 'closed',
  wrapActive: 'wrap-active'
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
  }
};

// Main toolbar event handler
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
  });
}

// Event listeners
document.addEventListener('pjax:success', addHighlightTool);
document.addEventListener('DOMContentLoaded', addHighlightTool);
window.addEventListener('hexo-blog-decrypt', addHighlightTool);
