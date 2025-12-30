# Real-Time Chat Application with Dark/Light Mode

A modern, fully-featured real-time chat application built with Django and Vue.js. Features include real-time messaging, dark/light mode, user profiles, group chats, and a beautiful responsive interface.

## 🌐 Live Demo

**Application:** [Deploy on Railway/Vercel/Heroku for live demo]  
**Demo Credentials:**
- Username: `demo_user` | Password: `demo123`
- Username: `test_user` | Password: `test123`

## Features

### Implemented Features
- **Real-time Messaging**: Instant messaging using WebSockets (Django Channels)
- **Dark/Light Mode**: Toggle between themes with auto-detection
- **User Authentication**: Secure login/signup with profile management
- **User Profiles**: Custom avatars, bios, and personal information
- **Conversation Management**: Create 1-on-1 and group chats
- **Search Functionality**: Search users and conversations
- **Online Status**: Real-time user online/offline indicators
- **Typing Indicators**: See when others are typing
- **Read Receipts**: Know when messages are read
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **File Upload**: Profile picture uploads
- **Real-time Updates**: Instant message delivery

### Coming Soon (Planned Features)
- AI-powered reply suggestions (OpenAI integration)
- Voice and video calling
- File sharing in chats
- Message reactions
- Message editing/deleting
- Push notifications
- Chat translation
- End-to-end encryption

## Application Screenshots

