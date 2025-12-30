# AI Chat Application with Dark/Light Mode

A fully-featured real-time chat application built with Django, Django Channels, and Vue.js. Features include real-time messaging, AI-powered suggestions, dark/light mode, group chats, file sharing, and user profiles.

## 🌐 Live Demo

**Live Application:** [Coming Soon - Deploy to Heroku/Vercel/Railway]  
**Admin Demo:** [Coming Soon]

## 📸 Screenshots

| Landing Page | Chat Interface | Dark Mode |
|--------------|----------------|-----------|
| ![Landing](https://images.unsplash.com/photo-1611605698325-8b1569810432?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80) | ![Chat](https://images.unsplash.com/photo-1577563908411-5077b6dc7624?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80) | ![Dark](https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80) |

## ✨ Features

### 🚀 Core Features
- **Real-time Messaging**: Instant messaging with WebSocket technology
- **AI Integration**: Smart reply suggestions using OpenAI GPT
- **Dark/Light Mode**: Toggle between themes with system preference detection
- **Group Chats**: Create and manage group conversations
- **User Profiles**: Customizable profiles with avatars and bios
- **File Sharing**: Share images, documents, and other files
- **Typing Indicators**: See when others are typing
- **Read Receipts**: Know when messages are read
- **Online Status**: Real-time user online/offline status

### 🎨 User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Intuitive UI**: Clean, modern interface inspired by Slack/WhatsApp
- **Real-time Updates**: Instant message delivery and status updates
- **Search Functionality**: Search conversations and users
- **Notifications**: In-app notifications system
- **Emoji Support**: Built-in emoji picker
- **Voice/Video Calls**: Integrated calling features (coming soon)

## 🛠️ Technology Stack

### Backend
- **Django 5.2**: Python web framework
- **Django REST Framework**: API development
- **Django Channels**: WebSocket support for real-time features
- **Django Allauth**: Authentication system
- **Redis**: Message broker for WebSockets
- **PostgreSQL**: Primary database (SQLite for development)
- **Celery**: Background task processing

### Frontend
- **Vue.js 3**: Reactive frontend framework
- **WebSocket API**: Real-time communication
- **CSS3 with Custom Properties**: Theme variables for dark/light mode
- **Font Awesome**: Icon library
- **Vanilla JavaScript**: For additional interactivity

### AI/ML
- **OpenAI API**: GPT integration for smart replies
- **Custom AI Models**: Future expansion for specialized features

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Python 3.8 or higher
- Node.js 14 or higher
- Redis Server
- PostgreSQL (optional, SQLite for development)
- Git

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ai-chat-app.git
cd ai-chat-app
```

### 2. Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Configuration
Create a `.env` file in the project root:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your-openai-api-key
AI_MODEL=gpt-3.5-turbo
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### 5. Database Setup
```bash
# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Create test users (optional)
python manage.py create_test_users
```

### 6. Start Redis Server
```bash
# Windows (using Redis for Windows)
redis-server

# Linux
sudo systemctl start redis

# Mac
brew services start redis
```

### 7. Run Development Server
```bash
# Terminal 1 - Django development server
python manage.py runserver

# Terminal 2 - Django Channels (for WebSockets)
daphne core.asgi:application

# Terminal 3 - Celery worker (for background tasks)
celery -A core worker -l info
```

## 🏗️ Project Structure

```
ai-chat-app/
├── core/                  # Django project settings
├── accounts/             # User authentication & profiles
│   ├── models.py        # Custom user model
│   ├── views.py         # Authentication views
│   ├── serializers.py   # API serializers
│   └── urls.py          # Authentication URLs
├── chat/                 # Chat application
│   ├── models.py        # Conversation & Message models
│   ├── views.py         # Chat views & API endpoints
│   ├── serializers.py   # Chat serializers
│   ├── consumers.py     # WebSocket consumers
│   ├── routing.py       # WebSocket routing
│   └── urls.py          # Chat URLs
├── static/              # Static files
│   ├── css/
│   │   ├── base.css
│   │   ├── auth.css
│   │   └── chat.css
│   └── js/
│       ├── chat.js
│       └── theme.js
├── templates/           # HTML templates
│   ├── base.html
│   ├── home.html
│   ├── account/        # Authentication templates
│   └── chat/           # Chat interface templates
├── media/              # User uploaded files
├── requirements.txt    # Python dependencies
├── .env.example        # Environment variables template
└── README.md           # This file
```

## 🔧 Configuration

### Database Configuration
By default, the app uses SQLite. For production, use PostgreSQL:

```python
# In settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'chat_app',
        'USER': 'postgres',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### Email Configuration
Configure email for password reset and notifications:
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
```

### OpenAI Configuration
Add your OpenAI API key to `.env`:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/me/` - Current user profile
- `PATCH /api/auth/profile/` - Update profile

### Chat
- `GET /api/conversations/` - List conversations
- `POST /api/conversations/create_chat/` - Create new conversation
- `GET /api/conversations/{id}/messages/` - Get conversation messages
- `POST /api/messages/` - Send message
- `GET /api/search-users/` - Search users
- `POST /api/ai-suggestions/` - Get AI reply suggestions

### WebSocket
- `ws://localhost:8000/ws/chat/{conversation_id}/` - Real-time chat

## 🎨 Theme Configuration

The app supports three theme modes:
1. **Light Mode**: Bright interface
2. **Dark Mode**: Dark interface
3. **Auto**: Follows system preference

To toggle themes:
- Click the moon/sun icon in the top-right corner
- User preference is saved locally and on the server

## 👥 User Management

### User Roles
1. **Regular User**: Can chat, create groups, and manage profile
2. **Staff User**: Additional admin access
3. **Superuser**: Full system access

### Profile Features
- Custom profile picture
- Personal bio
- Contact information
- Theme preference
- Online status

## 🔒 Security Features

- **HTTPS Enforcement**: All connections use SSL in production
- **CSRF Protection**: Built-in Django CSRF tokens
- **XSS Protection**: Django's automatic escaping
- **SQL Injection Protection**: Django ORM prevents SQL injection
- **Password Hashing**: BCrypt password hashing
- **Session Security**: Secure, HTTP-only cookies
- **File Upload Security**: Validation and scanning

## 📦 Deployment

### Heroku Deployment
```bash
# Install Heroku CLI
heroku login
heroku create your-chat-app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
heroku config:set SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(50))")
heroku config:set DEBUG=False
git push heroku main
heroku run python manage.py migrate
heroku run python manage.py createsuperuser
```

### Docker Deployment
```dockerfile
# Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/chat_app
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=chat_app
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  redis:
    image: redis:7-alpine
  worker:
    build: .
    command: celery -A core worker -l info
    depends_on:
      - redis
      - db

volumes:
  postgres_data:
```

## 🤖 AI Features

### Smart Reply Suggestions
The AI analyzes conversation context and suggests relevant replies:
- Context-aware responses
- Multiple suggestion options
- Language detection
- Tone matching

### Future AI Features
- **Chat Translation**: Real-time message translation
- **Sentiment Analysis**: Emotion detection in messages
- **Chat Summarization**: Conversation summarization
- **Smart Notifications**: Intelligent notification prioritization

## 📱 Mobile Responsiveness

The application is fully responsive:
- **Mobile (< 768px)**: Collapsible sidebar, optimized messaging
- **Tablet (768px - 1024px)**: Balanced layout
- **Desktop (> 1024px)**: Full-featured interface

## 🔧 Development

### Running Tests
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test accounts
python manage.py test chat

# Run with coverage
coverage run manage.py test
coverage report
```

### Code Style
```bash
# Check code style
flake8 .

# Auto-format code
black .
isort .
```

### Creating Migrations
```bash
# After model changes
python manage.py makemigrations
python manage.py migrate

# Create migration without applying
python manage.py makemigrations --name your_migration_name
```

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   ```
   Solution: Ensure Redis is running and channels are configured
   ```

2. **Static Files Not Loading**
   ```
   Solution: Run `python manage.py collectstatic`
   ```

3. **Database Connection Error**
   ```
   Solution: Check database credentials and ensure service is running
   ```

4. **AI Features Not Working**
   ```
   Solution: Verify OpenAI API key in .env file
   ```

### Debug Mode
For development, set `DEBUG=True` in `.env`. For production, set `DEBUG=False`.

## 📈 Performance Optimization

- **Database Indexing**: Optimized queries with proper indexing
- **Caching**: Redis caching for frequently accessed data
- **Static File Compression**: Gzip compression for static assets
- **Lazy Loading**: Images and content load as needed
- **WebSocket Optimization**: Efficient message broadcasting

## 🔄 Continuous Integration

GitHub Actions workflow included for:
- Automated testing
- Code quality checks
- Security scanning
- Deployment to staging

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow PEP 8 style guide for Python code
- Write tests for new features
- Update documentation as needed
- Use meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Django](https://www.djangoproject.com/) - Web framework
- [Vue.js](https://vuejs.org/) - Frontend framework
- [OpenAI](https://openai.com/) - AI capabilities
- [Font Awesome](https://fontawesome.com/) - Icons
- [Unsplash](https://unsplash.com/) - Sample images

## 📞 Support

For support, please:
1. Check the [Troubleshooting](#troubleshooting) section
2. Search [GitHub Issues](https://github.com/yourusername/ai-chat-app/issues)
3. Create a new issue with details about your problem

## 📊 Project Status

**Current Version:** 1.0.0  
**Status:** Active Development  
**Next Release:** v1.1.0 - Enhanced AI Features

---

<div align="center">
  
Made with ❤️ by [Your Name]

[![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Vue.js](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D)](https://vuejs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)

</div>
