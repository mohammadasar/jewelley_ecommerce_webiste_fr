// Keep track of initialization to avoid re-triggering one-time animations on filter
let globalAnimationsInitialized = false;

function initScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn("GSAP is not loaded.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // --- 1. Dynamic Product Cards Batch Animation (Runs every time products render) ---
    const productCards = gsap.utils.toArray('.product-card');

    if (productCards.length > 0) {
        // Kill existing product batch triggers for clean re-renders (filtering)
        ScrollTrigger.getAll().forEach(trigger => {
            if (trigger.vars.id === 'productBatch') {
                trigger.kill();
            }
        });

        gsap.set(productCards, { autoAlpha: 0, y: 60 });

        ScrollTrigger.batch(productCards, {
            id: 'productBatch',
            start: "top 85%",
            onEnter: batch => {
                gsap.to(batch, {
                    autoAlpha: 1,
                    y: 0,
                    stagger: 0.1,
                    duration: 0.8,
                    ease: "power3.out",
                    overwrite: true
                });
            }
        });
    }

    // --- 2. Global One-Time Animations (Hero, Parallax, UI Elements) ---
    if (!globalAnimationsInitialized) {

        // A. Hero Section Parallax (Image moves slower than scrolling)
        gsap.utils.toArray('.slide img').forEach(img => {
            gsap.to(img, {
                yPercent: 30, // Parallax depth
                ease: "none",
                scrollTrigger: {
                    trigger: ".hero",
                    start: "top top",
                    end: "bottom top", // Ends when hero leaves viewport
                    scrub: true
                }
            });
        });

        // B. Hero Text Step-by-Step Appearance
        // Select all text elements inside the slide info box
        const heroInfoElements = gsap.utils.toArray('.slide .info > *');
        if (heroInfoElements.length > 0) {
            gsap.fromTo(heroInfoElements,
                { autoAlpha: 0, y: 40 },
                {
                    autoAlpha: 1,
                    y: 0,
                    stagger: 0.15, // Step-by-step delay
                    duration: 1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: ".hero",
                        start: "top 80%"
                    }
                }
            );
        }

        // C. Category Items Step-by-Step
        const categoryItems = gsap.utils.toArray('.category-item');
        if (categoryItems.length > 0) {
            gsap.fromTo(categoryItems,
                { autoAlpha: 0, x: -30 },
                {
                    autoAlpha: 1,
                    x: 0,
                    stagger: 0.1,
                    duration: 0.6,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: ".category-bar-section",
                        start: "top 90%"
                    }
                }
            );
        }

        // D. Header and Filters
        gsap.fromTo(".products__header",
            { autoAlpha: 0, y: -20 },
            { autoAlpha: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: ".products", start: "top 85%" } }
        );

        gsap.fromTo(".filters",
            { autoAlpha: 0, x: -40 },
            { autoAlpha: 1, x: 0, duration: 0.8, scrollTrigger: { trigger: ".main", start: "top 85%" } }
        );

        // E. Footer Columns Step-by-Step
        const footerCols = gsap.utils.toArray('.footer__column');
        if (footerCols.length > 0) {
            gsap.fromTo(footerCols,
                { autoAlpha: 0, y: 40 },
                {
                    autoAlpha: 1,
                    y: 0,
                    stagger: 0.2, // Step-by-step delay
                    duration: 0.8,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: ".footer",
                        start: "top 95%"
                    }
                }
            );
        }

        globalAnimationsInitialized = true;
    }

    // Refresh ScrollTrigger to recalculate positions correctly after dynamic DOM updates
    ScrollTrigger.refresh();
}