### 1. Landing Page
![Landing Page](https://images.unsplash.com/photo-1611605698325-8b1569810432?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80)
*Beautiful landing page with clear call-to-action*

### 2. Chat Interface (Light Mode)
![Chat Light Mode](https://images.unsplash.com/photo-1577563908411-5077b6dc7624?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80)
*Clean, modern chat interface with conversation sidebar*

### 3. Chat Interface (Dark Mode)
![Chat Dark Mode](https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80)
*Easy on the eyes dark mode for nighttime chatting*

### 4. User Profile
![User Profile](https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w-800&q=80)
*Complete user profile with editable information*

## Technology Stack

### Backend
- **Django 5.2** - Python web framework
- **Django REST Framework** - API endpoints
- **Django Channels** - WebSocket support for real-time chat
- **Django Allauth** - User authentication
- **SQLite** - Database (easy to switch to PostgreSQL)
- **Redis** - Message broker for WebSockets (development uses in-memory)

### Frontend
- **Vue.js 3** - Reactive frontend framework
- **Vanilla JavaScript** - Additional functionality
- **CSS3 with CSS Variables** - Theme system for dark/light mode
- **Font Awesome** - Icons
- **WebSocket API** - Real-time communication

### Development Tools
- **Git** - Version control
- **VS Code** - Development environment
- **Chrome DevTools** - Debugging
- **Postman** - API testing

## Project Structure

```
core/                      # Django project root
├── accounts/             # User authentication app
│   ├── models.py        # Custom User model with profile fields
│   ├── views.py         # Authentication and profile views
│   ├── serializers.py   # API serializers for user data
│   ├── urls.py          # Authentication URLs
│   └── admin.py         # Admin panel configuration
├── chat/                 # Chat application
│   ├── models.py        # Conversation and Message models
│   ├── views.py         # Chat views and API endpoints
│   ├── serializers.py   # Chat data serializers
│   ├── consumers.py     # WebSocket consumers
│   ├── routing.py       # WebSocket URL routing
│   └── urls.py          # Chat API URLs
├── static/              # Static files
│   ├── css/
│   │   ├── base.css     # Base styles and theme variables
│   │   ├── auth.css     # Authentication page styles
│   │   └── chat.css     # Chat interface styles
│   └── js/
│       └── chat.js      # Main chat application logic
├── templates/           # HTML templates
│   ├── base.html       # Base template
│   ├── home.html       # Landing page
│   ├── account/        # Authentication templates (allauth)
│   └── chat/           # Chat interface templates
├── media/              # User uploaded files
├── requirements.txt    # Python dependencies
├── manage.py          # Django management script
└── README.md          # This file
```

## Quick Start

### Prerequisites
- Python 3.8 or higher
- Git
- Modern web browser

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/laiba09Saleem/ChatApp.git
   cd chat-app
   ```

2. **Create and activate virtual environment**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Apply database migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser (admin)**
   ```bash
   python manage.py createsuperuser
   # Follow prompts to create admin account
   ```

6. **Create test users (optional)**
   ```bash
   python manage.py shell
   ```
   ```python
   from django.contrib.auth import get_user_model
   User = get_user_model()
   
   # Create test users
   User.objects.create_user('john', 'john@example.com', 'password123', 
                           first_name='John', last_name='Doe')
   User.objects.create_user('jane', 'jane@example.com', 'password123',
                           first_name='Jane', last_name='Smith')
   User.objects.create_user('mike', 'mike@example.com', 'password123',
                           first_name='Mike', last_name='Johnson')
   ```

7. **Run the development server**
   ```bash
   python manage.py runserver
   ```

8. **Access the application**
   - Open browser and go to: `http://127.0.0.1:8000`
   - Landing page: `http://127.0.0.1:8000`
   - Login: `http://127.0.0.1:8000/accounts/login/`
   - Signup: `http://127.0.0.1:8000/accounts/signup/`
   - Chat: `http://127.0.0.1:8000/chat/` (after login)
   - Admin: `http://127.0.0.1:8000/admin/`

## Configuration

### Environment Variables
Create a `.env` file in the project root:
```env
# Basic Configuration
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite by default)
DATABASE_URL=sqlite:///db.sqlite3

# For production, use PostgreSQL:
# DATABASE_URL=postgresql://username:password@localhost:5432/chat_app
```

### Database Configuration
The application uses SQLite by default for easy setup. For production, switch to PostgreSQL in `settings.py`:
```
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

## Using the Application

### 1. Create an Account
- Visit the landing page and click "Sign Up"
- Enter your email, username, and password
- Verify your email (if configured)

### 2. Set Up Your Profile
- Click on your avatar in the sidebar
- Upload a profile picture
- Add your bio and contact information
- Choose your preferred theme (light/dark/auto)

### 3. Start Chatting
- Click the "+" button to start a new chat
- Search for users by name or email
- Select users for 1-on-1 or group chat
- Name your group chat (optional)
- Start sending messages in real-time

### 4. Theme Switching
- Click the moon/sun icon in the top-right
- Choose between Light, Dark, or Auto modes
- Theme preference is saved per user

## API Endpoints

### Authentication
```
POST    /api/auth/register/      # Register new user
POST    /api/auth/login/         # Login user
POST    /api/auth/logout/        # Logout user
GET     /api/auth/me/            # Get current user
PATCH   /api/auth/profile/       # Update user profile
POST    /api/auth/set-theme/     # Set theme preference
POST    /api/auth/update-status/ # Update online status
GET     /api/auth/users/         # List users
GET     /api/auth/users/<id>/    # Get user details
```

### Chat
```
GET     /api/conversations/                   # List conversations
POST    /api/conversations/create_chat/       # Create new conversation
GET     /api/conversations/<id>/              # Get conversation
GET     /api/conversations/<id>/messages/     # Get messages
POST    /api/conversations/<id>/mark_read/    # Mark as read
POST    /api/messages/                        # Send message
POST    /api/messages/mark_as_read/           # Mark messages as read
GET     /api/messages/unread_count/           # Get unread count
GET     /api/search-users/                    # Search users
GET     /api/recent-contacts/                 # Get recent contacts
GET     /api/search-messages/                 # Search messages
```

### WebSocket
```
ws://localhost:8000/ws/chat/<conversation_id>/  # Real-time chat
```

## Theme System

The application features a comprehensive theme system:

### Theme Modes
1. **Light Mode**: Default bright interface
2. **Dark Mode**: Dark interface for reduced eye strain
3. **Auto Mode**: Automatically switches based on system preference

### Implementation Details
- CSS Variables for easy theming
- Smooth transitions between themes
- User preference persistence
- System preference detection

### CSS Variables Example
```css
:root {
    /* Light Theme */
    --bg-primary: #ffffff;
    --text-primary: #212529;
    --primary-color: #667eea;
}

[data-theme="dark"] {
    /* Dark Theme */
    --bg-primary: #0f172a;
    --text-primary: #f1f5f9;
    --primary-color: #818cf8;
}
```

## Responsive Design

The application is fully responsive across all devices:

### Breakpoints
- **Mobile (< 768px)**: Collapsible sidebar, optimized message layout
- **Tablet (768px - 1024px)**: Sidebar remains open, adjusted spacing
- **Desktop (> 1024px)**: Full interface with all features visible

### Mobile Features
- Hamburger menu to toggle sidebar
- Touch-friendly buttons and inputs
- Optimized message bubbles for small screens
- Responsive typography

## Security Features

- **Django's built-in security**: CSRF protection, XSS prevention, SQL injection protection
- **Secure authentication**: Password hashing, session management
- **File upload validation**: Image type and size validation
- **HTTPS ready**: Configured for secure connections
- **Input sanitization**: All user inputs are properly sanitized

## Troubleshooting

### Common Issues and Solutions

1. **"TemplateDoesNotExist" error**
   ```
   Solution: Ensure all template files are in the correct directories
   ```

2. **WebSocket connection fails**
   ```
   Solution: Make sure you're running the server with Daphne or using runserver
   ```

3. **Static files not loading**
   ```
   Solution: Run `python manage.py collectstatic`
   ```

4. **Database errors**
   ```
   Solution: Run `python manage.py migrate` to apply migrations
   ```

5. **"ModuleNotFoundError"**
   ```
   Solution: Ensure all requirements are installed: `pip install -r requirements.txt`
   ```

### Development Tips
- Use Chrome DevTools for debugging
- Check browser console for JavaScript errors
- Use Django's debug toolbar if installed
- Monitor Django server logs for backend errors

## Deployment

### For Production

1. **Update settings.py**
   ```python
   DEBUG = False
   ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']
   ```

2. **Set up PostgreSQL**
   ```bash
   sudo apt-get install postgresql postgresql-contrib
   sudo -u postgres createdb chat_app
   sudo -u postgres createuser --pwprompt chat_user
   ```

3. **Configure static files**
   ```bash
   python manage.py collectstatic
   ```

4. **Set up Gunicorn**
   ```bash
   pip install gunicorn
   gunicorn core.wsgi:application
   ```

5. **Set up Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location /static/ {
           alias /path/to/static/files/;
       }
       
       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Deployment Platforms

#### Heroku
```bash
heroku create your-chat-app
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
heroku run python manage.py migrate
```

#### Railway
```bash
railway up
# Follow Railway CLI prompts
```

#### PythonAnywhere
- Upload project files
- Configure virtual environment
- Set up static files
- Configure WSGI file

## Contributing

We welcome contributions! Here's how you can help:

### Reporting Bugs
1. Check if the bug already exists in issues
2. Create a new issue with detailed steps to reproduce
3. Include screenshots if applicable

### Suggesting Features
1. Check existing feature requests
2. Create a new issue with detailed description
3. Explain the use case and benefits

### Code Contributions
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests if applicable
5. Submit a pull request

### Development Setup for Contributors
```bash
# Fork and clone
git clone https://github.com/yourusername/chat-app.git
cd chat-app

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install development dependencies
pip install -r requirements.txt
pip install black flake8  # For code formatting

# Set up pre-commit hooks (optional)
pre-commit install

# Run tests
python manage.py test
```

## Acknowledgments

- **Django** - The web framework for perfectionists with deadlines
- **Vue.js** - The progressive JavaScript framework
- **Font Awesome** - Beautiful icons
- **All contributors** - Thank you for your support and contributions

### Roadmap
- [ ] AI-powered features
- [ ] Voice/video calling
- [ ] Mobile app (React Native)
- [ ] End-to-end encryption
- [ ] Advanced analytics

---

<div align="center">

### Built with 💙 by [Your Name]

[![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Vue.js](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D)](https://vuejs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://javascript.com)

⭐ **Star this repo if you find it useful!** ⭐

</div>
```

## 📁 Also create a `.gitignore` file:

```gitignore
# Django
*.log
*.pot
*.pyc
__pycache__/
local_settings.py
db.sqlite3
db.sqlite3-journal
media/

# Virtual Environment
venv/
env/
ENV/
.env
.venv

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Static files (collected)
staticfiles/

# Coverage reports
htmlcov/
.coverage
.coverage.*
*.cover

# PyCharm
.idea/

# Database backups
*.backup

# Logs
logs/
*.log

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Temporary files
tmp/
temp/
```

## 📁 Create a `requirements.txt` file that matches what we actually use:

```txt
# Core Django
Django==5.2.7
djangorestframework==3.14.0

# Real-time features
channels==4.0.0
channels-redis==4.1.0
daphne==4.0.0

# Authentication
django-allauth==0.58.2

# Database
psycopg2-binary==2.9.9  # For PostgreSQL, optional

# File handling
Pillow==10.1.0

# Development
python-decouple==3.8
whitenoise==6.6.0

# CORS (for API)
django-cors-headers==4.3.1

# Note: We're NOT using OpenAI in this version
# If you want AI features, add: openai==1.3.0
```

## 📁 Create a simple deployment guide `DEPLOYMENT.md`:

```
# Deployment Guide

## Quick Deployment Options

### Option 1: Railway.app (Easiest)
1. Fork this repository
2. Go to [Railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Connect your GitHub account
5. Select this repository
6. Railway will automatically detect Django and set up everything

### Option 2: PythonAnywhere (Free)
1. Create account on [PythonAnywhere](https://pythonanywhere.com)
2. Open a bash console
3. Clone your repository:
   ```bash
   git clone https://github.com/yourusername/chat-app.git
   cd chat-app
   ```
4. Create virtual environment:
   ```bash
   mkvirtualenv --python=/usr/bin/python3.10 chat-app
   ```
5. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
6. Set up database:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```
7. Configure web app in PythonAnywhere dashboard
8. Set static files path

### Option 3: Heroku
1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Login:
   ```bash
   heroku login
   ```
3. Create app:
   ```bash
   heroku create your-chat-app-name
   ```
4. Add PostgreSQL:
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```
5. Deploy:
   ```bash
   git push heroku main
   ```
6. Run migrations:
   ```bash
   heroku run python manage.py migrate
   ```

## Environment Variables for Production

Create these in your hosting platform:

```env
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://...  # For PostgreSQL
# OR keep SQLite for simple deployments
```

## Post-Deployment Steps

1. **Collect static files:**
   ```bash
   python manage.py collectstatic --noinput
   ```

2. **Create admin user:**
   ```bash
   python manage.py createsuperuser
   ```

3. **Set up WebSockets:**
   - Use Daphne as ASGI server
   - Configure Redis for production

4. **Set up domain and SSL:**
   - Point domain to your server
   - Install SSL certificate (Let's Encrypt)

## Monitoring

- Check Django logs regularly
- Monitor database performance
- Set up error tracking (Sentry)
- Regular backups
```

