// Chat Application
class ChatApp {
    constructor() {
        this.currentConversation = null;
        this.conversations = [];
        this.users = [];
        this.selectedUsers = [];
        this.ws = null;
        this.typingTimeout = null;
        this.currentUser = null;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.loadCurrentUser = this.loadCurrentUser.bind(this);
        this.loadConversations = this.loadConversations.bind(this);
        this.loadUsers = this.loadUsers.bind(this);
        this.selectConversation = this.selectConversation.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.createConversation = this.createConversation.bind(this);
        this.toggleUserSelection = this.toggleUserSelection.bind(this);
        this.saveProfile = this.saveProfile.bind(this);
        this.logout = this.logout.bind(this);
        this.toggleTheme = this.toggleTheme.bind(this);
    }

    async init() {
        // Load current user
        await this.loadCurrentUser();
        
        // Load initial data
        await this.loadConversations();
        await this.loadUsers();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Auto-select first conversation
        if (this.conversations.length > 0) {
            await this.selectConversation(this.conversations[0]);
        }
        
        // Update online status
        await this.updateOnlineStatus(true);
    }

    async loadCurrentUser() {
        try {
            const response = await fetch('/api/auth/me/');
            if (response.ok) {
                this.currentUser = await response.json();
                this.updateUserProfileUI();
            }
        } catch (error) {
            console.error('Failed to load current user:', error);
        }
    }

    updateUserProfileUI() {
        if (!this.currentUser) return;
        
        // Update avatar
        const avatar = document.getElementById('profileAvatar');
        if (avatar) {
            if (this.currentUser.profile_picture) {
                avatar.innerHTML = `<img src="${this.currentUser.profile_picture}" alt="${this.currentUser.username}">`;
            } else {
                avatar.innerHTML = `<div class="avatar-placeholder">${this.currentUser.initials || this.currentUser.username.substring(0, 2).toUpperCase()}</div>`;
            }
        }
        
        // Update profile modal
        const profileAvatarLarge = document.getElementById('profileAvatarLarge');
        if (profileAvatarLarge && !this.currentUser.profile_picture) {
            profileAvatarLarge.textContent = this.currentUser.initials || this.currentUser.username.substring(0, 2).toUpperCase();
        }
        
        // Update form fields
        document.getElementById('profileUsername').value = this.currentUser.username;
        document.getElementById('profileEmail').value = this.currentUser.email;
        document.getElementById('profileFirstName').value = this.currentUser.first_name || '';
        document.getElementById('profileLastName').value = this.currentUser.last_name || '';
        document.getElementById('profileBio').value = this.currentUser.bio || '';
        document.getElementById('profilePhone').value = this.currentUser.phone_number || '';
    }

