// Constants and Configuration
const SELECTORS = {
  figureHighlight: 'figure.shiki',
  preCode: 'pre code',
  codeblock: 'div.codeblock .code pre',
  gutter: '.gutter',
  gutterPre: '.gutter pre',
  preShiki: 'pre.shiki',
  expandBtn: '.code-expand-btn',
  exitFullpage: '.exit-fullpage-button'
};

const CLASSES = {
  copyTrue: 'copy-true',
  closed: 'closed',
  expandDone: 'expand-done',
  codeFullpage: 'code-fullpage',
  wrapActive: 'wrap-active'
};

const ICONS = {
  lineNumber: '<i class="fa-solid fa-list-ol" title="Toggle Line Numbers"></i>',
  wrap: '<i class="fa-solid fa-arrow-down-wide-short" title="Toggle Wrap"></i>',
  copy: '<div class="copy-notice"></div><i class="fas fa-paste copy-button"></i>',
  raw: '<i class="fas fa-file-alt raw-button" title="View Raw"></i>',
  fullpage: '<i class="fa-solid fa-up-right-and-down-left-from-center fullpage-button"></i>',
  expand: '<i class="fas fa-angle-down expand"></i>',
  expandCode: '<i class="fas fa-angle-double-down"></i>',
  exitFullpage: '<i class="fas fa-sign-out-alt exit-readmode"></i>',
  trafficLights: `
    <div class="traffic-lights">
      <span class="traffic-light red"></span>
      <span class="traffic-light yellow"></span>
      <span class="traffic-light green"></span>
    </div>
  `
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
      Utils.showAlert(noticeElement, CODE_CONFIG.copy.success);
    } catch (err) {
      console.error('Failed to copy:', err);
      Utils.showAlert(noticeElement, CODE_CONFIG.copy.error);
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

  raw(element) {
    const buttonParent = element.parentNode;
    const codeElement = buttonParent.querySelector(SELECTORS.codeblock);

    if (!codeElement) {
      console.error('Code element not found!');
      return;
    }

    const rawWindow = window.open();
    if (!rawWindow) {
      console.error('Failed to open window. Please allow pop-ups.');
      return;
    }

    const preElement = rawWindow.document.createElement('pre');
    preElement.textContent = codeElement.textContent;
    rawWindow.document.body.appendChild(preElement);

    // Style the new window
    Object.assign(rawWindow.document.body.style, {
      margin: '0',
      padding: '1rem',
      backgroundColor: '#f5f5f5',
      fontFamily: 'monospace'
    });
    rawWindow.document.title = 'Code Raw Content';
  },

  toggleLineNumbers(element) {
    const figure = element.closest(SELECTORS.figureHighlight);
    const gutter = figure?.querySelector(SELECTORS.gutter);
    if (gutter) {
      gutter.style.display = gutter.style.display === 'none' ? '' : 'none';
    }
  },

  toggleWrap(element) {
    const figure = element.closest(SELECTORS.figureHighlight);
    const pre = figure?.querySelector(SELECTORS.preShiki);
    const code = pre?.querySelector('code');
    const gutter = figure?.querySelector(SELECTORS.gutter);
    const gutterPre = gutter?.querySelector('pre');

    if (!pre || !code || !gutter || !gutterPre) {
      console.error('Required elements not found!');
      return;
    }

    const isWrapped = pre.style.whiteSpace === 'pre-wrap';

    if (isWrapped) {
      this.disableWrap(pre, code, gutterPre, element);
    } else {
      this.enableWrap(pre, code, gutterPre, element);
    }
  },

  disableWrap(pre, code, gutterPre, element) {
    Object.assign(pre.style, { whiteSpace: 'pre' });
    Object.assign(code.style, {
      whiteSpace: 'pre',
      wordBreak: 'normal',
      overflowWrap: 'normal'
    });
    element.classList.remove(CLASSES.wrapActive);

    // Restore original line numbers
    const lineCount = code.textContent.split('\n').length;
    gutterPre.innerHTML = Array.from(
      { length: lineCount },
      (_, i) => `<span class="line">${i + 1}</span><br>`
    ).join('');
  },

  enableWrap(pre, code, gutterPre, element) {
    Object.assign(pre.style, { whiteSpace: 'pre-wrap' });
    Object.assign(code.style, {
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      overflowWrap: 'anywhere'
    });
    element.classList.add(CLASSES.wrapActive);

    this.updateLineNumbers(pre, code, gutterPre);

    // Add resize listener
    const resizeHandler = () => {
      if (pre.style.whiteSpace === 'pre-wrap') {
        this.updateLineNumbers(pre, code, gutterPre);
      }
    };
    window.addEventListener('resize', resizeHandler);
  },

  updateLineNumbers(pre, code, gutterPre) {
    const lines = code.textContent.split('\n');
    const tempContainer = Utils.createElement('div');

    // Setup temp container for measurement
    Object.assign(tempContainer.style, {
      visibility: 'hidden',
      position: 'absolute',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      overflowWrap: 'anywhere',
      font: window.getComputedStyle(code).font,
      lineHeight: window.getComputedStyle(code).lineHeight,
      width: `${code.getBoundingClientRect().width}px`,
      paddingLeft: window.getComputedStyle(pre).paddingLeft,
      paddingRight: window.getComputedStyle(pre).paddingRight
    });

    document.body.appendChild(tempContainer);

    let lineNumbersHTML = '';
    lines.forEach((line, i) => {
      const tempLine = Utils.createElement('div');
      tempLine.textContent = line || ' ';
      tempContainer.appendChild(tempLine);

      const lineHeight = tempLine.offsetHeight;
      const singleLineHeight = parseInt(window.getComputedStyle(tempLine).lineHeight, 10);
      const lineCount = Math.round(lineHeight / singleLineHeight);

      for (let j = 0; j < lineCount; j++) {
        lineNumbersHTML += `<span class="line">${j === 0 ? i + 1 : ''}</span><br>`;
      }

      tempContainer.removeChild(tempLine);
    });

    document.body.removeChild(tempContainer);
    gutterPre.innerHTML = lineNumbersHTML;
  }
};

