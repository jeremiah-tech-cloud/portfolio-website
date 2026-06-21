/**
 * ==========================================================================
 * DevOS Portfolio Dashboard - Core Runtime Script
 * Handles view switching, dashboard commands, and micro-interactions.
 * ==========================================================================
 */
console.log(document.documentElement);

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Dashboard Modules
    initNavigationEngine();
    initThemeToggleVisual();
    initProjectCardInteractions();
    initScrollSpy();

    // Ensure the page opens scrolled all the way to the top of
    // .dashboard-view, so the designed space above the hero card is
    // visible on first load (rather than any browser default anchor
    // scroll position cutting it off).
    const scrollContainer = document.querySelector('.dashboard-view');
    if (scrollContainer) {
        scrollContainer.scrollTop = 0;
    }
});

/**
 * 1. NAVIGATION ENGINE
 * Handles smooth switching of view states and synchronizes the active sidebar indicators.
 *
 * NOTE: this used to rely on the browser's default anchor-jump behavior
 * (e.preventDefault() was commented out), which scrolls the target
 * section's top edge flush against the scroll container's top edge —
 * ignoring .dashboard-view's intended top padding/breathing room above
 * the hero card. Now we handle the scroll manually so that space stays
 * visible whenever Home is the target.
 */
function initNavigationEngine() {
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
    const scrollContainer = document.querySelector('.dashboard-view');

    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection && scrollContainer) {
                // Take control of the scroll instead of letting the browser
                // jump the section flush to the top of the container.
                e.preventDefault();

                if (targetId === '#home') {
                    // Scroll all the way to the very top of the container,
                    // which reveals the full padding/space above the hero
                    // card exactly as designed.
                    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    // For every other section, scroll so its top aligns
                    // just inside the container (offset by the container's
                    // own top padding so spacing still looks consistent).
                    const containerTopPadding = parseFloat(
                        getComputedStyle(scrollContainer).paddingTop
                    ) || 0;

                    const targetOffset =
                        targetSection.offsetTop - containerTopPadding;

                    scrollContainer.scrollTo({ top: targetOffset, behavior: 'smooth' });
                }
            }

            // Remove active state classes from all navigation nodes
            menuItems.forEach(nav => nav.classList.remove('active'));

            // Assign active class to the currently clicked sidebar option
            this.classList.add('active');

            console.log(`Dashboard viewport shifted to: ${targetId}`);
        });
    });
}

/**
 * 2. FUNCTIONAL THEME TOGGLE SWITCH
 * Flips the architectural layout color profiles between bright and dark modes.
 */
function initThemeToggleVisual() {
    const toggleBtn = document.querySelector('.theme-toggle-btn');
    
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => { 
        // Dynamically toggle the class on the body element
        document.body.classList.toggle('dark-theme');
        
        // Console feedback to monitor state shifts
        const isLightModeActive = document.body.classList.contains('light-theme');
        console.log(`Theme Engine State: ${isLightModeActive ? 'Bright Light UI' : 'Core Dark UI'}`);
        
        // Add a temporary subtle flash click animation feedback to the button
        toggleBtn.style.transform = 'scale(0.9)';
        setTimeout(() => {
            toggleBtn.style.transform = 'scale(1)';
        }, 100);
    });
}

/**
 * 3. PROJECT CARD TOUCH/HOVER INTERACTIONS
 * Adds interactive log messaging to simulate API click telemetry analytics on live developer repositories.
 */
function initProjectCardInteractions() {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        const title = card.querySelector('.project-title').textContent;
        const liveDemoBtn = card.querySelector('.btn-demo');
        const githubBtn = card.querySelector('.btn-github');

        if (liveDemoBtn) {
            liveDemoBtn.addEventListener('click', (e) => {
                // e.preventDefault(); // Uncomment if preventing immediate navigation during testing
                console.log(`Telemetry Event Logged: Redirecting production deployment traffic to ${title} live URL.`);
            });
        }

        if (githubBtn) {
            githubBtn.addEventListener('click', (e) => {
                // e.preventDefault();
                console.log(`Telemetry Event Logged: Repository source pull request initialized for ${title}.`);
            });
        }
    });
}

/**
 * 4. SCROLLSPY ENGINE
 * Watches each <section> inside .dashboard-view (the actual scroll container,
 * not the window) and keeps the sidebar's "active" highlight in sync with
 * whichever section is currently in view as the user scrolls — instead of
 * the highlight only updating on click.
 *
 * NOTE: an earlier version used a fixed rootMargin "center band" trick,
 * which caused shorter sections (like Projects) to get skipped entirely
 * when scrolling down quickly, because the band could jump from one
 * section straight into the next without ever landing inside a short
 * section's bounds. This version tracks each section's visible ratio
 * directly and always picks whichever section is most visible right now,
 * which works correctly regardless of section height or scroll direction.
 */
function initScrollSpy() {
    const scrollContainer = document.querySelector('.dashboard-view');
    const sections = document.querySelectorAll('.dashboard-view > section[id]');
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');

    if (!scrollContainer || !sections.length || !menuItems.length) return;

    // Map each section id -> its matching sidebar link, so we can flip
    // the active state without re-querying the DOM on every scroll tick.
    const menuItemById = {};
    menuItems.forEach(item => {
        const href = item.getAttribute('href'); // e.g. "#about"
        if (href && href.startsWith('#')) {
            menuItemById[href.slice(1)] = item;
        }
    });

    // Tracks the current visible ratio of every section at all times,
    // so we can always compare across all of them, not just the ones
    // included in the latest observer callback batch.
    const visibleRatios = {};
    sections.forEach(section => { visibleRatios[section.id] = 0; });

    function setActiveMenuItem(sectionId) {
        const targetItem = menuItemById[sectionId];
        if (!targetItem) return;

        menuItems.forEach(nav => nav.classList.remove('active'));
        targetItem.classList.add('active');
    }

    function updateActiveFromRatios() {
        let bestId = null;
        let bestRatio = 0;

        Object.keys(visibleRatios).forEach(id => {
            if (visibleRatios[id] > bestRatio) {
                bestRatio = visibleRatios[id];
                bestId = id;
            }
        });

        if (bestId) {
            setActiveMenuItem(bestId);
        }
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                visibleRatios[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
            });
            updateActiveFromRatios();
        },
        {
            root: scrollContainer,
            // Multiple thresholds so the callback fires continuously as
            // visibility changes, instead of only at one fixed point —
            // this is what lets short sections register properly.
            threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        }
    );

    sections.forEach(section => observer.observe(section));
}