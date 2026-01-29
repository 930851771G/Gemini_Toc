// Background Service Worker for Gemini Navigation Panel

// 当用户点击扩展图标时，打开侧边栏
chrome.action.onClicked.addListener((tab) => {
  // 检查是否在 Gemini 页面
  if (tab.url && tab.url.includes('gemini.google.com')) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'QUESTIONS_UPDATED') {
    // 将消息转发到侧边栏
    // 侧边栏会通过 chrome.runtime.onMessage 接收
    console.log('Questions updated:', message.questions);
  }
  return true;
});

// 当标签页更新时，检查是否在 Gemini 页面
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('gemini.google.com')) {
    // 可以在这里做一些初始化工作
    console.log('Gemini page loaded');
  }
});
