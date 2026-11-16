/**
 * StageFlow - Authentication & Session Management
 */
const Auth = {
    // Current session key
    SESSION_KEY: 'stageflow_user_session',

    // Login user
    login(email, password) {
        const user = Database.authenticate(email, password);
        if (user) {
            // Save active session
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
            return { success: true, user: user };
        }
        return { 
            success: false, 
            message: "Adresse e-mail ou mot de passe incorrect. Vérifiez vos identifiants." 
        };
    },

    // Logout
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
        window.location.href = 'index.html';
    },

    // Get currently logged-in user
    getUser() {
        try {
            const data = localStorage.getItem(this.SESSION_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },

    // Guard page access and populate sidebar info
    requireAuth(expectedRole = null) {
        const user = this.getUser();
        if (!user) {
            // Not authenticated, redirect to login
            window.location.href = 'index.html';
            return null;
        }

        // If a specific role is expected and user has a different role, handle accordingly
        // Update user card in sidebar if present
        const avatarEl = document.getElementById('sidebar-avatar');
        const nameEl = document.getElementById('sidebar-user-name');
        const roleEl = document.getElementById('sidebar-user-role');

        if (avatarEl) avatarEl.textContent = user.avatar || 'SF';
        if (nameEl) nameEl.textContent = user.name || 'Utilisateur';
        if (roleEl) roleEl.textContent = user.roleLabel || user.role || 'Espace membre';

        return user;
    }
};