// Fullscreen Handler
const FullscreenHandler = {
  toggle(item, clickElement) {
    const wrapper = item.closest(SELECTORS.figureHighlight);
    const isFullpage = wrapper.classList.toggle(CLASSES.codeFullpage);

    const expandButton = wrapper.querySelector(SELECTORS.expandBtn);

    // Store initial state
    if (!wrapper.dataset.initialExpandState) {
      wrapper.dataset.initialExpandState = expandButton?.classList.contains(CLASSES.expandDone)
        ? 'expanded' : 'collapsed';
    }

    if (isFullpage) {
      this.enterFullscreen(wrapper, expandButton);
    } else {
      this.exitFullscreen(wrapper, expandButton);
    }

    // Toggle button icons
    clickElement.classList.toggle('fa-down-left-and-up-right-to-center', isFullpage);
    clickElement.classList.toggle('fa-up-right-and-down-left-from-center', !isFullpage);
  },

  enterFullscreen(wrapper, expandButton) {
    Object.assign(wrapper.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '9999',
      margin: '0',
      borderRadius: '0',
      overflow: 'auto'
    });

    document.documentElement.style.overflow = 'hidden';

    // Force expand if collapsed
    if (expandButton && !expandButton.classList.contains(CLASSES.expandDone)) {
      expandButton.click();
    }

    // Hide expand button and add exit button
    if (expandButton) expandButton.style.display = 'none';
    this.addExitButton();
  },

  exitFullscreen(wrapper, expandButton) {
    // Reset styles
    Object.assign(wrapper.style, {
      position: '',
      top: '',
      left: '',
      width: '',
      height: '',
      zIndex: '',
      margin: '',
      borderRadius: '',
      overflow: ''
    });

    document.documentElement.style.overflow = '';

    // Restore expand button
    if (expandButton) expandButton.style.display = '';

    // Restore initial state
    if (wrapper.dataset.initialExpandState === 'collapsed' &&
      expandButton?.classList.contains(CLASSES.expandDone)) {
      expandButton.click();
    }

    this.removeExitButton();
    delete wrapper.dataset.initialExpandState;
  },

  addExitButton() {
    const exitButton = Utils.createElement('div', 'exit-fullpage-button', ICONS.exitFullpage);
    exitButton.addEventListener('click', () => {
      const fullscreenElement = document.querySelector(`.${CLASSES.codeFullpage}`);
      if (fullscreenElement) {
        const fullpageButton = fullscreenElement.querySelector('.fullpage-button');
        if (fullpageButton) fullpageButton.click();
      }
    });
    document.body.appendChild(exitButton);
  },

  removeExitButton() {
    const exitButton = document.querySelector(SELECTORS.exitFullpage);
    exitButton?.remove();
  }
};

