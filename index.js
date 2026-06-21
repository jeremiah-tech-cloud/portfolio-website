/**
 * ==========================================================================
 * DevOS Portfolio Dashboard - Core Runtime Script
 * Handles view switching, theme toggle, scroll spy, and mobile sidebar.
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    initContactProtection();   // FIX 2: Must run first — builds real contact links
    initNavigationEngine();
    initThemeToggleVisual();
    initProjectCardInteractions();
    initScrollSpy();
    initMobileSidebar();

    const scrollContainer = document.querySelector('.dashboard-view');
    if (scrollContainer) scrollContainer.scrollTop = 0;
});


/* ==========================================================================
   FIX 2. CONTACT PROTECTION
   Email and WhatsApp number are stored as split data-attributes in the HTML
   so bots and scrapers never see the real values in the source code.
   This function reassembles them at runtime — only real browsers execute JS.
   ========================================================================== */
function initContactProtection() {
    // Rebuild email: data-u="jeremiahpetter040" + data-d="gmail.com"
    const emailLink = document.getElementById('contactEmail');
    if (emailLink) {
        const u = emailLink.getAttribute('data-u');
        const d = emailLink.getAttribute('data-d');
        emailLink.href = 'mailto:' + u + '@' + d;
    }

    // Rebuild WhatsApp: data-n="255682823767"
    const waLink = document.getElementById('contactWhatsapp');
    if (waLink) {
        const n = waLink.getAttribute('data-n');
        waLink.href = 'https://wa.me/' + n;
    }
}


/* ==========================================================================
   1. NAVIGATION ENGINE
   On desktop (>1024px) the real scroll container is .dashboard-view.
   On tablet/mobile (≤1024px) html/body scroll, so we use window instead.
   ========================================================================== */
function initNavigationEngine() {
    const menuItems     = document.querySelectorAll('.sidebar-menu .menu-item');
    const dashboardView = document.querySelector('.dashboard-view');

    menuItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId      = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (!targetSection) return;

            // Add to new item FIRST, then remove from others —
            // ensures there is never a frame where no item is active (grey flash fix)
            this.classList.add('active');
            menuItems.forEach(nav => { if (nav !== this) nav.classList.remove('active'); });

            // Lock the scroll spy so it doesn't override the active state
            // while the smooth-scroll animation is running
            setNavLock(900);

            const isDesktop = window.innerWidth > 1024;

            if (isDesktop) {
                if (targetId === '#home') {
                    dashboardView.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    const topPadding = parseFloat(
                        getComputedStyle(dashboardView).paddingTop
                    ) || 0;
                    dashboardView.scrollTo({
                        top: targetSection.offsetTop - topPadding,
                        behavior: 'smooth'
                    });
                }
            } else {
                const navbar       = document.querySelector('.top-navbar');
                const navbarHeight = navbar ? navbar.offsetHeight : 60;

                if (targetId === '#home') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    const sectionTop =
                        targetSection.getBoundingClientRect().top +
                        window.scrollY -
                        navbarHeight - 8;
                    window.scrollTo({ top: sectionTop, behavior: 'smooth' });
                }
            }
        });
    });
}


/* ==========================================================================
   2. THEME TOGGLE  (Light ↔ Dark)
   ========================================================================== */
function initThemeToggleVisual() {
    const toggleBtn = document.querySelector('.theme-toggle-btn');
    if (!toggleBtn) return;

    if (localStorage.getItem('portfolioTheme') === 'dark') {
        document.body.classList.add('dark-theme');
    }

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');

        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('portfolioTheme', isDark ? 'dark' : 'light');

        toggleBtn.style.transform = 'scale(0.9)';
        setTimeout(() => { toggleBtn.style.transform = 'scale(1)'; }, 100);
    });
}


/* ==========================================================================
   3. PROJECT CARD INTERACTIONS
   ========================================================================== */
function initProjectCardInteractions() {
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        const title       = card.querySelector('.project-title').textContent.trim();
        const liveDemoBtn = card.querySelector('.btn-demo');
        const githubBtn   = card.querySelector('.btn-github');

        if (liveDemoBtn) {
            liveDemoBtn.addEventListener('click', () => {
                console.log(`Telemetry: Live Demo clicked → ${title}`);
            });
        }

        if (githubBtn) {
            githubBtn.addEventListener('click', () => {
                console.log(`Telemetry: GitHub clicked → ${title}`);
            });
        }
    });
}


/* ==========================================================================
   4. SCROLL SPY ENGINE
   navLocked flag: true while a programmatic smooth-scroll is running.
   Prevents the observer from overriding the active nav item mid-scroll.
   ========================================================================== */
let navLocked    = false;
let navLockTimer = null;

function setNavLock(ms) {
    navLocked = true;
    clearTimeout(navLockTimer);
    navLockTimer = setTimeout(() => { navLocked = false; }, ms);
}

function initScrollSpy() {
    const scrollContainer = document.querySelector('.dashboard-view');
    const sections        = document.querySelectorAll('.dashboard-view > section[id]');
    const menuItems       = document.querySelectorAll('.sidebar-menu .menu-item');

    if (!scrollContainer || !sections.length || !menuItems.length) return;

    const menuItemById = {};
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href.startsWith('#')) {
            menuItemById[href.slice(1)] = item;
        }
    });

    const visibleRatios = {};
    sections.forEach(section => { visibleRatios[section.id] = 0; });

    function setActiveMenuItem(sectionId) {
        const target = menuItemById[sectionId];
        if (!target) return;
        // Add to target first, then remove from others — no grey flash
        target.classList.add('active');
        menuItems.forEach(nav => { if (nav !== target) nav.classList.remove('active'); });
    }

    function updateActiveFromRatios() {
        // Skip while a nav-click scroll animation is running
        if (navLocked) return;

        let bestId    = null;
        let bestRatio = 0;
        Object.keys(visibleRatios).forEach(id => {
            if (visibleRatios[id] > bestRatio) {
                bestRatio = visibleRatios[id];
                bestId    = id;
            }
        });
        if (bestId) setActiveMenuItem(bestId);
    }

    let observer;

    function buildObserver() {
        if (observer) observer.disconnect();

        const isDesktop = window.innerWidth > 1024;

        observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    visibleRatios[entry.target.id] = entry.isIntersecting
                        ? entry.intersectionRatio
                        : 0;
                });
                updateActiveFromRatios();
            },
            {
                root: isDesktop ? scrollContainer : null,
                threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
            }
        );

        sections.forEach(section => observer.observe(section));
    }

    buildObserver();
    window.addEventListener('resize', buildObserver);
}


/* ==========================================================================
   5. MOBILE SIDEBAR TOGGLE
   ========================================================================== */
function initMobileSidebar() {
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const sidebar      = document.querySelector('.sidebar');
    const overlay      = document.querySelector('.sidebar-overlay');
    const menuItems    = document.querySelectorAll('.sidebar-menu .menu-item');

    if (!hamburgerBtn || !sidebar || !overlay) return;

    function openSidebar() {
        document.body.classList.add('sidebar-open');
        overlay.classList.add('active');
    }

    function closeSidebar() {
        document.body.classList.remove('sidebar-open');
        overlay.classList.remove('active');
    }

    hamburgerBtn.addEventListener('click', () => {
        document.body.classList.contains('sidebar-open')
            ? closeSidebar()
            : openSidebar();
    });

    overlay.addEventListener('click', closeSidebar);

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            setTimeout(closeSidebar, 150);
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) closeSidebar();
    });
}
