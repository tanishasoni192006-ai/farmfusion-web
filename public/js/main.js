/**
 * FarmFusion Web – Core Client-Side Utilities
 * Handles session state, active menu highlighting, notification toasts,
 * formatters, and logout triggers.
 */

// Global State
let currentUser = null;
let currentProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Setup mobile sidebar toggle if present
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const farmSidebar = document.getElementById('farmSidebar');
    if (sidebarToggleBtn && farmSidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            farmSidebar.classList.toggle('show');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 992) {
                if (!farmSidebar.contains(e.target) && !sidebarToggleBtn.contains(e.target)) {
                    farmSidebar.classList.remove('show');
                }
            }
        });
    }

    // 2. Highlight active nav link based on current path
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (href === currentPath || (currentPath === '/' && href === 'index.html') || currentPath.endsWith(href))) {
            link.classList.add('active');
        }
    });

    // 3. Check Authentication Status
    await checkAuthStatus();

    // 4. Attach logout button handlers
    const logoutBtns = document.querySelectorAll('.btn-logout');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', handleLogout);
    });
});

/**
 * Checks current session state with backend API
 */
async function checkAuthStatus() {
    try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (data.authenticated && data.user) {
            currentUser = data.user;
            currentProfile = data.profile;
            updateAuthUI(true, data.user, data.profile);
        } else {
            currentUser = null;
            currentProfile = null;
            updateAuthUI(false);
        }
    } catch (err) {
        console.warn('Auth check could not reach server:', err);
    }
}

/**
 * Updates UI elements based on authentication state
 */
function updateAuthUI(isLoggedIn, user = null, profile = null) {
    // Header/Sidebar user badges
    const userNameElements = document.querySelectorAll('.farmer-name-display');
    const userEmailElements = document.querySelectorAll('.farmer-email-display');
    const userInitials = document.querySelectorAll('.farmer-avatar-initials');

    if (isLoggedIn && user) {
        userNameElements.forEach(el => el.textContent = user.full_name);
        userEmailElements.forEach(el => el.textContent = user.email);
        userInitials.forEach(el => {
            el.textContent = user.full_name ? user.full_name.charAt(0).toUpperCase() : 'F';
        });

        // Toggle auth nav buttons on public pages
        document.querySelectorAll('.guest-only').forEach(el => el.classList.add('d-none'));
        document.querySelectorAll('.auth-only').forEach(el => el.classList.remove('d-none'));
    } else {
        document.querySelectorAll('.guest-only').forEach(el => el.classList.remove('d-none'));
        document.querySelectorAll('.auth-only').forEach(el => el.classList.add('d-none'));
    }
}

/**
 * Global Logout handler
 */
async function handleLogout(e) {
    if (e) e.preventDefault();
    try {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            window.location.href = '/login.html';
        }
    } catch (err) {
        console.error('Logout error:', err);
        window.location.href = '/login.html';
    }
}

/**
 * Helper to display floating toast messages
 */
function showToast(type, message, title = '') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    const toastId = 'toast_' + Date.now();
    const bgClass = type === 'success' ? 'bg-success text-white' :
                    type === 'error' ? 'bg-danger text-white' :
                    type === 'warning' ? 'bg-warning text-dark' : 'bg-primary text-white';

    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${title ? `<strong>${title}</strong><br>` : ''}
                    ${message}
                </div>
                <button type="button" class="btn-close ${type !== 'warning' ? 'btn-close-white' : ''} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = document.getElementById(toastId);
    if (window.bootstrap && window.bootstrap.Toast) {
        const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
        bsToast.show();
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    }
}

/**
 * Formatting Utilities
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}