    async loadConversations() {
        try {
            const response = await fetch('/api/conversations/');
            if (response.ok) {
                this.conversations = await response.json();
                this.renderConversations();
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    }

    renderConversations() {
        const container = document.getElementById('conversationsList');
        if (!container) return;

        if (this.conversations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>No conversations yet</p>
                    <button class="btn btn-primary" id="startFirstChatBtn">
                        Start your first chat
                    </button>
                </div>
            `;
            document.getElementById('startFirstChatBtn')?.addEventListener('click', () => this.showModal('newChatModal'));
            return;
        }

        container.innerHTML = this.conversations.map(conv => `
            <div class="conversation-item ${this.currentConversation?.id === conv.id ? 'active' : ''}" 
                 data-conversation-id="${conv.id}">
                <div class="conversation-avatar">
                    ${conv.is_group ? 
                        '<div class="group-avatar"><i class="fas fa-users"></i></div>' : 
                        `<div class="single-avatar">${this.getInitials(conv.name || conv.participants[0]?.username)}</div>`
                    }
                </div>
                <div class="conversation-info">
                    <div class="conversation-header">
                        <div class="conversation-name">${conv.name || this.getParticipantNames(conv)}</div>
                        <span class="conversation-time">${this.formatTime(conv.updated_at)}</span>
                    </div>
                    <div class="last-message">${conv.last_message?.content || 'Start a conversation'}</div>
                </div>
                ${conv.unread_count > 0 ? `<div class="unread-badge">${conv.unread_count}</div>` : ''}
            </div>
        `).join('');

        // Add click listeners
        container.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                const convId = item.dataset.conversationId;
                const conversation = this.conversations.find(c => c.id === convId);
                if (conversation) {
                    await this.selectConversation(conversation);
                }
            });
        });
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/search-users/');
            if (response.ok) {
                this.users = await response.json();
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    async searchUsers(query) {
        try {
            const response = await fetch(`/api/search-users/?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                this.users = await response.json();
                this.renderUsersList();
            }
        } catch (error) {
            console.error('Failed to search users:', error);
        }
    }

    renderUsersList() {
        const container = document.getElementById('usersList');
        if (!container) return;

        if (this.users.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No users found</p></div>';
            return;
        }

        container.innerHTML = this.users.map(user => `
            <div class="user-item ${this.selectedUsers.includes(user.id) ? 'selected' : ''}" 
                 data-user-id="${user.id}">
                <div class="user-avatar">
                    <div class="avatar-small">${user.initials || user.username.substring(0, 2).toUpperCase()}</div>
                </div>
                <div class="user-info">
                    <h5>${user.username}</h5>
                    <p>${user.email}</p>
                </div>
                <div class="user-checkbox">
                    <input type="checkbox" ${this.selectedUsers.includes(user.id) ? 'checked' : ''}>
                </div>
            </div>
        `).join('');

        // Add click listeners
        container.querySelectorAll('.user-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const userId = parseInt(item.dataset.userId);
                this.toggleUserSelection(userId);
                this.renderUsersList();
            });
        });
    }

    toggleUserSelection(userId) {
        const index = this.selectedUsers.indexOf(userId);
        if (index === -1) {
            this.selectedUsers.push(userId);
        } else {
            this.selectedUsers.splice(index, 1);
        }
        
        // Update UI
        const createBtn = document.getElementById('createChatBtn');
        createBtn.disabled = this.selectedUsers.length === 0;
        
        // Show group options if multiple users selected
        const groupOptions = document.getElementById('groupOptions');
        const groupNameField = document.getElementById('groupNameField');
        const isGroupCheckbox = document.getElementById('isGroupCheckbox');
        
        if (this.selectedUsers.length > 1) {
            groupOptions.style.display = 'block';
            isGroupCheckbox.checked = true;
            groupNameField.style.display = 'block';
        } else {
            groupOptions.style.display = 'none';
            isGroupCheckbox.checked = false;
            groupNameField.style.display = 'none';
        }
    }

    async selectConversation(conversation) {
        this.currentConversation = conversation;
        
        // Update UI
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.toggle('active', item.dataset.conversationId === conversation.id);
        });
        
        // Show message input
        document.getElementById('messageInputArea').style.display = 'block';
        
        // Update chat header
        const chatHeader = document.getElementById('chatHeader');
        chatHeader.innerHTML = `
            <div class="chat-partner-info">
                <div class="chat-avatar">
                    ${conversation.is_group ? 
                        '<div class="group-avatar"><i class="fas fa-users"></i></div>' : 
                        `<div class="single-avatar">${this.getInitials(conversation.name || this.getParticipantNames(conversation))}</div>`
                    }
                </div>
                <div>
                    <h3>${conversation.name || this.getParticipantNames(conversation)}</h3>
                    <p class="partner-status">
                        <span class="status-indicator online"></span>
                        Online
                    </p>
                </div>
            </div>
            <div class="chat-actions">
                <button class="icon-btn" id="toggleSidebarBtn" title="Toggle Sidebar">
                    <i class="fas fa-bars"></i>
                </button>
                <button class="icon-btn" id="voiceCallBtn" title="Voice Call">
                    <i class="fas fa-phone"></i>
                </button>
                <button class="icon-btn" id="videoCallBtn" title="Video Call">
                    <i class="fas fa-video"></i>
                </button>
                <button class="icon-btn" id="conversationInfoBtn" title="Conversation Info">
                    <i class="fas fa-info-circle"></i>
                </button>
            </div>
        `;
        
        // Load messages
        await this.loadMessages(conversation.id);
        
        // Connect WebSocket
        this.connectWebSocket(conversation.id);
        
        // Mark as read
        await this.markAsRead(conversation.id);
    }

    async loadMessages(conversationId) {
        try {
            const response = await fetch(`/api/conversations/${conversationId}/messages/`);
            if (response.ok) {
                const messages = await response.json();
                this.renderMessages(messages);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }

    renderMessages(messages) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        if (messages.length === 0) {
            container.innerHTML = `
                <div class="empty-chat">
                    <i class="fas fa-comment-alt"></i>
                    <h3>No messages yet</h3>
                    <p>Send your first message to start the conversation</p>
                </div>
            `;
            return;
        }

        container.innerHTML = messages.map(msg => `
            <div class="message ${msg.sender.id === this.currentUser.id ? 'sent' : msg.sender.username === 'AI Assistant' ? 'ai' : 'received'}">
                ${msg.sender.id !== this.currentUser.id && msg.sender.username !== 'AI Assistant' ? 
                    `<div class="message-sender">${msg.sender.username}</div>` : ''
                }
                <div class="message-content">
                    ${msg.content}
                    <div class="message-time">
                        ${this.formatMessageTime(msg.timestamp)}
                        ${msg.sender.id === this.currentUser.id ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();
        
        if (!content || !this.currentConversation) return;

        try {
            const response = await fetch('/api/messages/', {
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
                const message = await response.json();
                this.renderNewMessage(message);
                input.value = '';
                
                // Clear typing indicator
                this.stopTyping();
                
                // Get AI suggestions
                await this.getAISuggestions(content);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }

    renderNewMessage(message) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        // Remove empty state if present
        if (container.querySelector('.empty-chat')) {
            container.innerHTML = '';
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender.id === this.currentUser.id ? 'sent' : 'received'}`;
        messageDiv.innerHTML = `
            ${message.sender.id !== this.currentUser.id ? 
                `<div class="message-sender">${message.sender.username}</div>` : ''
            }
            <div class="message-content">
                ${message.content}
                <div class="message-time">
                    ${this.formatMessageTime(message.timestamp)}
                    ${message.sender.id === this.currentUser.id ? '<i class="fas fa-check"></i>' : ''}
                </div>
            </div>
        `;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    async createConversation() {
        if (this.selectedUsers.length === 0) return;

        const isGroup = document.getElementById('isGroupCheckbox').checked;
        const groupName = document.getElementById('groupNameInput').value;

        try {
            const response = await fetch('/api/conversations/create_chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken(),
                },
                body: JSON.stringify({
                    participant_ids: this.selectedUsers,
                    is_group: isGroup,
                    name: groupName || ''
                })
            });

            if (response.ok) {
                const conversation = await response.json();
                this.conversations.unshift(conversation);
                this.renderConversations();
                await this.selectConversation(conversation);
                this.hideModal('newChatModal');
                this.resetNewChatForm();
            }
        } catch (error) {
            console.error('Failed to create conversation:', error);
            alert('Failed to create conversation. Please try again.');
        }
    }

    resetNewChatForm() {
        this.selectedUsers = [];
        document.getElementById('userSearchInput').value = '';
        document.getElementById('isGroupCheckbox').checked = false;
        document.getElementById('groupNameInput').value = '';
        document.getElementById('createChatBtn').disabled = true;
        document.getElementById('groupOptions').style.display = 'none';
        document.getElementById('groupNameField').style.display = 'none';
        this.renderUsersList();
    }

    async markAsRead(conversationId) {
        try {
            await fetch(`/api/conversations/${conversationId}/mark_read/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                }
            });
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }

    async getAISuggestions(message) {
        try {
            const response = await fetch('/api/ai-suggestions/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken(),
                },
                body: JSON.stringify({
                    message: message,
                    conversation_id: this.currentConversation.id
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.renderAISuggestions(data.suggestions);
            }
        } catch (error) {
            console.error('Failed to get AI suggestions:', error);
        }
    }

    renderAISuggestions(suggestions) {
        const container = document.getElementById('aiSuggestions');
        if (!container || !suggestions || suggestions.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = suggestions.map(suggestion => `
            <div class="ai-suggestion">${suggestion}</div>
        `).join('');

        // Add click listeners
        container.querySelectorAll('.ai-suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                document.getElementById('messageInput').value = suggestion.textContent;
                container.innerHTML = '';
            });
        });
    }

    async saveProfile() {
        const formData = new FormData();
        const pictureInput = document.getElementById('profilePictureInput');
        
        if (pictureInput.files.length > 0) {
            formData.append('profile_picture', pictureInput.files[0]);
        }
        
        formData.append('first_name', document.getElementById('profileFirstName').value);
        formData.append('last_name', document.getElementById('profileLastName').value);
        formData.append('bio', document.getElementById('profileBio').value);
        formData.append('phone_number', document.getElementById('profilePhone').value);

        try {
            const response = await fetch('/api/auth/profile/', {
                method: 'PATCH',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                },
                body: formData
            });

            if (response.ok) {
                alert('Profile updated successfully!');
                this.hideModal('profileModal');
                await this.loadCurrentUser();
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (error) {
            console.error('Failed to save profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    }

    async logout() {
        try {
            await fetch('/api/auth/logout/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                }
            });
            window.location.href = '/accounts/logout/';
        } catch (error) {
            console.error('Failed to logout:', error);
            window.location.href = '/accounts/logout/';
        }
    }

    async updateOnlineStatus(isOnline) {
        try {
            await fetch('/api/auth/update-status/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken(),
                },
                body: JSON.stringify({ online: isOnline })
            });
        } catch (error) {
            console.error('Failed to update online status:', error);
        }
    }

    connectWebSocket(conversationId) {
        // Disconnect existing WebSocket
        if (this.ws) {
            this.ws.close();
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/chat/${conversationId}/`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('WebSocket connected');
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };
        
        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            // Attempt to reconnect after 3 seconds
            setTimeout(() => this.connectWebSocket(conversationId), 3000);
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'chat_message':
                this.renderNewMessage(data.message);
                break;
                
            case 'typing':
                this.showTypingIndicator(data.user, data.is_typing);
                break;
        }
    }

    showTypingIndicator(user, isTyping) {
        // Implement typing indicator logic
    }

    startTyping() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'typing',
                is_typing: true
            }));
            
            clearTimeout(this.typingTimeout);
            this.typingTimeout = setTimeout(() => {
                this.stopTyping();
            }, 2000);
        }
    }

    stopTyping() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'typing',
                is_typing: false
            }));
        }
        clearTimeout(this.typingTimeout);
    }

    // Utility methods
    getInitials(name) {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    getParticipantNames(conversation) {
        if (!conversation.participants || conversation.participants.length === 0) return 'Unknown';
        
        if (conversation.is_group) {
            return conversation.participants.map(p => p.username).join(', ');
        } else {
            const otherParticipant = conversation.participants.find(p => p.id !== this.currentUser?.id);
            return otherParticipant ? otherParticipant.username : 'Unknown';
        }
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60 * 60 * 1000) {
            const minutes = Math.floor(diff / (60 * 1000));
            return minutes === 0 ? 'Just now' : `${minutes}m`;
        } else if (diff < 24 * 60 * 60 * 1000) {
            const hours = Math.floor(diff / (60 * 60 * 1000));
            return `${hours}h`;
        } else if (diff < 7 * 24 * 60 * 60 * 1000) {
            const days = Math.floor(diff / (24 * 60 * 60 * 1000));
            return `${days}d`;
        } else {
            return date.toLocaleDateString();
        }
    }

    formatMessageTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    getCSRFToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        return cookieValue || '';
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    toggleTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        const newTheme = theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Update theme on server
        fetch('/api/auth/set-theme/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken(),
            },
            body: JSON.stringify({ theme: newTheme })
        });
    }

    setupEventListeners() {
        // Profile modal
        document.getElementById('profileAvatar')?.addEventListener('click', () => this.showModal('profileModal'));
        document.getElementById('closeProfileModal')?.addEventListener('click', () => this.hideModal('profileModal'));
        document.getElementById('cancelProfileBtn')?.addEventListener('click', () => this.hideModal('profileModal'));
        document.getElementById('saveProfileBtn')?.addEventListener('click', this.saveProfile);
        document.getElementById('changePictureBtn')?.addEventListener('click', () => document.getElementById('profilePictureInput').click());
        
        // New chat modal
        document.getElementById('newChatBtn')?.addEventListener('click', () => this.showModal('newChatModal'));
        document.getElementById('startNewChatBtn')?.addEventListener('click', () => this.showModal('newChatModal'));
        document.getElementById('startNewGroupBtn')?.addEventListener('click', () => {
            this.showModal('newChatModal');
            document.getElementById('isGroupCheckbox').checked = true;
            document.getElementById('groupNameField').style.display = 'block';
        });
        document.getElementById('closeNewChatModal')?.addEventListener('click', () => this.hideModal('newChatModal'));
        document.getElementById('cancelNewChatBtn')?.addEventListener('click', () => this.hideModal('newChatModal'));
        document.getElementById('createChatBtn')?.addEventListener('click', this.createConversation);
        
        // User search
        document.getElementById('userSearchInput')?.addEventListener('input', (e) => {
            this.searchUsers(e.target.value);
        });
        
        // Group checkbox
        document.getElementById('isGroupCheckbox')?.addEventListener('change', (e) => {
            document.getElementById('groupNameField').style.display = e.target.checked ? 'block' : 'none';
        });
        
        // Message input
        document.getElementById('messageInput')?.addEventListener('input', () => {
            this.startTyping();
        });
        
        document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        document.getElementById('sendBtn')?.addEventListener('click', this.sendMessage);
        
        // File attachment
        document.getElementById('attachBtn')?.addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        // Settings
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            alert('Settings feature coming soon!');
        });
        
        // Theme toggle
        document.getElementById('themeToggleBtn')?.addEventListener('click', this.toggleTheme);
        
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', this.logout);
        
        // Notifications
        document.getElementById('notificationsBtn')?.addEventListener('click', () => {
            alert('Notifications feature coming soon!');
        });
        
        // Emoji picker
        document.getElementById('emojiBtn')?.addEventListener('click', () => {
            alert('Emoji picker coming soon!');
        });
        
        // File input
        document.getElementById('fileInput')?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                alert(`Selected ${e.target.files.length} file(s). File upload feature coming soon!`);
            }
        });
        
        // Profile picture input
        document.getElementById('profilePictureInput')?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    const img = document.getElementById('profilePicture');
                    if (img) {
                        img.src = event.target.result;
                    } else {
                        const avatar = document.getElementById('profileAvatarLarge');
                        if (avatar) {
                            avatar.innerHTML = `<img src="${event.target.result}" alt="Profile Picture">`;
                        }
                    }
                };
                
                reader.readAsDataURL(file);
            }
        });
        
        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Close modals on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });
        
        // Toggle sidebar on mobile
        document.getElementById('toggleSidebarBtn')?.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });
        
        // Update online status on page unload
        window.addEventListener('beforeunload', () => {
            this.updateOnlineStatus(false);
        });
    }
}