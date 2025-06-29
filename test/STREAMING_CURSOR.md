# Streaming Cursor Animation - Implementation Guide

## Overview
The LLMe chat interface now displays a blinking green cursor at the end of AI responses while they are being streamed in real-time, providing clear visual feedback that content is actively being generated.

## Features

### 🎯 **Visual Indicators**
- **Green blinking cursor** (2px wide, matches text height)
- **1-second blink cycle** (50% on, 50% off)
- **Smart positioning** at the end of the current text
- **Context-aware display** works with text, markdown, and code

### ⚡ **Real-time Feedback**
- Appears immediately when streaming starts
- Updates position as text is added
- Automatically disappears when streaming completes
- Works across all AI providers (Ollama, OpenRouter, Custom)

## Technical Implementation

### State Management
```javascript
// Track which message is currently streaming
this.streamingMessageId = null;

// Set when streaming starts
this.streamingMessageId = aiMessage.id;

// Clear when streaming completes
this.streamingMessageId = null;
```

### CSS Animation
```css
@keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
}

.message-text.streaming::after {
    content: '';
    display: inline-block;
    width: 2px;
    height: 1.2em;
    background-color: #10a37f;
    margin-left: 2px;
    animation: blink 1s infinite;
    vertical-align: text-bottom;
}
```

### Dynamic Class Assignment
```javascript
// In renderMessages()
const isStreaming = !isUser && this.streamingMessageId === message.id;
const streamingClass = isStreaming ? ' streaming' : '';
const contentHtml = message.content ? 
    `<div class="message-text${streamingClass}">${this.formatMessage(message.content)}</div>` : '';
```

## Context-Aware Cursor Placement

### Text Elements
- **Paragraphs**: Cursor appears after last paragraph
- **Headers**: Cursor appears after last header
- **Lists**: Cursor appears after last list item
- **Blockquotes**: Cursor appears after last quote

### Code Blocks
- **Inline code**: Cursor appears after backtick content
- **Code blocks**: Cursor appears within the code block
- **Syntax highlighting**: Compatible with highlight.js

### Markdown Content
- **Bold/Italic**: Cursor appears after formatted text
- **Links**: Cursor appears after link text
- **Tables**: Cursor appears in appropriate cell
- **Mixed content**: Intelligent positioning

## Streaming Lifecycle

### 1. **Stream Start**
```javascript
// AI message created and added to conversation
const aiMessage = { id: this.messageId++, role: 'assistant', content: '', /* ... */ };

// Mark as streaming
this.streamingMessageId = aiMessage.id;

// Render with streaming cursor
this.renderMessages();
```

### 2. **During Streaming**
```javascript
// Content accumulates
aiMessage.content += newContent;

// UI updates with cursor still visible
this.renderMessages();
```

### 3. **Stream Complete**
```javascript
// Finalize metadata
aiMessage.metadata.endTime = Date.now();
aiMessage.metadata.responseTime = endTime - startTime;
aiMessage.metadata.tokens = this.estimateTokens(aiMessage.content);

// Clear streaming state
this.streamingMessageId = null;

// Final render without cursor
this.renderMessages();
```

## Cross-Provider Support

### Ollama
- Streaming via `/api/chat` endpoint
- Cursor visible during response generation
- Cleared when `done: true` received

### OpenRouter
- Streaming via `/chat/completions` 
- Cursor visible during SSE stream
- Cleared when `[DONE]` received

### Custom APIs
- Both streaming and non-streaming support
- Cursor visible for streaming responses
- Immediate removal for non-streaming

## Performance Considerations

### CSS Animations
- **GPU accelerated** opacity changes
- **No JavaScript timers** for animation
- **Minimal CPU usage** pure CSS implementation
- **60fps smooth** blinking animation

### DOM Updates
- **Efficient re-rendering** only when content changes
- **Class-based approach** no inline styles
- **Pseudo-elements** no extra DOM nodes
- **Conditional rendering** only when streaming

### Memory Usage
- **Single state variable** tracks streaming message
- **No memory leaks** state cleared automatically
- **Lightweight CSS** minimal animation overhead

## Browser Compatibility

### Full Support
- **Chrome 80+**: Complete animation support
- **Firefox 75+**: Full CSS animations
- **Safari 13+**: Webkit animations work
- **Edge 80+**: Chromium-based support

### Fallback Behavior
- **Older browsers**: Cursor may not animate but still visible
- **No CSS support**: Graceful degradation to no cursor
- **No JavaScript**: No streaming functionality

## Customization Options

### Color Themes
```css
/* Change cursor color */
.message-text.streaming::after {
    background-color: #ff6b6b; /* Red cursor */
}

/* Dark theme adjustment */
.dark-theme .message-text.streaming::after {
    background-color: #4ade80; /* Green cursor */
}
```

### Animation Speed
```css
/* Faster blinking */
.message-text.streaming::after {
    animation: blink 0.5s infinite;
}

/* Slower blinking */
.message-text.streaming::after {
    animation: blink 2s infinite;
}
```

### Cursor Size
```css
/* Thicker cursor */
.message-text.streaming::after {
    width: 3px;
}

/* Taller cursor */
.message-text.streaming::after {
    height: 1.5em;
}
```

## Testing

### Manual Testing
1. **Start a conversation** with any AI provider
2. **Send a message** and watch for cursor appearance
3. **Observe blinking** during response generation
4. **Verify removal** when response completes
5. **Test different content** (text, code, markdown)

### Debug Commands
```javascript
// Check current streaming state
console.log('Streaming message ID:', chatApp.streamingMessageId);

// Force streaming state for testing
chatApp.streamingMessageId = 'test-message-id';
chatApp.renderMessages();

// Clear streaming state
chatApp.streamingMessageId = null;
chatApp.renderMessages();
```

### Common Issues
- **Cursor not appearing**: Check if streamingMessageId is set
- **Cursor not disappearing**: Verify streaming completion logic
- **Animation choppy**: Check browser performance/GPU acceleration
- **Wrong position**: Verify CSS selectors and pseudo-elements

## Future Enhancements

### Potential Improvements
- **Typing speed indication** (cursor blink rate based on speed)
- **Different cursor styles** for different content types
- **Cursor color themes** matching provider branding
- **Advanced positioning** for complex markdown structures

### Advanced Features
- **Multi-cursor support** for parallel streaming
- **Cursor trails** showing recent text addition
- **Sound effects** synchronized with blinking
- **Accessibility options** for reduced motion preferences

## Accessibility Considerations

### Motion Sensitivity
```css
/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
    .message-text.streaming::after {
        animation: none;
        opacity: 0.7; /* Static cursor instead of blinking */
    }
}
```

### Screen Readers
- Cursor is purely visual (CSS pseudo-element)
- No interference with screen reader text parsing
- Content remains fully accessible during streaming

### Keyboard Navigation
- Cursor does not affect tab order
- No interactive elements added
- Streaming state doesn't impact navigation
