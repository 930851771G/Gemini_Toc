# Gemini Toc - Table of Contents for Gemini

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

A Chrome extension that displays a navigation sidebar for Gemini (gemini.google.com), allowing quick jumps to historical questions.

[中文文档](README.md) | English

</div>

---

## ✨ Features

- 🎯 **Auto Extract Questions**: Real-time monitoring of Gemini chat interface, automatically extracting all user questions
- 📑 **Sidebar Navigation**: Uses Chrome Side Panel API to display a clear navigation directory on the right side
- 🚀 **Quick Jump**: Click on any question to smoothly scroll to the corresponding position with highlighting
- 🔄 **Real-time Updates**: Automatic DOM change detection, question list syncs in real-time
- 🎨 **Beautiful Interface**: Modern design with gradient theme and smooth animations

## 🚀 Installation

### From Source

1. Open Chrome extensions page: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `Gemini_Toc` folder
5. Done!

## 📖 Usage

1. Visit [gemini.google.com](https://gemini.google.com)
2. Click the extension icon to open the sidebar
3. Your questions will be automatically listed
4. Click any question to jump to it

## 🛠️ Tech Stack

- Chrome Extension Manifest V3
- Side Panel API
- MutationObserver
- Chrome Runtime Messaging

## 📄 License

[MIT License](LICENSE)

## 👨‍💻 Author

**XiaoXu (小旭)**

## 🙏 Acknowledgments

- Chrome Extension API Documentation
- Gemini by Google
- All contributors and users

---

<div align="center">
Made with ❤️ by XiaoXu
</div>
