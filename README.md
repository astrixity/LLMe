# 🤖 LLMe - AI Chat Interface

A modern, flexible web-based chat interface for Large Language Models (LLMs) that supports multiple AI providers and offers a ChatGPT-like experience.

![LLMe Interface](https://img.shields.io/badge/Version-1.0-blue?style=for-the-badge) ![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)

## ✨ Features

### 🔌 Multi-Provider Support
- **Ollama** - Local AI models
- **OpenRouter** - Access to various AI models via API
- **Custom APIs** - Connect to your own AI endpoints

### 💬 Chat Experience
- **Real-time streaming** responses
- **Conversation history** with persistent storage
- **Markdown rendering** with syntax highlighting
- **Image upload support** for vision-capable models
- **Responsive design** for desktop and mobile
- **Dark theme** interface

### 🛠️ Advanced Features
- **Provider switching** without losing conversations
- **Model selection** per provider
- **Connection testing** for all providers
- **Message metadata** (provider, model, response time, tokens)
- **Code highlighting** with copy-to-clipboard functionality
- **Chat deletion** with confirmation modal

## 🚀 Quick Start

### Option 1: Use Hosted Version
Visit the live demo at: `https://astrixity.github.io/LLMe` *(Note: Ollama requires local setup due to CORS)*

### Option 2: Local Development
1. **Clone or download** this repository
2. **Open** `index.html` in your browser
3. **Configure** your AI provider in settings

## 📋 Prerequisites

Choose one of the following AI providers:

### For Ollama (Local)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama2

# For web access, set CORS headers
export OLLAMA_ORIGINS="*"
ollama serve
```

### For OpenRouter
1. Sign up at [OpenRouter](https://openrouter.ai)
2. Get your API key from [openrouter.ai/keys](https://openrouter.ai/keys)
3. Add credit to your account

### For Custom APIs
- Ensure your API endpoint supports OpenAI-compatible format
- Have your API key ready (if required)

## 🔧 Configuration

### Provider Setup

#### Ollama Configuration
```
Base URL: http://localhost:11434 (default)
Models: Automatically loaded from your local Ollama installation
```

#### OpenRouter Configuration
```
Base URL: https://openrouter.ai/api/v1 (default)
API Key: Your OpenRouter API key
Models: Automatically loaded from OpenRouter
```

#### Custom API Configuration
```
Base URL: Your custom API endpoint
API Key: Your API key (optional)
Model: Your model identifier
```

### CORS Issues (Ollama)
If using the hosted version with Ollama, you may encounter CORS errors. Solutions:

1. **Recommended**: Download and run locally
2. **Configure Ollama CORS**:
   ```bash
   export OLLAMA_ORIGINS="https://astrixity.github.io"
   ollama serve
   ```
3. **Local development**:
   ```bash
   export OLLAMA_ORIGINS="*"
   ollama serve
   ```

## 📁 Project Structure

```
LLMe/
├── index.html              # Main HTML file
├── styles.css              # Styling and layout
├── script.js               # Main application logic
├── favicon.ico             # Site icon
├── Liter-Regular.ttf       # Custom font
├── README.md               # This file
└── docs/                   # Documentation files
    ├── MARKDOWN_SUPPORT.md
    ├── VISION_SUPPORT.md
    ├── STREAMING_FIX.md
    └── METADATA_FIX.md
```

## 🎨 UI Components

### Sidebar
- **New Chat** button
- **Chat History** with delete options
- **User Profile** section

### Main Chat Area
- **Model Selector** with refresh option
- **Message Display** with markdown rendering
- **Typing Indicators** during responses
- **Image Display** for uploaded files

### Input Area
- **Multi-line text input** with auto-resize
- **Image Upload** button
- **Settings** modal access
- **Send** button with state management

## 🔌 API Integration

### Supported Endpoints

#### Ollama API
```javascript
POST /api/chat
{
  "model": "llama2",
  "messages": [...],
  "stream": true
}
```

#### OpenRouter API
```javascript
POST /chat/completions
{
  "model": "openai/gpt-3.5-turbo",
  "messages": [...],
  "stream": true
}
```

#### Custom APIs
Compatible with OpenAI format or similar streaming APIs.

## 🛡️ Privacy & Security

- **Local Storage**: Conversations stored in browser's localStorage
- **No Data Collection**: No analytics or tracking
- **API Keys**: Stored locally, never transmitted except to chosen provider
- **HTTPS Ready**: Works with secure connections

## 🐛 Troubleshooting

### Common Issues

#### Favicon Not Showing
- **Clear browser cache**: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- **Check file**: Ensure `favicon.ico` exists in root directory
- **Hard refresh**: Close tab and reopen

#### CORS Errors with Ollama
```
Error: Access to fetch at 'http://localhost:11434' blocked by CORS policy
```
**Solution**: Configure Ollama CORS headers or run locally

#### Models Not Loading
1. **Check connection**: Use "Test Connection" button
2. **Verify credentials**: Ensure API keys are correct  
3. **Check provider status**: Ensure service is running

#### Streaming Issues
- **Network**: Check internet connection
- **Provider**: Verify provider supports streaming
- **Browser**: Try different browser or incognito mode

## 🔄 Development

### Code Structure
- **`ChatApp` class**: Main application controller
- **Event-driven**: Uses addEventListener for user interactions
- **Modular design**: Separate methods for each feature
- **Error handling**: Comprehensive try-catch blocks

### Key Methods
- `sendMessage()`: Handles message sending and AI responses
- `renderMessages()`: Updates chat display with markdown
- `handleStreamingResponse()`: Processes real-time AI responses
- `loadModelsForCurrentProvider()`: Fetches available models

### Customization
- **Themes**: Modify `styles.css` for different color schemes
- **Providers**: Add new providers in the settings modal
- **Features**: Extend functionality in `script.js`

## 📊 Browser Support

- ✅ **Chrome** 80+
- ✅ **Firefox** 75+
- ✅ **Safari** 13+
- ✅ **Edge** 80+

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Marked.js** - Markdown parsing
- **Highlight.js** - Code syntax highlighting
- **Font Awesome** - Icons
- **Ollama Team** - Local AI model serving
- **OpenRouter** - AI model API access

## 📞 Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Documentation**: Check the `docs/` folder for detailed guides
- **Community**: Join discussions in the repository

---

<div align="center">

**Made with ❤️ for the AI community**

[🌟 Star this repo](../../stargazers) | [🐛 Report bugs](../../issues) | [💡 Request features](../../issues)

</div>
