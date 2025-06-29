class ChatApp {
    constructor() {
        this.conversations = [];
        this.currentConversationId = null;
        this.messageId = 0;
        this.settings = {
            provider: 'ollama',
            ollamaUrl: 'http://localhost:11434',
            openrouterKey: '',
            openrouterUrl: 'https://openrouter.ai/api/v1',
            customUrl: '',
            customKey: '',
            customModel: '',
            model: ''
        };
        this.providerModels = {
            ollama: [],
            openrouter: [],
            custom: []
        };
        this.modelsLoading = false;
        this.hasConnectionError = false;
        this.uploadedImages = [];
        this.conversationToDelete = null;
        this.chatItemToDelete = null;
        this.streamingMessageId = null; // Track which message is currently streaming
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadSettings();
        this.loadConversations();
        this.adjustTextareaHeight();
        this.updateProviderFieldsVisibility();  // Initialize provider visibility
        this.initializeMarkdown(); // Initialize markdown parser
        // Load models after settings are loaded to ensure correct provider is used
        // Use setTimeout to ensure DOM is fully ready
        setTimeout(() => {
            console.log(`Loading models for provider: ${this.settings.provider}`);
            this.loadModelsForCurrentProvider();
        }, 100);
    }

    initializeElements() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.chatHistory = document.getElementById('chatHistory');
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.modelSelect = document.getElementById('modelSelect');
        this.providerSelect = document.getElementById('providerSelect');
        this.refreshModelsBtn = document.getElementById('refreshModelsBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettings = document.getElementById('closeSettings');
        this.saveSettingsBtn = document.getElementById('saveSettings');
        this.cancelSettings = document.getElementById('cancelSettings');
        this.testConnection = document.getElementById('testConnection');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.chatContainer = document.getElementById('chatContainer');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.imageUpload = document.getElementById('imageUpload');
        this.uploadedImagesContainer = document.getElementById('uploadedImages');
        this.deleteModal = document.getElementById('deleteModal');
        this.confirmDelete = document.getElementById('confirmDelete');
        this.cancelDelete = document.getElementById('cancelDelete');
        
        // Settings inputs
        this.ollamaUrl = document.getElementById('ollamaUrl');
        this.openrouterKey = document.getElementById('openrouterKey');
        this.openrouterUrl = document.getElementById('openrouterUrl');
        this.customUrl = document.getElementById('customUrl');
        this.customKey = document.getElementById('customKey');
        this.customModel = document.getElementById('customModel');

        // Debug: Check if critical elements exist
        console.log('Critical elements check:');
        console.log('messageInput:', this.messageInput ? 'found' : 'NOT FOUND');
        console.log('sendBtn:', this.sendBtn ? 'found' : 'NOT FOUND');
        console.log('chatMessages:', this.chatMessages ? 'found' : 'NOT FOUND');
        console.log('modelSelect:', this.modelSelect ? 'found' : 'NOT FOUND');
    }

    initializeMarkdown() {
        // Configure marked.js for better formatting
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,
                gfm: true,
                highlight: function(code, lang) {
                    if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
                        try {
                            return hljs.highlight(code, { language: lang }).value;
                        } catch (err) {
                            console.warn('Highlight.js error:', err);
                        }
                    }
                    return code;
                }
            });
        }
    }

    setupEventListeners() {
        // Sidebar toggle
        this.sidebarToggle.addEventListener('click', () => {
            this.sidebar.classList.toggle('open');
        });

        // New chat button
        this.newChatBtn.addEventListener('click', () => {
            this.createNewConversation();
        });

        // Message input
        this.messageInput.addEventListener('input', () => {
            this.adjustTextareaHeight();
            this.updateSendButton();
        });

        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Send button
        this.sendBtn.addEventListener('click', () => {
            console.log('Send button clicked!'); // Debug log
            this.sendMessage();
        });

        // Provider selection
        this.providerSelect.addEventListener('change', () => {
            this.settings.provider = this.providerSelect.value;
            this.updateProviderFieldsVisibility();
            this.loadModelsForCurrentProvider();
            this.saveSettings();
        });

        // Model selection
        this.modelSelect.addEventListener('change', () => {
            this.settings.model = this.modelSelect.value;
            this.saveSettings();
        });

        // Refresh models button
        this.refreshModelsBtn.addEventListener('click', () => {
            this.refreshModels();
        });

        // Settings modal
        this.settingsBtn.addEventListener('click', () => {
            this.openSettingsModal();
        });

        this.closeSettings.addEventListener('click', () => {
            this.closeSettingsModal();
        });

        this.cancelSettings.addEventListener('click', () => {
            this.closeSettingsModal();
        });

        this.saveSettingsBtn.addEventListener('click', () => {
            this.saveSettingsFromModal();
        });

        this.testConnection.addEventListener('click', () => {
            this.testProviderConnection();
        });

        // Close modal on overlay click
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettingsModal();
            }
        });

        // Example prompts
        document.addEventListener('click', (e) => {
            if (e.target.closest('.prompt-card')) {
                const prompt = e.target.closest('.prompt-card').dataset.prompt;
                this.messageInput.value = prompt;
                this.updateSendButton();
                this.adjustTextareaHeight();
                this.messageInput.focus();
            }
        });

        // Chat history clicks
        this.chatHistory.addEventListener('click', (e) => {
            // Ignore clicks on delete buttons
            if (e.target.closest('.delete-chat-btn')) {
                return;
            }
            
            if (e.target.closest('.chat-item')) {
                const conversationId = e.target.closest('.chat-item').dataset.id;
                this.loadConversation(conversationId);
            }
        });

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.adjustTextareaHeight();
        });

        // Image upload
        this.uploadBtn.addEventListener('click', () => {
            this.imageUpload.click();
        });

        this.imageUpload.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // Delete modal
        this.cancelDelete.addEventListener('click', () => {
            this.hideDeleteModal();
        });

        this.confirmDelete.addEventListener('click', () => {
            this.confirmChatDeletion();
        });

        // Close delete modal on overlay click
        this.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.deleteModal) {
                this.hideDeleteModal();
            }
        });
    }

    adjustTextareaHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 200) + 'px';
    }

    updateSendButton() {
        const hasText = this.messageInput.value.trim().length > 0;
        const hasImages = this.uploadedImages.length > 0;
        this.sendBtn.disabled = !hasText && !hasImages;
    }

    updateSettingsButtonState() {
        if (this.hasConnectionError) {
            this.settingsBtn.classList.add('connection-error');
        } else {
            this.settingsBtn.classList.remove('connection-error');
        }
    }

    async handleImageUpload(event) {
        const files = Array.from(event.target.files);
        
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                const imageData = await this.processImage(file);
                if (imageData) {
                    this.uploadedImages.push(imageData);
                }
            }
        }
        
        this.displayUploadedImages();
        this.updateSendButton();
        
        // Clear the file input
        event.target.value = '';
    }

    async processImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Create canvas to resize image if needed
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Max dimensions for uploaded images
                    const maxWidth = 1024;
                    const maxHeight = 1024;
                    
                    let { width, height } = img;
                    
                    // Calculate new dimensions if image is too large
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width *= ratio;
                        height *= ratio;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw and compress
                    ctx.drawImage(img, 0, 0, width, height);
                    const base64 = canvas.toDataURL('image/jpeg', 0.8);
                    
                    resolve({
                        id: Date.now() + Math.random(),
                        name: file.name,
                        type: file.type,
                        base64: base64,
                        size: file.size
                    });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    displayUploadedImages() {
        if (this.uploadedImages.length === 0) {
            this.uploadedImagesContainer.style.display = 'none';
            return;
        }

        this.uploadedImagesContainer.style.display = 'flex';
        this.uploadedImagesContainer.innerHTML = '';

        this.uploadedImages.forEach(image => {
            const imageDiv = document.createElement('div');
            imageDiv.className = 'uploaded-image';
            imageDiv.innerHTML = `
                <img src="${image.base64}" alt="${image.name}" title="${image.name}">
                <button class="remove-image" onclick="chatApp.removeUploadedImage('${image.id}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
            this.uploadedImagesContainer.appendChild(imageDiv);
        });
    }

    removeUploadedImage(imageId) {
        this.uploadedImages = this.uploadedImages.filter(img => img.id !== imageId);
        this.displayUploadedImages();
        this.updateSendButton();
    }

    createNewConversation() {
        const conversation = {
            id: Date.now().toString(),
            title: 'New chat',
            messages: [],
            timestamp: new Date()
        };

        this.conversations.unshift(conversation);
        this.currentConversationId = conversation.id;
        this.saveConversations();
        this.renderChatHistory();
        this.renderMessages();
        this.hideWelcomeSection();
        
        // Add animation to the new chat item
        setTimeout(() => {
            const newChatItem = document.querySelector(`[data-id="${conversation.id}"]`);
            if (newChatItem) {
                newChatItem.classList.add('new-chat');
                // Remove the animation class after animation completes
                setTimeout(() => {
                    newChatItem.classList.remove('new-chat');
                }, 300);
            }
        }, 10);
    }

    async sendMessage() {
        console.log('sendMessage called'); // Debug log
        const text = this.messageInput.value.trim();
        const hasImages = this.uploadedImages.length > 0;
        
        console.log('Text:', text, 'HasImages:', hasImages); // Debug log
        
        if (!text && !hasImages) {
            console.log('No text or images, returning early'); // Debug log
            return;
        }

        // Check if model is selected
        if (!this.settings.model) {
            console.log('No model selected'); // Debug log
            alert('Please select a model first. You may need to refresh the models list or check your provider settings.');
            return;
        }

        console.log('Model selected:', this.settings.model); // Debug log


        // Ensure a conversation exists before proceeding
        if (!this.currentConversationId) {
            console.log('Creating new conversation'); // Debug log
            this.createNewConversation();
        }

        // Always re-fetch after possible creation
        let conversation = this.conversations.find(c => c.id === this.currentConversationId);
        if (!conversation) {
            // Try one more time in case the array hasn't updated yet
            this.createNewConversation();
            conversation = this.conversations.find(c => c.id === this.currentConversationId);
            if (!conversation) {
                alert('Failed to create or find a conversation. Please try again.');
                return;
            }
        }

        console.log('Conversation found:', conversation.id); // Debug log

        // Add user message
        const userMessage = {
            id: this.messageId++,
            role: 'user',
            content: text,
            images: hasImages ? [...this.uploadedImages] : null,
            timestamp: new Date()
        };

        console.log('Adding user message:', userMessage); // Debug log
        conversation.messages.push(userMessage);

        // Update conversation title if it's the first message
        if (conversation.messages.length === 1) {
            conversation.title = this.generateTitle(text);
        }

        // Clear input and uploaded images
        this.messageInput.value = '';
        this.uploadedImages = [];
        this.displayUploadedImages();
        this.adjustTextareaHeight();
        this.updateSendButton();

        console.log('About to render messages'); // Debug log
        // Render messages
        this.renderMessages();
        this.hideWelcomeSection();

        console.log('About to show typing indicator'); // Debug log
        // Show typing indicator
        this.showTypingIndicator();

        console.log('About to get AI response'); // Debug log
        // Get AI response
        try {
            await this.getAIResponse(conversation);
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.hideTypingIndicator();
            this.streamingMessageId = null; // Clear streaming state on error
            // Remove the empty AI message that was added in getAIResponse
            const lastMessage = conversation.messages[conversation.messages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.content.trim()) {
                conversation.messages.pop();
            }
            let errorMessage = error.message;
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = `Cannot connect to ${this.settings.provider}. Please check your connection and provider settings.`;
            }
            const errorResponse = {
                id: this.messageId++,
                role: 'assistant',
                content: `❌ **Error**: ${errorMessage}\n\nPlease check:\n- Your provider settings\n- Internet connection\n- API key (if using OpenRouter)\n- That your chosen model is available`,
                timestamp: new Date(),
                metadata: {
                    provider: this.settings.provider,
                    model: this.settings.model,
                    startTime: Date.now(),
                    endTime: Date.now(),
                    responseTime: 0,
                    tokens: 0
                }
            };
            conversation.messages.push(errorResponse);
            this.renderMessages();
        }

        this.saveConversations();
        this.renderChatHistory();
        console.log('sendMessage completed'); // Debug log
    }

    simulateAIResponse(conversation) {
        const responses = [
            "I'm a demo AI assistant created for this ChatGPT-like interface. In a real implementation, this would connect to an actual AI API like OpenAI's GPT-4.",
            "This is a demonstration response. The interface mimics ChatGPT's design, but responses are simulated. You would need to integrate with a real AI service for actual functionality.",
            "Hello! I'm simulating an AI response for this demo. The UI captures the look and feel of ChatGPT, including the typing animation and message formatting.",
            "This interface demonstrates a ChatGPT-like experience. In production, you'd connect this to a real language model API to provide actual AI responses.",
            "I understand you're testing this ChatGPT-style interface. The design includes features like conversation history, responsive layout, and smooth animations - all working in a static frontend!"
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];

        const aiMessage = {
            id: this.messageId++,
            role: 'assistant',
            content: response,
            timestamp: new Date()
        };

        conversation.messages.push(aiMessage);
        this.hideTypingIndicator();
        this.renderMessages();
        this.saveConversations();
    }

    async getAIResponse(conversation) {
        // Collect all images from the conversation for Ollama
        let ollamaImages = [];
        
        const messages = conversation.messages.map(msg => {
            const message = {
                role: msg.role,
                content: msg.content || ''
            };

            // Add images if present (for vision-capable models)
            if (msg.images && msg.images.length > 0) {
                if (this.settings.provider === 'ollama') {
                    // For Ollama, collect images to be sent at request level
                    // Extract base64 data without the data URL prefix
                    msg.images.forEach(img => {
                        let base64Data = img.base64;
                        // Remove data URL prefix if present (data:image/jpeg;base64,)
                        if (base64Data.startsWith('data:')) {
                            base64Data = base64Data.split(',')[1];
                        }
                        ollamaImages.push(base64Data);
                    });
                    console.log(`Ollama: Collected ${msg.images.length} image(s) from message`);
                } else if (this.settings.provider === 'openrouter' || this.settings.provider === 'custom') {
                    // For OpenRouter and Custom APIs that support vision (OpenAI format)
                    message.content = [
                        {
                            type: 'text',
                            text: msg.content || ''
                        },
                        ...msg.images.map(img => ({
                            type: 'image_url',
                            image_url: {
                                url: img.base64
                            }
                        }))
                    ];
                }
            }

            return message;
        });

        // Create AI message placeholder with metadata
        const responseStartTime = Date.now();
        const aiMessage = {
            id: this.messageId++,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            metadata: {
                provider: this.settings.provider,
                model: this.settings.model,
                startTime: responseStartTime,
                endTime: null,
                responseTime: null,
                tokens: 0
            }
        };

        conversation.messages.push(aiMessage);
        this.hideTypingIndicator();
        this.streamingMessageId = aiMessage.id; // Mark this message as streaming
        this.renderMessages(); // Show empty AI message

        let response;
        
        if (this.settings.provider === 'ollama') {
            response = await this.callOllama(messages, ollamaImages);
            await this.handleStreamingResponse(response, aiMessage, conversation, 'ollama');
        } else if (this.settings.provider === 'openrouter') {
            response = await this.callOpenRouter(messages);
            await this.handleStreamingResponse(response, aiMessage, conversation, 'openrouter');
        } else if (this.settings.provider === 'custom') {
            response = await this.callCustomAPI(messages);
            if (typeof response === 'string') {
                // Non-streaming custom API
                aiMessage.content = response;
                // Finalize metadata for non-streaming response
                const endTime = Date.now();
                if (aiMessage.metadata) {
                    aiMessage.metadata.endTime = endTime;
                    aiMessage.metadata.responseTime = endTime - aiMessage.metadata.startTime;
                    aiMessage.metadata.tokens = this.estimateTokens(aiMessage.content);
                }
                this.streamingMessageId = null; // Clear streaming state
                this.renderMessages();
            } else {
                // Streaming custom API
                await this.handleStreamingResponse(response, aiMessage, conversation, 'custom');
            }
        } else {
            throw new Error('Unknown provider');
        }

        this.saveConversations();
    }

    async handleStreamingResponse(response, aiMessage, conversation, provider) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let lastUpdateTime = 0;
        const UPDATE_THROTTLE = 50; // Throttle for streaming updates (50ms for responsiveness)
        let pendingUpdate = false;

        try {
            let totalChunks = 0;
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    break;
                }
                
                totalChunks++;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                
                // Keep the last incomplete line in buffer
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.trim() === '') continue;
                    
                    try {
                        let content = '';
                        
                        if (provider === 'ollama') {
                            // Ollama format: {"message": {"content": "text"}}
                            if (line.startsWith('data: ')) {
                                const jsonStr = line.slice(6);
                                if (jsonStr.trim() === '[DONE]') break;
                                const data = JSON.parse(jsonStr);
                                content = data.message?.content || '';
                            } else {
                                const data = JSON.parse(line);
                                content = data.message?.content || '';
                                
                                // Check if response is done
                                if (data.done) break;
                            }
                        } else if (provider === 'openrouter' || provider === 'custom') {
                            // OpenAI format: data: {"choices": [{"delta": {"content": "text"}}]}
                            if (line.startsWith('data: ')) {
                                const jsonStr = line.slice(6);
                                if (jsonStr.trim() === '[DONE]') break;
                                const data = JSON.parse(jsonStr);
                                content = data.choices?.[0]?.delta?.content || '';
                            }
                        }
                        
                        if (content) {
                            aiMessage.content += content;
                            
                            // Use renderMessages for streaming to ensure content appears
                            const now = Date.now();
                            if (now - lastUpdateTime > UPDATE_THROTTLE && !pendingUpdate) {
                                pendingUpdate = true;
                                requestAnimationFrame(() => {
                                    this.renderMessages();
                                    this.smoothScrollToBottom();
                                    lastUpdateTime = Date.now();
                                    pendingUpdate = false;
                                });
                            }
                        }
                    } catch (e) {
                        // Skip malformed JSON lines
                        console.warn('Failed to parse streaming response line:', line, e);
                    }
                }
            }
            
            // Final update to ensure all content is rendered
            this.updateStreamingMessage(aiMessage);
            this.smoothScrollToBottom();
            
            // Finalize response metadata
            const endTime = Date.now();
            if (aiMessage.metadata) {
                aiMessage.metadata.endTime = endTime;
                aiMessage.metadata.responseTime = endTime - aiMessage.metadata.startTime;
                aiMessage.metadata.tokens = this.estimateTokens(aiMessage.content);
            }
            
            // Clear streaming state and re-render with full markdown formatting
            this.streamingMessageId = null;
            this.renderMessages();
            console.log('Metadata finalized:', aiMessage.metadata);
            
        } catch (error) {
            console.error('Error reading stream:', error);
            throw error;
        } finally {
            reader.releaseLock();
        }

        // Ensure the message has content
        if (!aiMessage.content.trim()) {
            aiMessage.content = 'Error: No response received from the AI service.';
            if (aiMessage.metadata) {
                aiMessage.metadata.endTime = Date.now();
                aiMessage.metadata.responseTime = aiMessage.metadata.endTime - aiMessage.metadata.startTime;
            }
            this.streamingMessageId = null; // Clear streaming state
            this.renderMessages();
        }
    }

    // Simple token estimation (approximate)
    estimateTokens(text) {
        if (!text) return 0;
        // Rough estimation: 1 token ≈ 4 characters for English text
        // This is a simplification but gives a reasonable estimate
        return Math.ceil(text.length / 4);
    }

    async callOllama(messages, images = []) {
        const requestBody = {
            model: this.settings.model,
            messages: messages,
            stream: true
        };

        // Add images array if there are any images (for vision models like Llava3)
        if (images && images.length > 0) {
            requestBody.images = images;
            console.log(`Ollama: Sending ${images.length} image(s) to vision model ${this.settings.model}`);
        }

        try {
            const response = await fetch(`${this.settings.ollamaUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }

            return response;
        } catch (error) {
            if (error.message.includes('CORS') || error.name === 'TypeError') {
                throw new Error(`CORS error: Cannot access Ollama from web browser.

To fix this issue:
1. Download and run this app locally (recommended)
2. Configure Ollama to allow web access:
   - Set environment variable: OLLAMA_ORIGINS=https://astrixity.github.io
   - Or restart with: ollama serve --origins https://astrixity.github.io
3. For local development: OLLAMA_ORIGINS=*

The web browser blocks cross-origin requests for security reasons.`);
            }
            throw error;
        }
    }

    async callOpenRouter(messages) {
        if (!this.settings.openrouterKey) {
            throw new Error('OpenRouter API key is required');
        }

        const response = await fetch(`${this.settings.openrouterUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.settings.openrouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'LLMe Chat Interface'
            },
            body: JSON.stringify({
                model: this.settings.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000,
                stream: true
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        return response;
    }

    async callCustomAPI(messages) {
        if (!this.settings.customUrl) {
            throw new Error('Custom API URL is required');
        }

        if (!this.settings.customModel) {
            throw new Error('Custom model name is required');
        }

        const headers = {
            'Content-Type': 'application/json'
        };

        // Add API key if provided
        if (this.settings.customKey) {
            headers['Authorization'] = `Bearer ${this.settings.customKey}`;
        }

        const response = await fetch(`${this.settings.customUrl}/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: this.settings.customModel,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000,
                stream: true
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Custom API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        // Check if the API supports streaming by looking at content-type
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json') && !contentType.includes('stream')) {
            // Non-streaming response - fallback to regular parsing
            const data = await response.json();
            return data.choices[0].message.content;
        }

        return response;
    }

    async testProviderConnection() {
        const testBtn = this.testConnection;
        const status = this.connectionStatus;
        
        testBtn.disabled = true;
        testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
        status.className = 'connection-status testing';
        status.textContent = 'Testing connection...';

        try {
            let success = false;
            
            if (this.settings.provider === 'ollama') {
                try {
                    const response = await fetch(`${this.settings.ollamaUrl}/api/tags`);
                    success = response.ok;
                    if (success) {
                        await this.loadOllamaModels();
                    }
                } catch (error) {
                    if (error.message.includes('CORS') || error.name === 'TypeError') {
                        throw new Error(`CORS error: Cannot access Ollama from web browser. 
                        
Solutions:
1. Download and run this app locally (recommended)
2. Use a browser extension to disable CORS (not recommended for security)
3. Run Ollama with CORS enabled: 
   - Set environment variable: OLLAMA_ORIGINS=https://astrixity.github.io
   - Or use: ollama serve --origins https://astrixity.github.io

For local development, you can also set OLLAMA_ORIGINS=* (allows all origins)`);
                    }
                    throw error;
                }
            } else if (this.settings.provider === 'openrouter') {
                if (!this.settings.openrouterKey) {
                    throw new Error('API key is required for OpenRouter');
                }
                
                const response = await fetch(`${this.settings.openrouterUrl}/models`, {
                    headers: {
                        'Authorization': `Bearer ${this.settings.openrouterKey}`
                    }
                });
                success = response.ok;
                if (success) {
                    await this.loadOpenRouterModels();
                }
            } else if (this.settings.provider === 'custom') {
                if (!this.settings.customUrl) {
                    throw new Error('Custom API URL is required');
                }
                
                const headers = { 'Content-Type': 'application/json' };
                if (this.settings.customKey) {
                    headers['Authorization'] = `Bearer ${this.settings.customKey}`;
                }
                
                const response = await fetch(`${this.settings.customUrl}/models`, {
                    headers: headers
                });
                success = response.ok;
                if (success) {
                    await this.loadCustomModels();
                }
            }

            if (success) {
                status.className = 'connection-status success';
                status.textContent = '✓ Connection successful! Models loaded.';
                this.updateModelOptions();
                // Clear connection error on successful test
                this.hasConnectionError = false;
                this.updateSettingsButtonState();
            } else {
                throw new Error('Connection failed');
            }
        } catch (error) {
            status.className = 'connection-status error';
            status.textContent = `✗ Connection failed: ${error.message}`;
            // Set connection error flag on failed test
            this.hasConnectionError = true;
            this.updateSettingsButtonState();
        } finally {
            testBtn.disabled = false;
            testBtn.innerHTML = '<i class="fas fa-plug"></i> Test Connection';
        }
    }

    async loadModelsForCurrentProvider() {
        if (this.modelsLoading) return;
        
        this.modelsLoading = true;
        this.updateModelOptions(); // Show loading state
        
        try {
            // Clear any existing models for current provider to force refresh
            this.providerModels[this.settings.provider] = [];
            
            if (this.settings.provider === 'ollama') {
                await this.loadOllamaModels();
            } else if (this.settings.provider === 'openrouter') {
                await this.loadOpenRouterModels();
            } else if (this.settings.provider === 'custom') {
                await this.loadCustomModels();
            }
            
            // Reset loading state before updating options
            this.modelsLoading = false;
            console.log(`Models loaded for ${this.settings.provider}:`, this.providerModels[this.settings.provider]);
            this.updateModelOptions();
            
            // Clear connection error on successful load
            this.hasConnectionError = false;
            this.updateSettingsButtonState();
            
            console.log(`Successfully loaded ${this.providerModels[this.settings.provider].length} models for ${this.settings.provider}`);
        } catch (error) {
            console.warn(`Failed to load models for ${this.settings.provider}:`, error);
            // Reset loading state on error too
            this.modelsLoading = false;
            // Show error in model selector
            this.modelSelect.innerHTML = `<option value="">Error loading models: ${error.message}</option>`;
            this.modelSelect.disabled = false;
            // Set connection error flag and update button state
            this.hasConnectionError = true;
            this.updateSettingsButtonState();
        }
    }

    async loadOllamaModels() {
        try {
            const response = await fetch(`${this.settings.ollamaUrl}/api/tags`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.providerModels.ollama = data.models?.map(model => model.name) || [];
            
            // Sort models alphabetically
            this.providerModels.ollama.sort();
        } catch (error) {
            console.error('Failed to load Ollama models:', error);
            this.providerModels.ollama = [];
            
            if (error.message.includes('CORS') || error.name === 'TypeError') {
                throw new Error(`CORS error: Cannot access Ollama from web browser.

To fix this issue:
1. Download and run this app locally (recommended)
2. Configure Ollama to allow web access:
   - Set OLLAMA_ORIGINS=https://astrixity.github.io
   - Or restart Ollama with: ollama serve --origins https://astrixity.github.io
3. For local development: OLLAMA_ORIGINS=*

Note: Web browsers block cross-origin requests for security.`);
            }
            
            throw new Error(`Cannot connect to Ollama at ${this.settings.ollamaUrl}. Make sure Ollama is running and accessible.`);
        }
    }

    async loadOpenRouterModels() {
        if (!this.settings.openrouterKey) {
            this.providerModels.openrouter = [];
            throw new Error('OpenRouter API key is required');
        }

        try {
            const response = await fetch(`${this.settings.openrouterUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.settings.openrouterKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            this.providerModels.openrouter = data.data?.map(model => model.id) || [];
            
            // Sort models alphabetically
            this.providerModels.openrouter.sort();
        } catch (error) {
            console.error('Failed to load OpenRouter models:', error);
            this.providerModels.openrouter = [];
            throw new Error(`Cannot connect to OpenRouter API. Check your API key and connection.`);
        }
    }

    async loadCustomModels() {
        if (!this.settings.customUrl) {
            this.providerModels.custom = [];
            throw new Error('Custom API URL is required');
        }

        try {
            const headers = { 'Content-Type': 'application/json' };
            if (this.settings.customKey) {
                headers['Authorization'] = `Bearer ${this.settings.customKey}`;
            }

            const response = await fetch(`${this.settings.customUrl}/models`, {
                headers: headers
            });

            if (!response.ok) {
                // If /models endpoint doesn't exist, use the manually configured model
                if (this.settings.customModel) {
                    this.providerModels.custom = [this.settings.customModel];
                    return;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.providerModels.custom = data.data?.map(model => model.id) || [];
            
            // If no models from API but we have a configured model, use it
            if (this.providerModels.custom.length === 0 && this.settings.customModel) {
                this.providerModels.custom = [this.settings.customModel];
            }
            
            // Sort models alphabetically
            this.providerModels.custom.sort();
        } catch (error) {
            console.error('Failed to load custom models:', error);
            // Fallback to manually configured model if available
            if (this.settings.customModel) {
                this.providerModels.custom = [this.settings.customModel];
            } else {
                this.providerModels.custom = [];
                throw new Error(`Cannot connect to custom API. Check your URL and settings.`);
            }
        }
    }

    updateModelOptions() {
        const models = this.providerModels[this.settings.provider] || [];
        console.log(`updateModelOptions called - provider: ${this.settings.provider}, modelsLoading: ${this.modelsLoading}, models:`, models);
        
        if (this.modelsLoading) {
            const providerName = this.settings.provider.charAt(0).toUpperCase() + this.settings.provider.slice(1);
            this.modelSelect.innerHTML = `<option value="">Loading ${providerName} models...</option>`;
            this.modelSelect.disabled = true;
            return;
        }
        
        this.modelSelect.disabled = false;
        this.modelSelect.innerHTML = '';
        
        if (models.length === 0) {
            let placeholderText = 'No models available';
            if (this.settings.provider === 'ollama') {
                placeholderText = 'No models found - pull models with: ollama pull llama2';
            } else if (this.settings.provider === 'openrouter') {
                placeholderText = 'No models available - check your API key';
            } else if (this.settings.provider === 'custom') {
                placeholderText = 'Configure your custom model in settings';
            }
            this.modelSelect.innerHTML = `<option value="">${placeholderText}</option>`;
            return;
        }
        
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = this.formatModelName(model);
            this.modelSelect.appendChild(option);
        });

        // Set current model or first available
        if (models.includes(this.settings.model)) {
            this.modelSelect.value = this.settings.model;
        } else if (models.length > 0) {
            this.settings.model = models[0];
            this.modelSelect.value = models[0];
            this.saveSettings();
        }
    }

    async refreshModels() {
        if (this.modelsLoading) return;
        
        this.refreshModelsBtn.disabled = true;
        this.refreshModelsBtn.classList.add('loading');
        
        try {
            // Clear current models to force reload
            this.providerModels[this.settings.provider] = [];
            
            // Use the same logic as test connection for loading models
            if (this.settings.provider === 'ollama') {
                await this.loadOllamaModels();
            } else if (this.settings.provider === 'openrouter') {
                if (!this.settings.openrouterKey) {
                    throw new Error('API key is required for OpenRouter');
                }
                await this.loadOpenRouterModels();
            } else if (this.settings.provider === 'custom') {
                if (!this.settings.customUrl) {
                    throw new Error('Custom API URL is required');
                }
                await this.loadCustomModels();
            }
            
            // Update the model options after successful load
            this.updateModelOptions();
            
            // Clear connection error on successful refresh
            this.hasConnectionError = false;
            this.updateSettingsButtonState();
            
        } catch (error) {
            console.error('Error refreshing models:', error);
            // Show error in model selector
            this.modelSelect.innerHTML = `<option value="">Error loading models: ${error.message}</option>`;
            this.modelSelect.disabled = false;
            // Set connection error flag on failed refresh
            this.hasConnectionError = true;
            this.updateSettingsButtonState();
        } finally {
            this.refreshModelsBtn.disabled = false;
            this.refreshModelsBtn.classList.remove('loading');
        }
    }

    formatModelName(modelId) {
        // For OpenRouter models, clean up the display name
        if (this.settings.provider === 'openrouter') {
            return modelId.replace(/^[^\/]+\//, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
        return modelId;
    }

    updateProviderFieldsVisibility() {
        // Hide all provider-specific sections first
        const providerSections = {
            ollama: document.querySelectorAll('.provider-ollama'),
            openrouter: document.querySelectorAll('.provider-openrouter'),
            custom: document.querySelectorAll('.provider-custom')
        };

        // Hide all sections
        Object.values(providerSections).forEach(sections => {
            sections.forEach(section => {
                section.classList.remove('show');
            });
        });

        // Show only the sections for the selected provider
        if (providerSections[this.settings.provider]) {
            providerSections[this.settings.provider].forEach(section => {
                section.classList.add('show');
            });
        }

        // Make provider URLs read-only for non-custom providers and set defaults
        this.ollamaUrl.readOnly = true;
        this.openrouterUrl.readOnly = true;
        
        // Reset to default values for constant providers
        if (this.settings.provider === 'ollama') {
            this.ollamaUrl.value = 'http://localhost:11434';
            this.settings.ollamaUrl = 'http://localhost:11434';
        } else if (this.settings.provider === 'openrouter') {
            this.openrouterUrl.value = 'https://openrouter.ai/api/v1';
            this.settings.openrouterUrl = 'https://openrouter.ai/api/v1';
        }
    }

    openSettingsModal() {
        // Populate current settings
        this.ollamaUrl.value = this.settings.ollamaUrl;
        this.openrouterKey.value = this.settings.openrouterKey;
        this.openrouterUrl.value = this.settings.openrouterUrl;
        this.customUrl.value = this.settings.customUrl;
        this.customKey.value = this.settings.customKey;
        this.customModel.value = this.settings.customModel;
        this.providerSelect.value = this.settings.provider;
        
        this.updateProviderFieldsVisibility();
        this.connectionStatus.textContent = '';
        this.connectionStatus.className = 'connection-status';
        
        this.settingsModal.classList.add('show');
    }

    closeSettingsModal() {
        this.settingsModal.classList.remove('show');
    }

    saveSettingsFromModal() {
        this.settings.ollamaUrl = this.ollamaUrl.value.trim() || 'http://localhost:11434';
        this.settings.openrouterKey = this.openrouterKey.value.trim();
        this.settings.openrouterUrl = this.openrouterUrl.value.trim() || 'https://openrouter.ai/api/v1';
        this.settings.customUrl = this.customUrl.value.trim();
        this.settings.customKey = this.customKey.value.trim();
        this.settings.customModel = this.customModel.value.trim();
        this.settings.provider = this.providerSelect.value;
        
        this.loadModelsForCurrentProvider();
        this.saveSettings();
        this.closeSettingsModal();
    }

    saveSettings() {
        try {
            localStorage.setItem('aiProviderSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('aiProviderSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } else {
                // If no saved settings, save the defaults
                this.saveSettings();
            }
            
            // Update UI elements
            if (this.providerSelect) {
                this.providerSelect.value = this.settings.provider;
                this.updateProviderFieldsVisibility();  // Update visibility after loading settings
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
            // Save defaults on error
            this.saveSettings();
        }
    }

    showTypingIndicator() {
        const typingHtml = `
            <div class="message assistant-message typing-message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        
        this.chatMessages.insertAdjacentHTML('beforeend', typingHtml);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingMessage = this.chatMessages.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    renderMessages() {
        if (!this.currentConversationId) {
            this.showWelcomeSection();
            return;
        }

        const conversation = this.conversations.find(c => c.id === this.currentConversationId);
        if (!conversation) return;

        let html = '';
        conversation.messages.forEach(message => {
            const isUser = message.role === 'user';
            const avatarIcon = isUser ? 'fas fa-user' : 'fas fa-robot';
            const messageClass = isUser ? 'user-message' : 'assistant-message';

            let imagesHtml = '';
            if (message.images && message.images.length > 0) {
                imagesHtml = '<div class="message-images">';
                message.images.forEach(image => {
                    imagesHtml += `<img class="message-image" src="${image.base64}" alt="${image.name}" onclick="window.open(this.src, '_blank')">`;
                });
                imagesHtml += '</div>';
            }

            // Check if this message is currently streaming
            const isStreaming = !isUser && this.streamingMessageId === message.id;
            const streamingClass = isStreaming ? ' streaming' : '';
            
            // Always use markdown formatting, but handle streaming differently
            let contentHtml = '';
            if (message.content) {
                if (isStreaming) {
                    // During streaming: show current content with basic markdown, will be updated by updateStreamingContent
                    if (message.content) {
                        contentHtml = `<div class="message-text${streamingClass}">${this.renderStreamingMarkdown(message.content)}<span class="streaming-cursor"></span></div>`;
                    } else {
                        contentHtml = `<div class="message-text${streamingClass}"><span class="streaming-cursor"></span></div>`;
                    }
                } else {
                    // For completed messages: use full markdown formatting with syntax highlighting
                    contentHtml = `<div class="message-text${streamingClass}">${this.formatMessageContent(message.content)}</div>`;
                }
            }

            // Add metadata footer for AI responses
            let metadataHtml = '';
            if (!isUser && message.metadata) {
                const { provider, model, responseTime, tokens } = message.metadata;
                const formattedTime = this.formatResponseTime(responseTime);
                const providerDisplay = this.getProviderDisplayName(provider);
                
                console.log('Rendering metadata:', { provider, model, responseTime, tokens, formattedTime });
                
                metadataHtml = `
                    <div class="message-metadata">
                        <span class="metadata-item">
                            <i class="fas fa-robot"></i> ${model || 'Unknown'}
                        </span>
                        <span class="metadata-item">
                            <i class="fas fa-server"></i> ${providerDisplay}
                        </span>
                        <span class="metadata-item">
                            <i class="fas fa-coins"></i> ~${tokens || 0} tokens
                        </span>
                        <span class="metadata-item">
                            <i class="fas fa-clock"></i> ${formattedTime}
                        </span>
                    </div>
                `;
            } else if (!isUser) {
                console.log('No metadata found for AI message:', message);
            }

            html += `
                <div class="message ${messageClass}">
                    <div class="message-avatar">
                        <i class="${avatarIcon}"></i>
                    </div>
                    <div class="message-content">
                        ${imagesHtml}
                        ${contentHtml}
                        ${metadataHtml}
                    </div>
                </div>
            `;
        });

        this.chatMessages.innerHTML = html;
        this.scrollToBottom();
    }

    formatMessageContent(content) {
        if (!content) return '';
        
        // Use marked.js for full markdown support if available
        if (typeof marked !== 'undefined') {
            try {
                const htmlContent = marked.parse(content);
                // Highlight code blocks and add copy buttons if highlight.js is available
                if (typeof hljs !== 'undefined') {
                    // Use setTimeout to allow DOM to update before highlighting
                    setTimeout(() => {
                        const codeBlocks = document.querySelectorAll('pre code:not(.hljs)');
                        codeBlocks.forEach(block => {
                            hljs.highlightElement(block);
                            // Add copy button to pre element
                            const pre = block.parentElement;
                            if (pre && !pre.querySelector('.copy-btn')) {
                                const copyBtn = document.createElement('button');
                                copyBtn.className = 'copy-btn';
                                copyBtn.textContent = 'Copy';
                                copyBtn.onclick = () => this.copyCodeBlock(block, copyBtn);
                                pre.appendChild(copyBtn);
                            }
                        });
                    }, 10);
                }
                return htmlContent;
            } catch (error) {
                console.warn('Markdown parsing error:', error);
                // Fall back to basic formatting
                return this.basicFormatMessage(content);
            }
        }
        
        // Fallback to basic formatting if marked.js is not available
        return this.basicFormatMessage(content);
    }

    copyCodeBlock(codeElement, buttonElement) {
        const code = codeElement.textContent || codeElement.innerText;
        navigator.clipboard.writeText(code).then(() => {
            const originalText = buttonElement.textContent;
            buttonElement.textContent = 'Copied!';
            buttonElement.classList.add('copied');
            
            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy code:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                buttonElement.textContent = 'Copied!';
                buttonElement.classList.add('copied');
                setTimeout(() => {
                    buttonElement.textContent = 'Copy';
                    buttonElement.classList.remove('copied');
                }, 2000);
            } catch (fallbackErr) {
                console.error('Fallback copy failed:', fallbackErr);
            }
            document.body.removeChild(textArea);
        });
    }

    basicFormatMessage(content) {
        // Basic markdown-like formatting (fallback)
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    formatStreamingContent(content) {
        // Deprecated - use formatStreamingContentSimple instead
        return this.formatStreamingContentSimple(content);
    }

    formatBasicMarkdown(content) {
        // Simple markdown formatting for fallback
        return content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>')
            .replace(/<\/ul>\s*<ul>/g, ''); // Merge consecutive lists
    }

    // Helper method to escape HTML in renderer
    escape(html) {
        return html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    showWelcomeSection() {
        // Check if we're running from GitHub Pages and show CORS warning for Ollama
        const isGitHubPages = window.location.hostname.includes('github.io');
        const corsWarning = isGitHubPages ? `
            <div class="cors-warning" style="background: #ff6b6b; color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem;">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Note:</strong> Ollama won't work directly from this hosted version due to CORS restrictions. 
                <br><strong>Solutions:</strong>
                <br>• Download and run locally (recommended)
                <br>• Use OpenRouter or Custom API instead
                <br>• Configure Ollama with: <code>OLLAMA_ORIGINS=https://astrixity.github.io</code>
            </div>
        ` : '';

        this.chatMessages.innerHTML = `
            <div class="welcome-section">
                ${corsWarning}
                <div class="welcome-title">
                    <h1>LLMe</h1>
                    <p>How can I help you today?</p>
                </div>
                <div class="example-prompts">
                    <div class="prompt-card" data-prompt="Explain quantum computing in simple terms">
                        <i class="fas fa-atom"></i>
                        <span>Explain quantum computing in simple terms</span>
                    </div>
                    <div class="prompt-card" data-prompt="Write a Python function to sort a list">
                        <i class="fas fa-code"></i>
                        <span>Write a Python function to sort a list</span>
                    </div>
                    <div class="prompt-card" data-prompt="Create a markdown table comparing programming languages">
                        <i class="fas fa-table"></i>
                        <span>Create a markdown table comparing programming languages</span>
                    </div>
                    <div class="prompt-card" data-prompt="Plan a weekend trip to Paris">
                        <i class="fas fa-map-marked-alt"></i>
                        <span>Plan a weekend trip to Paris</span>
                    </div>
                    <div class="prompt-card" data-prompt="Help me debug this JavaScript code">
                        <i class="fas fa-bug"></i>
                        <span>Help me debug this JavaScript code</span>
                    </div>
                </div>
            </div>
        `;
    }

    hideWelcomeSection() {
        const welcomeSection = this.chatMessages.querySelector('.welcome-section');
        if (welcomeSection) {
            welcomeSection.style.display = 'none';
        }
    }

    renderChatHistory() {
        let html = '';
        this.conversations.forEach(conversation => {
            const isActive = conversation.id === this.currentConversationId;
            const title = conversation.title || 'New chat';
            
            html += `
                <div class="chat-item ${isActive ? 'active' : ''}" data-id="${conversation.id}">
                    <div class="chat-item-content">
                        <i class="fas fa-comment"></i>
                        <span class="chat-title">${this.truncateText(title, 25)}</span>
                    </div>
                    <button class="delete-chat-btn" title="Delete chat" onclick="chatApp.deleteChat('${conversation.id}', event)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });

        this.chatHistory.innerHTML = html;
    }

    loadConversation(conversationId) {
        this.currentConversationId = conversationId;
        this.renderMessages();
        this.renderChatHistory();
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            this.sidebar.classList.remove('open');
        }
    }

    deleteChat(conversationId, event) {
        // Prevent event bubbling to avoid triggering chat selection
        event.stopPropagation();
        
        // Store the conversation ID and chat item for later use
        this.conversationToDelete = conversationId;
        this.chatItemToDelete = event.target.closest('.chat-item');
        
        // Show confirmation modal
        this.showDeleteModal();
    }

    showDeleteModal() {
        this.deleteModal.style.display = 'flex';
        setTimeout(() => {
            this.deleteModal.classList.add('show');
        }, 10);
    }

    hideDeleteModal() {
        this.deleteModal.classList.remove('show');
        setTimeout(() => {
            this.deleteModal.style.display = 'none';
            this.conversationToDelete = null;
            this.chatItemToDelete = null;
        }, 300);
    }

    confirmChatDeletion() {
        if (this.conversationToDelete && this.chatItemToDelete) {
            // Add deletion animation
            this.chatItemToDelete.classList.add('deleting');
            
            setTimeout(() => {
                // Remove from conversations array
                this.conversations = this.conversations.filter(c => c.id !== this.conversationToDelete);
                
                // If this was the active conversation, clear it
                if (this.currentConversationId === this.conversationToDelete) {
                    this.currentConversationId = null;
                    this.renderMessages();
                }
                
                // Save and re-render
                this.saveConversations();
                this.renderChatHistory();
            }, 300); // Match CSS animation duration
        }
        
        this.hideDeleteModal();
    }

    generateTitle(text) {
        return this.truncateText(text, 30);
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }, 100);
    }

    smoothScrollToBottom() {
        const container = this.chatMessages.parentElement; // chat-container
        if (!container) return;
        
        const targetScrollTop = container.scrollHeight - container.clientHeight;
        const currentScrollTop = container.scrollTop;
        
        // Only scroll if we're not already at the bottom or very close
        if (Math.abs(targetScrollTop - currentScrollTop) > 10) {
            container.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });
        }
    }

    saveConversations() {
        try {
            localStorage.setItem('llme_conversations', JSON.stringify(this.conversations));
            localStorage.setItem('llme_current_conversation', this.currentConversationId);
        } catch (error) {
            console.warn('Failed to save conversations to localStorage:', error);
        }
    }

    loadConversations() {
        try {
            const saved = localStorage.getItem('llme_conversations');
            if (saved) {
                this.conversations = JSON.parse(saved);
                // Migrate old messages to include metadata structure
                this.migrateConversationsMetadata();
            }
            
            const savedCurrentId = localStorage.getItem('llme_current_conversation');
            if (savedCurrentId) {
                this.currentConversationId = savedCurrentId;
            }
            
            this.renderChatHistory();
            if (this.currentConversationId) {
                this.renderMessages();
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.conversations = [];
        }
    }

    migrateConversationsMetadata() {
        let needsSaving = false;
        this.conversations.forEach(conversation => {
            conversation.messages.forEach(message => {
                if (message.role === 'assistant' && !message.metadata) {
                    // Handle timestamp conversion from string to Date if necessary
                    let messageTime = Date.now();
                    if (message.timestamp) {
                        if (typeof message.timestamp === 'string') {
                            messageTime = new Date(message.timestamp).getTime();
                        } else if (message.timestamp instanceof Date) {
                            messageTime = message.timestamp.getTime();
                        } else {
                            messageTime = message.timestamp;
                        }
                    }
                    
                    // Add default metadata for old assistant messages
                    message.metadata = {
                        provider: this.settings.provider || 'unknown',
                        model: this.settings.model || 'unknown',
                        startTime: messageTime,
                        endTime: messageTime,
                        responseTime: 0,
                        tokens: this.estimateTokens(message.content || '')
                    };
                    needsSaving = true;
                    console.log('Migrated message metadata:', message.id, message.metadata);
                }
            });
        });
        
        if (needsSaving) {
            this.saveConversations();
            console.log('Conversation metadata migration completed');
        }
    }

    testMetadata() {
        if (!this.currentConversationId) {
            console.log('No active conversation');
            return;
        }
        
        const conversation = this.conversations.find(c => c.id === this.currentConversationId);
        if (!conversation) {
            console.log('Conversation not found');
            return;
        }
        
        console.log('Current conversation messages with metadata:');
        conversation.messages.forEach((message, index) => {
            console.log(`Message ${index}:`, {
                role: message.role,
                content: message.content?.substring(0, 50) + '...',
                hasMetadata: !!message.metadata,
                metadata: message.metadata
            });
        });
        
        // Force re-render
        this.renderMessages();
    }

    // Test function to debug sending functionality
    testSendMessage() {
        console.log('=== SEND MESSAGE DEBUG TEST ===');
        console.log('Current settings:', this.settings);
        console.log('Current conversation ID:', this.currentConversationId);
        console.log('Message input value:', this.messageInput?.value);
        console.log('Send button disabled:', this.sendBtn?.disabled);
        console.log('Provider models:', this.providerModels);
        console.log('Models loading:', this.modelsLoading);
        console.log('Connection error:', this.hasConnectionError);
        
        // Test if elements exist
        console.log('Elements check:');
        console.log('- messageInput exists:', !!this.messageInput);
        console.log('- sendBtn exists:', !!this.sendBtn);
        console.log('- chatMessages exists:', !!this.chatMessages);
        console.log('- modelSelect exists:', !!this.modelSelect);
        console.log('- providerSelect exists:', !!this.providerSelect);
        
        // Test model selection
        console.log('Model select value:', this.modelSelect?.value);
        console.log('Available models for current provider:', this.providerModels[this.settings.provider]);
        
        // Test if we can create a conversation
        if (!this.currentConversationId) {
            console.log('No current conversation, testing creation...');
            this.createNewConversation();
            console.log('New conversation created:', this.currentConversationId);
        }
        
        console.log('=== END DEBUG TEST ===');
    }

    formatResponseTime(timeMs) {
        if (timeMs === null || timeMs === undefined) return 'Unknown';
        if (timeMs === 0) return '0ms';
        
        if (timeMs < 1000) {
            return `${Math.round(timeMs)}ms`;
        } else if (timeMs < 60000) {
            return `${(timeMs / 1000).toFixed(1)}s`;
        } else {
            return `${(timeMs / 60000).toFixed(1)}m`;
        }
    }

    getProviderDisplayName(provider) {
        const providerNames = {
            'ollama': 'Ollama',
            'openrouter': 'OpenRouter',
            'custom': 'Custom API'
        };
        return providerNames[provider] || provider;
    }

    updateStreamingMessage(message) {
        // Ensure we have a conversation and the message exists
        if (!this.currentConversationId) {
            console.log('No current conversation for streaming update');
            return false;
        }
        
        const conversation = this.conversations.find(c => c.id === this.currentConversationId);
        if (!conversation) {
            console.log('Conversation not found for streaming update');
            return false;
        }
        
        // Find the streaming message element and update only its text content
        const assistantMessages = this.chatMessages.querySelectorAll('.assistant-message');
        
        // Find the last assistant message (which should be the streaming one)
        const streamingElement = assistantMessages[assistantMessages.length - 1];

        if (streamingElement) {
            let textDiv = streamingElement.querySelector('.message-text');
            if (textDiv) {
                // Add streaming class if not present
                if (!textDiv.classList.contains('streaming')) {
                    textDiv.classList.add('streaming');
                }
                
                // Use simple markdown rendering during streaming to avoid flickering
                const formattedContent = this.formatStreamingContentSimple(message.content);
                
                // Update content with cursor positioned inline
                textDiv.innerHTML = `${formattedContent}<span class="streaming-cursor">|</span>`;
                
                return true;
            }
        }
        
        console.log('No streaming element found for targeted update');
        return false;
    }

    formatStreamingContentSimple(content) {
        if (!content) return '';
        
        // Simple, efficient formatting that doesn't cause flickering
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`\n]+)`/g, '<code>$1</code>');
    }

    renderStreamingMarkdown(content) {
        // Lightweight markdown rendering for streaming - no full DOM restructuring
        if (!content) return '';
        
        // Apply basic markdown formatting without complex parsing
        let formatted = content;
        
        // Handle code blocks first (preserve them as-is during streaming)
        const codeBlocks = [];
        formatted = formatted.replace(/```[\s\S]*?```/g, (match, index) => {
            codeBlocks.push(match);
            return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
        });
        
        // Handle inline code
        const inlineCodes = [];
        formatted = formatted.replace(/`([^`]+)`/g, (match, code) => {
            inlineCodes.push(`<code>${this.escapeHtml(code)}</code>`);
            return `__INLINE_CODE_${inlineCodes.length - 1}__`;
        });
        
        // Apply basic formatting (safe operations that don't restructure DOM)
        formatted = this.escapeHtml(formatted)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Restore inline codes
        inlineCodes.forEach((code, index) => {
            formatted = formatted.replace(`__INLINE_CODE_${index}__`, code);
        });
        
        // Restore code blocks with simple formatting
        codeBlocks.forEach((block, index) => {
            const cleanBlock = block.replace(/```(\w+)?\n?/, '').replace(/```$/, '');
            const lang = block.match(/```(\w+)/)?.[1] || '';
            formatted = formatted.replace(`__CODE_BLOCK_${index}__`, 
                `<pre class="streaming-code"><code class="language-${lang}">${this.escapeHtml(cleanBlock)}</code></pre>`);
        });
        
        return formatted;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Debug function to check conversation state
    debugConversationState() {
        console.log('=== DEBUG CONVERSATION STATE ===');
        console.log('Current conversation ID:', this.currentConversationId);
        console.log('Total conversations:', this.conversations.length);
        console.log('Streaming message ID:', this.streamingMessageId);
        
        if (this.currentConversationId) {
            const conversation = this.conversations.find(c => c.id === this.currentConversationId);
            if (conversation) {
                console.log('Current conversation messages:', conversation.messages.length);
                conversation.messages.forEach((msg, index) => {
                    console.log(`Message ${index}:`, {
                        id: msg.id,
                        role: msg.role,
                        contentLength: msg.content?.length || 0,
                        hasMetadata: !!msg.metadata
                    });
                });
            } else {
                console.log('Conversation not found!');
            }
        }
        
        // Check DOM elements
        const chatMessages = document.getElementById('chatMessages');
        const assistantMessages = chatMessages?.querySelectorAll('.assistant-message');
        console.log('DOM assistant messages found:', assistantMessages?.length || 0);
        
        console.log('=== END DEBUG ===');
    }

    // Test function to debug streaming
    testStreaming() {
        console.log('Testing streaming functionality...');
        console.log('Current provider:', this.settings.provider);
        console.log('Current model:', this.settings.model);
        console.log('Streaming message ID:', this.streamingMessageId);
        
        if (this.currentConversationId) {
            const conversation = this.conversations.find(c => c.id === this.currentConversationId);
            if (conversation) {
                console.log('Current conversation messages:', conversation.messages.length);
            }
        }
        
        // Test if renderMessages works
        console.log('Testing renderMessages...');
        this.renderMessages();
    }
}

// Initialize the app when DOM is loaded
// Initialize the app
let chatApp;
document.addEventListener('DOMContentLoaded', () => {
    chatApp = new ChatApp();
});

// Handle responsive sidebar
window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth > 768) {
        sidebar.classList.remove('open');
    }
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    if (window.innerWidth <= 768 && 
        sidebar.classList.contains('open') && 
        !sidebar.contains(e.target) && 
        !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});
