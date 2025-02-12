const addHighlightTool = function () {
  const isHidden = (ele) => ele.offsetHeight === 0 && ele.offsetWidth === 0;
  if (!CODE_CONFIG) return;

  const {
    // left
    highlightLineNumberToggle,
    highlightWrapToggle,
    highlightLang,
    // title
    highlightTitle,
    // right
    highlightCopy,
    highlightRaw,
    highlightFullPage,
    // other
    highlightHeightLimit,
  } = CODE_CONFIG;
  const isHighlightShrink = (CODE_CONFIG.isHighlightShrink === true || CODE_CONFIG.isHighlightShrink === false) ? CODE_CONFIG.isHighlightShrink : undefined;
  const isShowTool =
    highlightLineNumberToggle ||
    highlightWrapToggle ||
    highlightLang ||
    highlightTitle ||
    highlightCopy ||
    highlightRaw ||
    highlightFullPage ||
    isHighlightShrink !== undefined;
  const $figureHighlight = document.querySelectorAll("figure.shiki");

  if (!((isShowTool || highlightHeightLimit) && $figureHighlight.length))
    return;

  const highlightLineNumberToggleEle = highlightLineNumberToggle ? '<i class="fa-solid fa-list-ol" title="Toggle Line Numbers"></i>' : "";
  const highlightWrapToggleEle = highlightWrapToggle ? '<i class="fa-solid fa-arrow-down-wide-short" title="Toggle Wrap"></i>' : "";
  const highlightCopyEle = highlightCopy ? '<div class="copy-notice"></div><i class="fas fa-paste copy-button"></i>' : "";
  const highlightRawEle = highlightRaw ? '<i class="fas fa-file-alt raw-button" title="View Raw"></i>' : "";
  const highlightFullpageEle = highlightFullPage ? '<i class="fa-solid fa-up-right-and-down-left-from-center fullpage-button"></i>' : "";
  const highlightShrinkClass = (isHighlightShrink != undefined ? (isHighlightShrink == true ? "" : "closed") : "");
  const highlightShrinkEle = isHighlightShrink != undefined ? `<i class="fas fa-angle-down expand ${highlightShrinkClass}"></i>` : "";

  const alertInfo = (ele, text) => {
    ele.textContent = text;
    ele.style.opacity = 1;
    ele.style.visibility = 'visible'; // 确保提示信息可见
    setTimeout(() => {
      ele.style.opacity = 0;
      ele.style.visibility = 'hidden'; // 提示信息消失后隐藏
    }, 800);
  };

  const copy = async (text, ctx) => {
    try {
      // 尝试使用 navigator.clipboard.writeText
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        console.log('Text copied successfully using Clipboard API:', text);
        alertInfo(ctx, CODE_CONFIG.copy.success);
      } else {
        // 如果不支持 Clipboard API，使用 document.execCommand('copy') 作为回退方案
        fallbackCopyText(text);
        console.log('Text copied successfully using execCommand:', text);
        alertInfo(ctx, CODE_CONFIG.copy.success);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      alertInfo(ctx, CODE_CONFIG.copy.error);
    }
  };

  // 回退方案：使用 document.execCommand('copy')
  const fallbackCopyText = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed'; // 避免滚动到底部
    textarea.style.opacity = '0'; // 隐藏 textarea
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length); // 兼容移动设备
    try {
      const successful = document.execCommand('copy');
      if (!successful) {
        throw new Error('Failed to copy text using execCommand');
      }
    } catch (err) {
      throw err; // 抛出错误，由上层 catch 处理
    } finally {
      // 移除临时的 textarea
      document.body.removeChild(textarea);
    }
  };

  // click events
  const highlightCopyFn = (ele, clickEle) => {
    const $buttonParent = ele.parentNode;
    $buttonParent.classList.add('copy-true');
    const preCodeSelector = 'pre code';
    const codeElement = $buttonParent.querySelector(preCodeSelector);
    if (!codeElement) return;
    copy(codeElement.innerText, clickEle.previousElementSibling);
    $buttonParent.classList.remove('copy-true');
  };

  const highlightShrinkFn = (ele) => {
    const expandButton = ele.querySelector(".expand");
    if (expandButton) {
      expandButton.classList.toggle("closed");
    }
    const $nextEle = [...ele.parentNode.children].slice(1);
    if (isHidden($nextEle[$nextEle.length - 1])) {
      $nextEle.forEach((e) => {
        e.style.display = "flex";
      });
    } else {
      $nextEle.forEach((e) => {
        e.style.display = "none";
      });
    }
  };

  const highlightRawFn = (ele) => {
    const PRE_CODE_SELECTOR = "div.codeblock .code pre";
    const $buttonParent = ele.parentNode;
    const codeElement = $buttonParent.querySelector(PRE_CODE_SELECTOR);
    if (!codeElement) {
      console.error("Code element not found!");
      return;
    }
    const codeContent = codeElement.textContent;
    const rawWindow = window.open();
    if (!rawWindow) {
      console.error("Failed to open a new window. Please allow pop-ups.");
      return;
    }
    const preElement = rawWindow.document.createElement("pre");
    preElement.textContent = codeContent;
    rawWindow.document.body.appendChild(preElement);
    // 设置新窗口的样式和标题
    rawWindow.document.title = "Code Raw Content";
    rawWindow.document.body.style.margin = "0";
    rawWindow.document.body.style.padding = "1rem";
    rawWindow.document.body.style.backgroundColor = "#f5f5f5";
    rawWindow.document.body.style.fontFamily = "monospace";
  };

  const toggleLineNumbers = (ele) => {
    const figureElement = ele.closest("figure.shiki");
    const gutterElement = figureElement.querySelector(".gutter");
    if (gutterElement) {
      gutterElement.style.display =
        gutterElement.style.display === "none" ? "" : "none";
    }
  };

  const toggleWrap = (ele) => {
    const figureElement = ele.closest("figure.shiki");
    const preElement = figureElement.querySelector("pre.shiki");
    const codeElement = preElement?.querySelector("code");
    const gutterElement = figureElement.querySelector(".gutter");
    const gutterPreElement = gutterElement.querySelector("pre");

    if (preElement && codeElement && gutterElement && gutterPreElement) {
      if (preElement.style.whiteSpace === "pre-wrap") {
        // 禁用换行
        preElement.style.whiteSpace = "pre";
        codeElement.style.whiteSpace = "pre";
        codeElement.style.wordBreak = "normal";
        codeElement.style.overflowWrap = "normal";
        ele.classList.remove("wrap-active");

        // 恢复原始行号
        const originalLineCount = codeElement.textContent.split("\n").length;
        gutterPreElement.innerHTML = Array.from(
          { length: originalLineCount },
          (_, i) => `<span class="line">${i + 1}</span><br>`,
        ).join("");
      } else {
        // 启用换行
        preElement.style.whiteSpace = "pre-wrap";
        codeElement.style.whiteSpace = "pre-wrap";
        codeElement.style.wordBreak = "break-all";
        codeElement.style.overflowWrap = "anywhere";
        ele.classList.add("wrap-active");

        // 动态生成行号
        updateLineNumbers(preElement, codeElement, gutterPreElement);

        // 监听窗口调整大小事件
        window.addEventListener("resize", () => {
          if (preElement.style.whiteSpace === "pre-wrap") {
            updateLineNumbers(preElement, codeElement, gutterPreElement);
          }
        });
      }
    } else {
      console.error("pre, code, gutter, or gutter pre element not found!");
    }
  };

  const updateLineNumbers = (preElement, codeElement, gutterPreElement) => {
    const codeText = codeElement.textContent;
    const lines = codeText.split("\n");
    let lineNumbersHTML = "";

    const tempContainer = document.createElement("div");
    tempContainer.style.visibility = "hidden";
    tempContainer.style.position = "absolute";
    tempContainer.style.whiteSpace = "pre-wrap";
    tempContainer.style.wordBreak = "break-all";
    tempContainer.style.overflowWrap = "anywhere";
    tempContainer.style.font = window.getComputedStyle(codeElement).font;
    tempContainer.style.lineHeight = window.getComputedStyle(codeElement).lineHeight;
    // 使用 getBoundingClientRect 获取实际宽度
    const codeRect = codeElement.getBoundingClientRect();
    tempContainer.style.width = `${codeRect.width}px`;
    const preStyles = window.getComputedStyle(preElement);
    tempContainer.style.paddingLeft = preStyles.paddingLeft;
    tempContainer.style.paddingRight = preStyles.paddingRight;
    document.body.appendChild(tempContainer);

    lines.forEach((line, i) => {
      const tempLine = document.createElement("div");
      tempLine.textContent = line || " ";
      tempContainer.appendChild(tempLine);

      const lineHeight = tempLine.offsetHeight;
      const singleLineHeight = parseInt(
        window.getComputedStyle(tempLine).lineHeight,
        10,
      );
      const lineCount = Math.round(lineHeight / singleLineHeight);

      for (let j = 0; j < lineCount; j++) {
        lineNumbersHTML += `<span class="line">${j === 0 ? i + 1 : ""}</span><br>`;
      }

      tempContainer.removeChild(tempLine);
    });

    document.body.removeChild(tempContainer);
    gutterPreElement.innerHTML = lineNumbersHTML;
  };

  const codeFullpage = (item, clickEle) => {
    const wrapEle = item.closest("figure.shiki");
    const isFullpage = wrapEle.classList.toggle("code-fullpage");

    // 获取 shiki-tools 元素
    const shikiTools = wrapEle.querySelector(".shiki-tools");
    // 获取代码块的展开按钮
    const expandButton = wrapEle.querySelector(".code-expand-btn");
    // 获取代码块内容区域
    const codeContent = wrapEle.querySelector(".codeblock");

    // 记录代码块的初始状态
    if (!wrapEle.dataset.initialExpandState) {
      wrapEle.dataset.initialExpandState = expandButton?.classList.contains(
        "expand-done",
      )
        ? "expanded"
        : "collapsed";
    }

    if (isFullpage) {
      // 进入全屏模式
      wrapEle.style.position = "fixed";
      wrapEle.style.top = "0";
      wrapEle.style.left = "0";
      wrapEle.style.width = "100vw"; // 使用视口宽度
      wrapEle.style.height = "100vh"; // 使用视口高度
      wrapEle.style.zIndex = "9999";
      wrapEle.style.margin = "0";
      wrapEle.style.borderRadius = "0";
      wrapEle.style.overflow = "auto";

      // 隐藏页面的滚动条
      document.documentElement.style.overflow = "hidden";

      // 如果代码块是折叠状态，强制展开
      if (expandButton && !expandButton.classList.contains("expand-done")) {
        expandCode.call(expandButton); // 强制展开代码块
      }

      // 隐藏展开按钮
      if (expandButton) {
        expandButton.style.display = "none";
      }

      // 添加退出按钮到 body 元素
      const exitButton = document.createElement("div");
      exitButton.className = "exit-fullpage-button";
      exitButton.innerHTML =
        '<i class="fas fa-sign-out-alt exit-readmode"></i>';
      exitButton.addEventListener("click", () => {
        codeFullpage(item, clickEle); // 退出全屏
      });
      document.body.appendChild(exitButton); // 将按钮添加到 body 元素
    } else {
      // 退出全屏模式
      wrapEle.style.position = "";
      wrapEle.style.top = "";
      wrapEle.style.left = "";
      wrapEle.style.width = "";
      wrapEle.style.height = "";
      wrapEle.style.zIndex = "";
      wrapEle.style.margin = "";
      wrapEle.style.borderRadius = "";
      wrapEle.style.overflow = "";

      // 恢复页面的滚动条
      document.documentElement.style.overflow = "";

      // 恢复展开按钮的显示
      if (expandButton) {
        expandButton.style.display = "";
      }

      // 恢复代码块的初始状态
      if (
        wrapEle.dataset.initialExpandState === "collapsed" &&
        expandButton &&
        expandButton.classList.contains("expand-done")
      ) {
        expandCode.call(expandButton); // 重新折叠代码块
      }

      // 移除退出按钮
      const exitButton = document.querySelector(".exit-fullpage-button");
      if (exitButton) {
        exitButton.remove();
      }

      // 清除记录的初始状态
      delete wrapEle.dataset.initialExpandState;
    }

    // 切换按钮图标
    clickEle.classList.toggle(
      "fa-down-left-and-up-right-to-center",
      isFullpage,
    );
    clickEle.classList.toggle(
      "fa-up-right-and-down-left-from-center",
      !isFullpage,
    );
  };

  const highlightToolsFn = function (e) {
    const $target = e.target.classList;
    if ($target.contains("expand")) highlightShrinkFn(this);
    else if ($target.contains("copy-button")) highlightCopyFn(this, e.target);
    else if ($target.contains("fullpage-button")) codeFullpage(this, e.target);
    else if ($target.contains("raw-button"))
      highlightRawFn(this); // 新增 Raw 功能
    else if ($target.contains("fa-list-ol")) toggleLineNumbers(this);
    else if ($target.contains("fa-arrow-down-wide-short")) toggleWrap(this);
  };

  const expandCode = function () {
    this.classList.toggle("expand-done");
  };

  function createEle(lang, title, item, service) {
    const fragment = document.createDocumentFragment();

    if (isShowTool) {
      const hlTools = document.createElement("div");
      hlTools.className = `shiki-tools ${highlightShrinkClass}`;

      // 创建左对齐部分
      const leftContainer = document.createElement("div");
      leftContainer.className = "left";
      leftContainer.innerHTML =
        highlightLineNumberToggleEle + highlightWrapToggleEle + (highlightLang ? lang : "");

      // 创建居中部分
      const centerContainer = document.createElement("div");
      centerContainer.className = "center";
      centerContainer.innerHTML = (highlightTitle ? title : "");

      // 创建右对齐部分
      const rightContainer = document.createElement("div");
      rightContainer.className = "right";
      rightContainer.innerHTML =
        highlightCopyEle +
        highlightRawEle +
        highlightFullpageEle +
        highlightShrinkEle;

      // 将三个部分添加到 hlTools
      hlTools.appendChild(leftContainer);

      hlTools.appendChild(centerContainer);
      hlTools.appendChild(rightContainer);

      hlTools.addEventListener("click", highlightToolsFn);

      fragment.appendChild(hlTools);
    }

    if (highlightHeightLimit && item.offsetHeight > highlightHeightLimit + 30) {
      const ele = document.createElement("div");
      ele.className = "code-expand-btn";
      ele.innerHTML = '<i class="fas fa-angle-double-down"></i>';
      ele.addEventListener("click", expandCode);
      fragment.appendChild(ele);
    }

    if (service === "hl") {
      item.insertBefore(fragment, item.firstChild);
    } else {
      item.parentNode.insertBefore(fragment, item);
    }
  }

  $figureHighlight.forEach(function (item) {
    // 提取 lang
    const classList = item.getAttribute("class").split(" ");
    const lang = classList.length > 1 ? classList[1] : "PlainText"; // 如果 lang 不存在，默认使用 "PlainText"
    const highlightLangEle = `<div class="code-lang">${lang}</div>`; // 将 lang 包装成 HTML

    // 提取 title
    const title = item.getAttribute("data_title") || ""; // 如果 title 不存在，使用空字符串
    const highlightTitleEle = title
      ? `<div class="code-title">${title}</div>`
      : ""; // 将 title 包装成 HTML

    // 调用 createEle
    createEle(highlightLangEle, highlightTitleEle, item, "hl");
  });
};

document.addEventListener("pjax:success", addHighlightTool);
document.addEventListener("DOMContentLoaded", addHighlightTool);

// fix encrypt show code block
window.addEventListener("hexo-blog-decrypt", addHighlightTool);
