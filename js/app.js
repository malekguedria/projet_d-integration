/**
 * StageFlow — Main Application & UI Interactions
 */

// Toast Notifications
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="flex:1;">${message}</div>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:#FFF;cursor:pointer;font-size:16px;">&times;</button>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// Modal Helpers
function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
}

// Global Notification dropdown
function toggleNotifications() {
    const p = document.getElementById('notification-panel');
    if (p) p.classList.toggle('active');
}

function clearAllNotifications() {
    const list = document.getElementById('notifications-list');
    if (list) list.innerHTML = '<div style="padding:20px;text-align:center;color:#64748B;font-size:12px;">Aucune nouvelle notification</div>';
    const dot = document.getElementById('unread-dot');
    if (dot) dot.style.display = 'none';
    showToast('Toutes les notifications ont été marquées comme lues', 'info');
}

function handleGlobalSearch(val) {
    if (val.length > 2) {
        console.log('Recherche globale :', val);
    }
}

function triggerExport(type) {
    showToast(`Export ${type} généré avec succès !`, 'success');
}

function openHelpModal() {
    showToast(`Centre d'aide StageFlow — Support institutionnel disponible 24/7`, 'info');
}

function openUserProfileModal() {
    const user = Auth.getUser();
    showToast(`Profil connecté : ${user ? user.name : 'Utilisateur'} (${user ? user.roleLabel : ''})`, 'info');
}

// Close dropdowns on click outside
document.addEventListener('click', (e) => {
    const notifPanel = document.getElementById('notification-panel');
    const notifBtn = e.target.closest('.action-icon-btn');
    if (notifPanel && !notifPanel.contains(e.target) && !notifBtn) {
        notifPanel.classList.remove('active');
    }
});

// Keyboard Shortcut ⌘K / Ctrl+K
document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const search = document.getElementById('global-search-input');
        if (search) search.focus();
    }
});
