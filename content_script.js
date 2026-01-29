// Content Script for Gemini Navigation Panel
// 负责监听 DOM 变化并提取用户提问

(function() {
  'use strict';

  // 存储已发现的提问
  let questions = [];
  let observer = null;

  // 提取用户提问的函数
  function extractQuestions() {
    const newQuestions = [];
    const seenElements = new Set(); // 用于去重（基于元素而非文本）
    
    console.log('🔍 开始提取提问...');
    
    // Gemini 的用户提问通常在特定的容器中
    // 这里使用多个可能的选择器来适配不同的页面结构
    const possibleSelectors = [
      // Gemini 新版可能的选择器
      '[data-test-id*="user"]',
      '[data-test-id*="User"]',
      '[class*="user-query"]',
      '[class*="query-text"]',
      '[class*="user-message"]',
      '[class*="userMessage"]',
      '.query-content',
      // 通用选择器：查找包含用户消息的元素
      '[class*="user"] [class*="message"]',
      '[data-message-author-role="user"]',
      // 更通用的选择器
      'model-response + *',
      '[class*="prompt"]'
    ];

    // 尝试每个选择器
    for (const selector of possibleSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        console.log(`📌 选择器 "${selector}" 找到 ${elements.length} 个元素`);
        
        if (elements.length > 0) {
          // 过滤掉嵌套元素，只保留最外层的元素
          const filteredElements = Array.from(elements).filter(element => {
            // 检查是否有父元素也在结果集中
            let parent = element.parentElement;
            while (parent) {
              if (Array.from(elements).includes(parent)) {
                return false; // 如果父元素也在结果中，跳过这个子元素
              }
              parent = parent.parentElement;
            }
            return true;
          });
          
          console.log(`🔍 过滤后剩余 ${filteredElements.length} 个元素（去除嵌套）`);
          
          filteredElements.forEach((element, index) => {
            const text = element.textContent.trim();
            
            // 基于元素本身去重，而不是文本内容
            // 这样允许相同文本的提问出现多次
            if (text && text.length > 0 && !seenElements.has(element)) {
              seenElements.add(element);
              
              // 为每个提问生成唯一 ID（使用时间戳和随机数确保唯一性）
              const id = `question-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
              element.setAttribute('data-question-id', id);
              
              newQuestions.push({
                id: id,
                text: text.substring(0, 100), // 限制长度
                fullText: text,
                element: element
              });
              
              console.log(`✅ 提取到提问 #${newQuestions.length}: ${text.substring(0, 50)}...`);
            }
          });
          
          // 如果找到了元素，就不再尝试其他选择器
          if (newQuestions.length > 0) {
            console.log(`✨ 使用选择器 "${selector}" 成功提取 ${newQuestions.length} 个提问`);
            break;
          }
        }
      } catch (err) {
        console.warn(`⚠️ 选择器 "${selector}" 出错:`, err);
      }
    }

    // 如果上述选择器都没找到，使用更通用的方法
    if (newQuestions.length === 0) {
      console.log('🔄 尝试通用方法提取...');
      
      // 查找所有可能包含对话的容器
      const chatContainers = document.querySelectorAll('[class*="conversation"], [class*="chat"], main, [role="main"]');
      console.log(`📦 找到 ${chatContainers.length} 个对话容器`);
      
      chatContainers.forEach((container, containerIndex) => {
        // 在容器中查找所有段落和文本块
        const textElements = container.querySelectorAll('p, div[class*="text"], div[class*="content"]');
        console.log(`📝 容器 #${containerIndex + 1} 中找到 ${textElements.length} 个文本元素`);
        
        // 过滤掉嵌套元素
        const filteredElements = Array.from(textElements).filter(element => {
          let parent = element.parentElement;
          while (parent && parent !== container) {
            if (Array.from(textElements).includes(parent)) {
              return false;
            }
            parent = parent.parentElement;
          }
          return true;
        });
        
        filteredElements.forEach((element, index) => {
          const text = element.textContent.trim();
          // 简单启发式：用户提问通常较短且不包含代码块
          // 基于元素去重而非文本
          if (text && text.length > 10 && text.length < 500 && !element.querySelector('code') && !seenElements.has(element)) {
            seenElements.add(element);
            
            const id = `question-fallback-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            element.setAttribute('data-question-id', id);
            
            newQuestions.push({
              id: id,
              text: text.substring(0, 100),
              fullText: text,
              element: element
            });
            
            console.log(`✅ 通用方法提取到: ${text.substring(0, 50)}...`);
          }
        });
      });
    }

    // 如果还是没找到，输出调试信息
    if (newQuestions.length === 0) {
      console.log('❌ 未找到任何提问');
      console.log('📊 页面结构调试信息:');
      console.log('- document.body 子元素数量:', document.body.children.length);
      console.log('- 所有 div 数量:', document.querySelectorAll('div').length);
      console.log('- 所有 p 数量:', document.querySelectorAll('p').length);
      
      // 输出页面主要结构
      const mainElements = document.querySelectorAll('main, [role="main"], [class*="chat"], [class*="conversation"]');
      console.log('- 主要容器:', mainElements.length);
      mainElements.forEach((el, i) => {
        console.log(`  容器 #${i + 1}:`, el.className, el.id);
      });
    }

    return newQuestions;
  }

  // 发送提问列表到侧边栏
  function sendQuestionsToSidePanel() {
    console.log('📤 准备发送提问列表...');
    questions = extractQuestions();
    
    if (questions.length > 0) {
      // 发送消息到 background script，它会转发到侧边栏
      chrome.runtime.sendMessage({
        type: 'QUESTIONS_UPDATED',
        questions: questions.map(q => ({
          id: q.id,
          text: q.text,
          fullText: q.fullText
        }))
      }).then(() => {
        console.log(`✅ 成功发送 ${questions.length} 个提问到侧边栏`);
      }).catch(err => {
        console.error('❌ 发送消息失败:', err);
      });
    } else {
      console.warn('⚠️ 没有提问可发送');
    }
  }

  // 监听来自侧边栏的滚动请求
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SCROLL_TO_QUESTION') {
      const questionId = message.questionId;
      const element = document.querySelector(`[data-question-id="${questionId}"]`);
      
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // 高亮显示该元素
        element.style.transition = 'background-color 0.5s';
        const originalBg = element.style.backgroundColor;
        element.style.backgroundColor = '#fff3cd';
        
        setTimeout(() => {
          element.style.backgroundColor = originalBg;
        }, 2000);
        
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Element not found' });
      }
    } else if (message.type === 'REQUEST_QUESTIONS') {
      // 侧边栏请求当前的提问列表
      sendQuestionsToSidePanel();
      sendResponse({ success: true });
    }
    
    return true;
  });

  // 使用 MutationObserver 监听 DOM 变化
  function startObserving() {
    try {
      // 先执行一次提取
      setTimeout(sendQuestionsToSidePanel, 1000);

      // 创建观察器
      observer = new MutationObserver((mutations) => {
        try {
          // 防抖：避免频繁触发
          clearTimeout(window.geminiNavTimeout);
          window.geminiNavTimeout = setTimeout(() => {
            sendQuestionsToSidePanel();
          }, 500);
        } catch (err) {
          console.error('❌ MutationObserver 回调错误:', err);
        }
      });

      // 观察整个文档的变化
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true
        });
        console.log('✅ Gemini Navigation Panel: Started observing DOM changes');
      } else {
        console.error('❌ document.body 不存在，无法启动观察器');
      }
    } catch (err) {
      console.error('❌ 启动观察器失败:', err);
    }
  }

  // 等待页面加载完成
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startObserving);
    } else {
      startObserving();
    }
  } catch (err) {
    console.error('❌ 初始化失败:', err);
  }

  // 页面卸载时清理
  window.addEventListener('beforeunload', () => {
    if (observer) {
      observer.disconnect();
    }
  });

})();
