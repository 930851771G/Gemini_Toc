// Side Panel Script for Gemini Navigation Panel
// 负责显示提问列表并处理用户交互

(function() {
  'use strict';

  let questions = [];
  let currentTabId = null;

  // DOM 元素
  const questionList = document.getElementById('questionList');
  const emptyState = document.getElementById('emptyState');
  const loading = document.getElementById('loading');
  const refreshBtn = document.getElementById('refreshBtn');

  // 初始化
  async function init() {
    console.log('Side panel initialized');
    
    // 获取当前标签页
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      currentTabId = tabs[0].id;
      
      // 请求 content script 发送提问列表
      requestQuestions();
    }

    // 设置按钮事件监听
    refreshBtn.addEventListener('click', handleRefresh);

    // 监听来自 content script 的消息
    chrome.runtime.onMessage.addListener(handleMessage);
  }

  // 请求提问列表
  function requestQuestions() {
    if (!currentTabId) return;

    showLoading(true);
    
    chrome.tabs.sendMessage(currentTabId, { 
      type: 'REQUEST_QUESTIONS' 
    }).catch(err => {
      console.error('Failed to request questions:', err);
      showLoading(false);
      showEmptyState(true);
    });
  }

  // 处理消息
  function handleMessage(message, sender, sendResponse) {
    if (message.type === 'QUESTIONS_UPDATED') {
      console.log('Received questions:', message.questions);
      questions = message.questions || [];
      renderQuestions();
      showLoading(false);
    }
    return true;
  }

  // 渲染提问列表
  function renderQuestions() {
    // 清空列表
    questionList.innerHTML = '';

    if (questions.length === 0) {
      showEmptyState(true);
      return;
    }

    showEmptyState(false);

    // 创建列表项
    questions.forEach((question, index) => {
      const li = document.createElement('li');
      li.className = 'question-item';
      li.setAttribute('data-question-id', question.id);
      
      const numberSpan = document.createElement('span');
      numberSpan.className = 'question-number';
      numberSpan.textContent = `#${index + 1}`;
      
      const textSpan = document.createElement('span');
      textSpan.className = 'question-text';
      textSpan.textContent = question.text;
      textSpan.title = question.fullText; // 完整文本作为提示
      
      li.appendChild(numberSpan);
      li.appendChild(textSpan);
      
      // 点击事件：滚动到对应位置
      li.addEventListener('click', () => {
        scrollToQuestion(question.id);
      });
      
      questionList.appendChild(li);
    });
  }

  // 滚动到指定提问
  async function scrollToQuestion(questionId) {
    if (!currentTabId) return;

    try {
      const response = await chrome.tabs.sendMessage(currentTabId, {
        type: 'SCROLL_TO_QUESTION',
        questionId: questionId
      });

      if (response && response.success) {
        console.log('Scrolled to question:', questionId);
        
        // 视觉反馈：高亮当前选中的项
        const items = questionList.querySelectorAll('.question-item');
        items.forEach(item => {
          if (item.getAttribute('data-question-id') === questionId) {
            item.style.backgroundColor = '#e8f0fe';
            setTimeout(() => {
              item.style.backgroundColor = '';
            }, 1000);
          }
        });
      } else {
        console.error('Failed to scroll:', response?.error);
      }
    } catch (err) {
      console.error('Error scrolling to question:', err);
    }
  }

  // 刷新按钮处理
  function handleRefresh() {
    console.log('Refreshing questions...');
    requestQuestions();
    
    // 视觉反馈
    refreshBtn.textContent = '⏳ 刷新中...';
    refreshBtn.disabled = true;
    
    setTimeout(() => {
      refreshBtn.textContent = '🔄 刷新';
      refreshBtn.disabled = false;
    }, 1000);
  }

  // 显示/隐藏加载状态
  function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
  }

  // 显示/隐藏空状态
  function showEmptyState(show) {
    emptyState.style.display = show ? 'block' : 'none';
    questionList.style.display = show ? 'none' : 'block';
  }

  // 监听标签页切换
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && tab.url.includes('gemini.google.com')) {
      currentTabId = activeInfo.tabId;
      requestQuestions();
    }
  });

  // 监听标签页更新
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && 
        tab.url && 
        tab.url.includes('gemini.google.com') &&
        tabId === currentTabId) {
      // 页面加载完成，重新请求提问
      setTimeout(requestQuestions, 1000);
    }
  });

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
