class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.sunIcon = document.getElementById('sunIcon');
        this.moonIcon = document.getElementById('moonIcon');
        this.theme = this.getTheme();
        this.init();
    }

    init() {
        this.applyTheme();
        
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        this.updateButtonIcon();
    }

    getTheme() {
        const savedTheme = localStorage.getItem('chatTheme');
        if (savedTheme) return savedTheme;

        const userTheme = document.body.dataset.userTheme;
        if (userTheme && ['light', 'dark', 'auto'].includes(userTheme)) {
            return userTheme;
        }

        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        
        return 'light';
    }

    applyTheme() {
        let themeToApply = this.theme;
        
        if (themeToApply === 'auto') {
            themeToApply = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        document.documentElement.setAttribute('data-theme', themeToApply);
        localStorage.setItem('chatTheme', this.theme);
        
        this.updateButtonIcon();
        
        document.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: themeToApply } }));
    }

    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.theme);
        this.theme = themes[(currentIndex + 1) % themes.length];
        this.applyTheme();
        
        this.saveThemeToServer();
    }

    updateButtonIcon() {
        if (!this.themeToggle || !this.sunIcon || !this.moonIcon) return;
        
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        if (this.theme === 'auto') {
            this.sunIcon.style.display = 'inline-block';
            this.moonIcon.style.display = 'inline-block';
            this.sunIcon.style.opacity = isDark ? '0.5' : '1';
            this.moonIcon.style.opacity = isDark ? '1' : '0.5';
        } else {
            if (this.theme === 'dark') {
                this.sunIcon.style.display = 'none';
                this.moonIcon.style.display = 'inline-block';
                this.moonIcon.style.opacity = '1';
            } else {
                this.sunIcon.style.display = 'inline-block';
                this.moonIcon.style.display = 'none';
                this.sunIcon.style.opacity = '1';
            }
        }
    }

    async saveThemeToServer() {
        try {
            const response = await fetch('/api/auth/set-theme/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken(),
                },
                body: JSON.stringify({ theme: this.theme })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save theme');
            }
        } catch (error) {
            console.warn('Could not save theme to server:', error);
        }
    }

    getCSRFToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        return cookieValue || '';
    }

    listenForSystemThemeChange() {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.theme === 'auto') {
                this.applyTheme();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
    window.themeManager.listenForSystemThemeChange();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}