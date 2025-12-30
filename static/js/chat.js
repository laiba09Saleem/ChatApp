class ChatWebSocket {
    constructor(conversationId) {
        this.conversationId = conversationId;
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.typingTimeout = null;
        this.messageCallbacks = [];
        this.typingCallbacks = [];
        this.statusCallbacks = [];
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/chat/${this.conversationId}/`;
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            this.onConnect();
        };
        
        this.socket.onmessage = (event) => {
            this.handleMessage(JSON.parse(event.data));
        };
        
        this.socket.onclose = (event) => {
            console.log('WebSocket disconnected:', event);
            this.onDisconnect();
            
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => this.reconnect(), this.reconnectDelay);
                this.reconnectAttempts++;
                this.reconnectDelay *= 2; 
            }
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    reconnect() {
        console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        this.connect();
    }

    sendMessage(content) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'chat_message',
                content: content
            }));
            return true;
        }
        return false;
    }

    sendTyping(isTyping) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'typing',
                is_typing: isTyping
            }));
        }
    }

    sendReadReceipt(messageId) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'read_receipt',
                message_id: messageId
            }));
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'chat_message':
                this.messageCallbacks.forEach(callback => callback(data.message, data.sender));
                break;
                
            case 'typing':
                this.typingCallbacks.forEach(callback => callback(data.user, data.is_typing));
                break;
                
            case 'user_status':
                this.statusCallbacks.forEach(callback => callback(data.user, data.status));
                break;
                
            case 'error':
                console.error('WebSocket error:', data.error);
                break;
        }
    }

    onMessage(callback) {
        this.messageCallbacks.push(callback);
    }

    onTyping(callback) {
        this.typingCallbacks.push(callback);
    }

    onUserStatus(callback) {
        this.statusCallbacks.push(callback);
    }

    onConnect(callback) {
        if (callback) this.connectCallback = callback;
        if (this.connectCallback) this.connectCallback();
    }

    onDisconnect(callback) {
        if (callback) this.disconnectCallback = callback;
        if (this.disconnectCallback) this.disconnectCallback();
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    startTyping() {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        } else {
            this.sendTyping(true);
        }
        
        this.typingTimeout = setTimeout(() => {
            this.sendTyping(false);
            this.typingTimeout = null;
        }, 2000);
    }

    stopTyping() {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.sendTyping(false);
            this.typingTimeout = null;
        }
    }
}

class ChatApp {
    constructor() {
        this.currentConversation = null;
        this.ws = null;
        this.typingUsers = new Set();
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadConversations();
        this.updateOnlineStatus();
        
        setInterval(() => this.updateOnlineStatus(), 30000);
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            const convItem = e.target.closest('.conversation-item');
            if (convItem) {
                const convId = convItem.dataset.convId;
                this.selectConversation(convId);
            }
        });

        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        
        if (messageInput) {
            messageInput.addEventListener('input', (e) => {
                this.handleTyping();
                this.autoResizeTextarea(e.target);
            });
            
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
        
        if (sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterConversations(e.target.value);
            });
        }

        document.addEventListener('click', (e) => {
            const suggestion = e.target.closest('.ai-suggestion');
            if (suggestion) {
                const text = suggestion.textContent;
                this.useSuggestion(text);
            }
        });

        const attachButton = document.getElementById('attachButton');
        if (attachButton) {
            attachButton.addEventListener('click', () => this.attachFile());
        }
    }

    async loadConversations() {
        try {
            const response = await fetch('/api/conversations/');
            if (response.ok) {
                const conversations = await response.json();
                this.renderConversations(conversations.results || conversations);
                
                if (conversations.length > 0 && !this.currentConversation) {
                    this.selectConversation(conversations[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    }

    renderConversations(conversations) {
        const container = document.getElementById('conversationsList');
        if (!container) return;

        container.innerHTML = conversations.map(conv => `
            <div class="conversation-item" data-conv-id="${conv.id}">
                <div class="conversation-avatar">
                    ${this.getInitials(conv.name || conv.participants?.[0]?.username || '')}
                </div>
                <div class="conversation-info">
                    <div class="conversation-name">
                        <span>${conv.name || this.getParticipantNames(conv)}</span>
                        <span class="conversation-time">${this.formatTime(conv.updated_at)}</span>
                    </div>
                    <div class="last-message">
                        ${conv.last_message?.content || 'No messages yet'}
                    </div>
                </div>
                ${conv.unread_count > 0 ? 
                    `<div class="unread-badge">${conv.unread_count}</div>` : ''}
            </div>
        `).join('');
    }

    async selectConversation(conversationId) {
        try {
            if (this.ws) {
                this.ws.disconnect();
            }

            const response = await fetch(`/api/conversations/${conversationId}/`);
            if (!response.ok) throw new Error('Failed to load conversation');
            
            this.currentConversation = await response.json();
            this.renderChatHeader();
            
            this.ws = new ChatWebSocket(conversationId);
            this.setupWebSocketHandlers();
            this.ws.connect();
            
            await this.loadMessages();
            
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.classList.toggle('active', item.dataset.convId === conversationId);
            });
            
        } catch (error) {
            console.error('Failed to select conversation:', error);
        }
    }

    setupWebSocketHandlers() {
        if (!this.ws) return;

        this.ws.onMessage((message, sender) => {
            this.renderMessage(message, sender);
            this.scrollToBottom();
        });

        this.ws.onTyping((user, isTyping) => {
            if (isTyping) {
                this.typingUsers.add(user.username);
            } else {
                this.typingUsers.delete(user.username);
            }
            this.renderTypingIndicator();
        });

        this.ws.onUserStatus((user, status) => {
            this.updateUserStatus(user.id, status);
        });
    }

    async loadMessages() {
        if (!this.currentConversation) return;

        try {
            const response = await fetch(`/api/conversations/${this.currentConversation.id}/messages/`);
            if (response.ok) {
                const messages = await response.json();
                this.renderMessages(messages.results || messages);
                this.scrollToBottom();
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }

    renderMessages(messages) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        container.innerHTML = messages.map(msg => `
            <div class="message ${this.getMessageClass(msg)}">
                <div class="message-content">${this.escapeHtml(msg.content)}</div>
                <div class="message-time">
                    ${this.formatMessageTime(msg.timestamp)}
                    ${msg.sender.id === this.getCurrentUserId() ? 
                        '<i class="fas fa-check"></i>' : ''}
                </div>
            </div>
        `).join('');
    }

    renderMessage(message, sender) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${this.getMessageClass(message, sender)}`;
        messageDiv.innerHTML = `
            <div class="message-content">${this.escapeHtml(message.content)}</div>
            <div class="message-time">
                ${this.formatMessageTime(message.timestamp)}
                ${sender.id === this.getCurrentUserId() ? 
                    '<i class="fas fa-check"></i>' : ''}
            </div>
        `;
        
        container.appendChild(messageDiv);
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const content = input?.value.trim();
        
        if (!content || !this.currentConversation || !this.ws) return;

        // Send via WebSocket
        if (this.ws.sendMessage(content)) {
            input.value = '';
            this.autoResizeTextarea(input);
            this.ws.stopTyping();
        } else {
            // Fallback to REST API
            await this.sendMessageViaAPI(content);
        }
    }

    async sendMessageViaAPI(content) {
        try {
            const response = await fetch(`/api/conversations/${this.currentConversation.id}/messages/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken(),
                },
                body: JSON.stringify({
                    conversation: this.currentConversation.id,
                    content: content,
                    message_type: 'text'
                })
            });

            if (response.ok) {
                document.getElementById('messageInput').value = '';
                this.autoResizeTextarea(document.getElementById('messageInput'));
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }

    handleTyping() {
        if (this.ws) {
            this.ws.startTyping();
        }
    }

    renderTypingIndicator() {
        const container = document.getElementById('typingIndicator');
        if (!container) return;

        if (this.typingUsers.size > 0) {
            const users = Array.from(this.typingUsers).join(', ');
            container.innerHTML = `
                <div class="typing-indicator">
                    <span>${users} is typing</span>
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            `;
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getMessageClass(message, sender) {
        const currentUserId = this.getCurrentUserId();
        if (sender && sender.id === currentUserId) {
            return 'sent';
        } else if (message.sender && message.sender.id === currentUserId) {
            return 'sent';
        } else if (message.sender && message.sender.username === 'AI Assistant') {
            return 'ai';
        } else {
            return 'received';
        }
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 24 * 60 * 60 * 1000) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diff < 7 * 24 * 60 * 60 * 1000) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }

    formatMessageTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    getParticipantNames(conversation) {
        if (!conversation.participants) return '';
        return conversation.participants
            .map(p => p.username)
            .join(', ');
    }

    getCurrentUserId() {
        return window.currentUserId || 1;
    }

    getCSRFToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    }

    async updateOnlineStatus() {
        try {
            await fetch('/api/auth/update-status/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken(),
                },
                body: JSON.stringify({ online: true })
            });
        } catch (error) {
            console.error('Failed to update online status:', error);
        }
    }

    renderChatHeader() {
        if (!this.currentConversation) return;

        const header = document.getElementById('chatHeader');
        if (!header) return;

        header.innerHTML = `
            <div class="chat-partner">
                <div class="conversation-avatar">
                    ${this.getInitials(this.currentConversation.name || 
                        this.getParticipantNames(this.currentConversation))}
                </div>
                <div>
                    <h3>${this.currentConversation.name || 
                        this.getParticipantNames(this.currentConversation)}</h3>
                    <div class="user-status">
                        <span class="status-indicator"></span>
                        <span>Online</span>
                    </div>
                </div>
            </div>
            <div class="chat-actions">
                <button onclick="chatApp.toggleSidebar()">
                    <i class="fas fa-bars"></i>
                </button>
                <button onclick="chatApp.startVideoCall()">
                    <i class="fas fa-video"></i>
                </button>
                <button onclick="chatApp.startVoiceCall()">
                    <i class="fas fa-phone"></i>
                </button>
                <button onclick="chatApp.showInfo()">
                    <i class="fas fa-info-circle"></i>
                </button>
            </div>
        `;
    }

    filterConversations(searchTerm) {
        const items = document.querySelectorAll('.conversation-item');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
        });
    }

    useSuggestion(suggestion) {
        const input = document.getElementById('messageInput');
        if (input) {
            input.value = suggestion;
            input.focus();
            this.autoResizeTextarea(input);
        }
    }

    attachFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';
        input.onchange = (e) => this.handleFileUpload(e.target.files[0]);
        input.click();
    }

    async handleFileUpload(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversation', this.currentConversation.id);
        formData.append('message_type', this.getFileType(file.type));

        try {
            const response = await fetch('/api/messages/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                },
                body: formData
            });

            if (response.ok) {
                console.log('File uploaded successfully');
            }
        } catch (error) {
            console.error('Failed to upload file:', error);
        }
    }

    getFileType(mimeType) {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        return 'file';
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    }

    startVideoCall() {
        alert('Video call feature coming soon!');
    }

    startVoiceCall() {
        alert('Voice call feature coming soon!');
    }

    showInfo() {
        alert('Conversation info coming soon!');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
});