// Main toolbar event handler
function handleToolbarClick(event) {
  const target = event.target;
  const classList = target.classList;

  const handlers = {
    'expand': () => FeatureHandlers.shrink(this),
    'copy-button': () => FeatureHandlers.copy(this, target),
    'fullpage-button': () => FullscreenHandler.toggle(this, target),
    'raw-button': () => FeatureHandlers.raw(this),
    'fa-list-ol': () => FeatureHandlers.toggleLineNumbers(this),
    'fa-arrow-down-wide-short': () => FeatureHandlers.toggleWrap(this)
  };

  for (const [className, handler] of Object.entries(handlers)) {
    if (classList.contains(className)) {
      handler();
      break;
    }
  }
}

// Expand code handler
function handleExpandCode() {
  this.classList.toggle(CLASSES.expandDone);
}

// Toolbar creation
function createToolbar(lang, title, item) {
  const fragment = document.createDocumentFragment();
  const config = CODE_CONFIG;

  // Toolbar is always shown
  const toolbar = Utils.createElement('div', `shiki-tools ${config.isHighlightShrink === false ? CLASSES.closed : ''}`);

  // Create sections
  const leftSection = Utils.createElement('div', 'left');
  const centerSection = Utils.createElement('div', 'center');
  const rightSection = Utils.createElement('div', 'right');

  // Build left section content
  let leftHTML = ICONS.trafficLights;
  if (config.highlightLang) leftHTML += lang.toUpperCase();
  leftSection.innerHTML = leftHTML;

  // Build center section
  if (config.highlightTitle) centerSection.innerHTML = title;

  // Build right section
  let rightHTML = '';
  if (config.highlightLineNumberToggle) rightHTML += ICONS.lineNumber;
  if (config.highlightWrapToggle) rightHTML += ICONS.wrap;
  if (config.highlightCopy) rightHTML += ICONS.copy;
  if (config.highlightRaw) rightHTML += ICONS.raw;
  if (config.highlightFullPage) rightHTML += ICONS.fullpage;
  if (config.isHighlightShrink !== undefined) {
    rightHTML += `<i class="fas fa-angle-down expand ${config.isHighlightShrink === false ? CLASSES.closed : ''}"></i>`;
  }
  rightSection.innerHTML = rightHTML;

  // Assemble toolbar
  toolbar.appendChild(leftSection);
  toolbar.appendChild(centerSection);
  toolbar.appendChild(rightSection);
  toolbar.addEventListener('click', handleToolbarClick);

  fragment.appendChild(toolbar);

  // Add expand button if height limit exceeded
  if (config.highlightHeightLimit && item.offsetHeight > config.highlightHeightLimit + 30) {
    const expandBtn = Utils.createElement('div', 'code-expand-btn', ICONS.expandCode);
    expandBtn.addEventListener('click', handleExpandCode);
    fragment.appendChild(expandBtn);
  }

  item.insertBefore(fragment, item.firstChild);
}

// Main initialization function
function addHighlightTool() {
  if (!CODE_CONFIG) return;

  const figures = document.querySelectorAll(SELECTORS.figureHighlight);
  if (!figures.length) return;

  figures.forEach(figure => {
    // Extract language and title
    const classList = figure.getAttribute('class').split(' ');
    const lang = classList.length > 1 ? classList[1] : 'PlainText';
    const title = figure.getAttribute('data_title') || '';

    const langHTML = `<div class="code-lang">${lang}</div>`;
    const titleHTML = title ? `<div class="code-title">${title}</div>` : '';

    createToolbar(langHTML, titleHTML, figure);
  });
}

// Event listeners
document.addEventListener('pjax:success', addHighlightTool);
document.addEventListener('DOMContentLoaded', addHighlightTool);
window.addEventListener('hexo-blog-decrypt', addHighlightTool);
