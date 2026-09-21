document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initObserver();
    initButtonGlow();
    initFaqAccordions();
});

function initNav() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            const isOpen = hamburger.classList.toggle('open');
            navMenu.classList.toggle('active', isOpen);
            hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Keyboard support — Enter and Space
        hamburger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                hamburger.click();
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger?.classList.remove('open');
            navMenu?.classList.remove('active');
            hamburger?.setAttribute('aria-expanded', 'false');
        });
    });

    // Active link detection for clean URLs
    const path = window.location.pathname;
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (
            href === path ||
            (path === '/' && href === '/') ||
            (path.endsWith(href) && href !== '/')
        ) {
            link.classList.add('active');
        }
    });
}

function initObserver() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('animate-in');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

    document.querySelectorAll('.fade-in, .featured-card, .service-card, .project-card, .cert-card, .skill-category, .availability-card, .step').forEach(el => obs.observe(el));
}

function initButtonGlow() {
    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const r = btn.getBoundingClientRect();
            btn.style.setProperty('--x', (e.clientX - r.left) + 'px');
            btn.style.setProperty('--y', (e.clientY - r.top) + 'px');
        });
    });
}

function initFaqAccordions() {
    document.querySelectorAll('.faq-question').forEach(btn => {
        // Set initial aria-expanded state
        btn.setAttribute('aria-expanded', 'false');

        const answerId = 'faq-answer-' + Math.random().toString(36).substr(2, 9);
        const answer = btn.nextElementSibling;
        if (answer) {
            answer.setAttribute('id', answerId);
            btn.setAttribute('aria-controls', answerId);
        }

        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const isOpen = item.classList.contains('open');

            // Close all
            document.querySelectorAll('.faq-item').forEach(i => {
                i.classList.remove('open');
                const q = i.querySelector('.faq-question');
                if (q) q.setAttribute('aria-expanded', 'false');
            });

            // Open clicked if it was closed
            if (!isOpen) {
                item.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

// Toast utility — call from any page
function showToast(message, type = 'success') {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast ${type}`;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });
    setTimeout(() => toast.classList.remove('show'), 3500);
}
