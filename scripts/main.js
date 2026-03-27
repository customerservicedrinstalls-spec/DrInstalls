// Main JavaScript for DR Installs Website
console.log('=== DR INSTALLS SCRIPT LOADED ===');

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM CONTENT LOADED ===');
    // Initialize all components
    initHeroSlider();
    initPortfolioFilter();
    initMobileMenu();
    initSmoothScrolling();
    initFormHandling();
    initScrollEffects();
    initServiceModals();
});

// Hero Slider
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slider .slide');
    const heroTitle = document.querySelector('.hero-title');
    const services = ['Pool Installation', 'Deck Construction', 'Professional Landscaping'];
    let currentSlide = 0;

    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
        
        // Update hero text
        const highlight = heroTitle.querySelector('.highlight');
        if (highlight) {
            highlight.textContent = services[currentSlide];
        }
    }

    // Auto-advance slides every 5 seconds
    setInterval(nextSlide, 5000);
}

// Portfolio Filter
function initPortfolioFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Filter portfolio items
            portfolioItems.forEach(item => {
                const category = item.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 100);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// Mobile Menu
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
}

// Smooth Scrolling
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Form Handling with AJAX
function initFormHandling() {
    console.log('=== INITIALIZING FORM HANDLING ===');
    const forms = document.querySelectorAll('form.consultation-form');
    console.log('Found forms:', forms.length);
    
    forms.forEach((form, index) => {
        console.log(`Form ${index + 1}:`, form);
        console.log(`Form action:`, form.action);
        
        form.addEventListener('submit', function(e) {
            console.log('=== FORM SUBMIT EVENT TRIGGERED ===');
            e.preventDefault(); // Always prevent default to handle with AJAX
            
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            
            // Basic form validation
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = '#ef4444';
                } else {
                    field.style.borderColor = '#10b981';
                }
            });
            
            if (!isValid) {
                console.log('Form validation failed');
                showNotification('Please fill in all required fields.', 'error');
                return;
            }
            
            console.log('Form validation passed');
            
            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="bi bi-hourglass-split"></i> Sending...';
            
            // Prepare form data
            const formData = new FormData(form);
            
            // Debug: Log form data
            console.log('=== FORM SUBMISSION DEBUG ===');
            console.log('Submitting form to:', form.action);
            console.log('Form data:');
            for (let [key, value] of formData.entries()) {
                console.log(`  ${key}: ${value}`);
            }
            
            // Submit via AJAX
            fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                console.log('Response status:', response.status);
                console.log('Response ok:', response.ok);
                console.log('Response headers:', response.headers);
                
                return response.text().then(text => {
                    console.log('Response text:', text);
                    
                    // Try to parse as JSON
                    let data;
                    try {
                        data = JSON.parse(text);
                        console.log('Response JSON:', data);
                    } catch (e) {
                        console.log('Response is not JSON');
                        data = { message: text };
                    }
                    
                    if (response.ok) {
                        // Success
                        console.log('Form submitted successfully!');
                        showNotification('Thank you! We\'ll contact you within 24 hours.', 'success');
                        form.reset();
                        
                        // Reset field borders
                        requiredFields.forEach(field => {
                            field.style.borderColor = '';
                        });
                    } else {
                        // Handle errors
                        console.error('Form submission failed with status:', response.status);
                        if (data.errors) {
                            const errorMessages = data.errors.map(error => error.message || error).join(', ');
                            throw new Error(`Formspree error: ${errorMessages}`);
                        } else {
                            throw new Error(`Form submission failed: ${data.message || 'Unknown error'}`);
                        }
                    }
                });
            })
            .catch(error => {
                console.error('Form submission error:', error);
                showNotification('Sorry, there was an error sending your message. Please try again or call us directly at (815) 483-9713.', 'error');
            })
            .finally(() => {
                // Reset button state
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            });
        });
    });
}

// Scroll Effects
function initScrollEffects() {
    // Header background on scroll
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.service-card, .feature, .step, .review-card');
    animateElements.forEach(el => {
        observer.observe(el);
    });
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2563eb'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Dropdown Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('.nav-link');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        // Prevent default click behavior for dropdown links
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    });
});

// Add CSS for animations
const animationStyles = `
    .service-card,
    .feature,
    .step,
    .review-card {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    .service-card.animate-in,
    .feature.animate-in,
    .step.animate-in,
    .review-card.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .header.scrolled {
        background: rgba(255, 255, 255, 0.98);
        box-shadow: 0 2px 30px rgba(0, 0, 0, 0.15);
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    @media (max-width: 768px) {
        .nav-menu {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 60px;
            background: white;
            flex-direction: column;
            padding: 80px 20px 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            z-index: 998;
            transform: translateX(100%);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .nav-menu.active {
            transform: translateX(0);
            opacity: 1;
            visibility: visible;
        }
        
        .mobile-menu-toggle.active span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        
        .mobile-menu-toggle.active span:nth-child(2) {
            opacity: 0;
        }
        
        .mobile-menu-toggle.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -6px);
        }
        
        .dropdown-menu {
            position: static;
            box-shadow: none;
            background: #f8fafc;
            margin-top: 10px;
            opacity: 1;
            visibility: visible;
            transform: none;
        }
    }
`;

// Inject animation styles
const styleSheet = document.createElement('style');
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);


// Service Modal Functionality
function initServiceModals() {
    console.log('Initializing service modals...');
    const serviceLinks = document.querySelectorAll('.service-link[data-service]');
    console.log('Found service links:', serviceLinks.length);
    
    const modal = document.getElementById('serviceModal');
    const modalOverlay = modal?.querySelector('.modal-overlay');
    const modalClose = modal?.querySelector('.modal-close');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    
    console.log('Modal element:', modal);
    
    // Service data
    const serviceData = {
        'inground-pool': {
            title: 'Inground Pool Installation',
            image: 'assets/images/original-projects/inground-pool-1.jpg',
            description: `
                <p>Transform your backyard into a private paradise! DR Installs is thrilled to bring you unbeatable offers on custom inground pools. Act fast and make a splash with these incredible perks.</p>
                
                <p>Enjoy exclusive discounts on our top-of-the-line inground pool packages. Your dream backyard is now more affordable than ever with FREE Upgrades, Fast Installation, Financing Options, and Limited Availability.</p>
                
                <h3>What We Offer:</h3>
                <ul>
                    <li>Custom pool design tailored to your space</li>
                    <li>Professional excavation and site preparation</li>
                    <li>Quality materials and expert installation</li>
                    <li>Complete plumbing and electrical work</li>
                    <li>Financing options available</li>
                    <li>Fast installation timeline</li>
                </ul>
                
                <p>Book your free consultation today to secure your spot for this coming summer! Don't miss the chance to elevate your lifestyle with a custom inground pool.</p>
            `
        },
        'above-ground-pool': {
            title: 'Above Ground Pool Installation',
            image: 'assets/images/instagram/customer-fsdfdsb.jpg',
            description: `
                <p>Looking for a more affordable and faster pool installation option? Our above ground pool installation services provide the perfect solution for families who want to enjoy swimming without the extensive construction time and cost of an inground pool.</p>
                
                <p>Above ground pools are an excellent choice for those seeking a cost-effective way to beat the heat and create lasting family memories. We offer professional installation with quality materials and expert setup.</p>
                
                <h3>Above Ground Pool Benefits:</h3>
                <ul>
                    <li>Fast installation - ready in days, not weeks</li>
                    <li>Cost-effective solution for family fun</li>
                    <li>Various sizes and styles available</li>
                    <li>Professional setup and installation</li>
                    <li>Quality pool materials and equipment</li>
                    <li>Easier maintenance than inground pools</li>
                    <li>Portable - can be relocated if needed</li>
                </ul>
                
                <p>Contact us today to discuss your above ground pool options and get started on creating your backyard oasis!</p>
            `
        },
        'deck': {
            title: 'Deck Construction',
            image: 'assets/images/new-images/deck/FullSizeRender.jpeg',
            description: `
                <p>Our team can help you design and build a custom deck tailored to your preferences and needs. Whether you're looking for a simple platform deck or a multi-level deck with intricate features, we will provide professional installation to bring your vision to life.</p>
                
                <p>We work with quality materials and expert craftsmanship to create decks that are both beautiful and durable, perfect for entertaining or relaxing outdoors.</p>
                
                <h3>Deck Services Include:</h3>
                <ul>
                    <li>Custom deck design and planning</li>
                    <li>Premium decking materials</li>
                    <li>Professional installation</li>
                    <li>Multi-level deck options</li>
                    <li>Railing systems</li>
                    <li>Built-in features available</li>
                </ul>
                
                <p>Let's discuss your project requirements and create a plan to get started on your new deck installation.</p>
            `
        },
        'landscaping': {
            title: 'Landscaping & Final Touches',
            image: 'assets/images/new-images/FullSizeRender.jpg',
            description: `
                <p>We believe that the beauty of your pool extends beyond its blue waters. Introducing our exclusive Final Touches Service – the perfect way to add those essential finishing details to turn your backyard into a true oasis.</p>
                
                <p>Our landscaping services focus on completing your pool installation with professional finishing touches that integrate your pool seamlessly into your yard.</p>
                
                <h3>Our Final Touches Service Includes:</h3>
                <ul>
                    <li>Backfilling around the pool for smooth integration</li>
                    <li>Decorative rocks around the pool area</li>
                    <li>Professional grading and finishing</li>
                    <li>Aesthetic enhancements</li>
                    <li>Pool area beautification</li>
                </ul>
                
                <p>We ensure a harmonious integration of your pool into its surroundings, creating a smooth transition from poolside to the rest of your yard.</p>
            `
        },
        'maintenance': {
            title: 'Pool Maintenance Services',
            image: 'assets/images/instagram/downloadgram.org_572155053_18058531853551042_3642375934021995860_n.jpg',
            description: `
                <p>Keep your pool in perfect condition year-round with our comprehensive pool maintenance services. We handle everything from regular maintenance to seasonal openings and closings.</p>
                
                <p>Our experienced team ensures your pool stays clean, safe, and ready for enjoyment whenever you need it.</p>
                
                <h3>Maintenance Services Include:</h3>
                <ul>
                    <li>Regular pool maintenance and cleaning</li>
                    <li>Seasonal pool openings</li>
                    <li>Seasonal pool closings</li>
                    <li>Plumbing services and repairs</li>
                    <li>Equipment inspection and maintenance</li>
                    <li>Water chemistry balancing</li>
                </ul>
                
                <p>Trust DR Installs to keep your pool in pristine condition with our professional maintenance services.</p>
            `
        },
        'liner': {
            title: 'Pool Liner Replacement',
            image: 'assets/images/original-projects/inground-pool-2.jpg',
            description: `
                <p>Refresh and restore your pool with professional liner replacement services. Whether your liner is faded, torn, or simply outdated, we can help you give your pool a brand new look.</p>
                
                <p>We work with quality pool liners in various patterns and colors to match your style preferences.</p>
                
                <h3>Liner Replacement Services:</h3>
                <ul>
                    <li>Quality pool liner materials</li>
                    <li>Expert installation</li>
                    <li>Multiple pattern and color options</li>
                    <li>Quick turnaround time</li>
                    <li>Professional measurement and fitting</li>
                    <li>Warranty on workmanship</li>
                </ul>
                
                <p>Contact us today to discuss your liner replacement needs and get a free quote.</p>
            `
        }
    };
    
    // Open modal
    serviceLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Service link clicked:', this);
            const serviceType = this.getAttribute('data-service');
            console.log('Service type:', serviceType);
            const service = serviceData[serviceType];
            
            if (service && modal) {
                console.log('Opening modal for:', service.title);
                modalTitle.textContent = service.title;
                modalImage.src = service.image;
                modalImage.alt = service.title;
                modalDescription.innerHTML = service.description;
                
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else {
                console.error('Service not found or modal missing:', serviceType, modal);
            }
        });
    });
    
    // Close modal
    function closeModal() {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal?.classList.contains('active')) {
            closeModal();
        }
    });
}


// Featured Video Controls
function initFeaturedVideoControls() {
    // Handle featured videos in portfolio page
    const featuredVideoItems = document.querySelectorAll('.featured-video-item');
    
    featuredVideoItems.forEach(item => {
        const video = item.querySelector('video');
        const unmuteBtn = item.querySelector('.video-unmute-btn');
        const icon = unmuteBtn ? unmuteBtn.querySelector('i') : null;
        
        if (video && unmuteBtn && icon) {
            unmuteBtn.addEventListener('click', function() {
                if (video.muted) {
                    video.muted = false;
                    unmuteBtn.classList.add('unmuted');
                    icon.classList.remove('bi-volume-mute');
                    icon.classList.add('bi-volume-up');
                } else {
                    video.muted = true;
                    unmuteBtn.classList.remove('unmuted');
                    icon.classList.remove('bi-volume-up');
                    icon.classList.add('bi-volume-mute');
                }
            });
        }
    });
    
    // Handle customer experience video in reviews page
    const customerVideoContainer = document.querySelector('.video-container-featured');
    
    if (customerVideoContainer) {
        const video = customerVideoContainer.querySelector('video');
        const unmuteBtn = customerVideoContainer.querySelector('.video-unmute-btn');
        const icon = unmuteBtn ? unmuteBtn.querySelector('i') : null;
        
        if (video && unmuteBtn && icon) {
            unmuteBtn.addEventListener('click', function() {
                if (video.muted) {
                    video.muted = false;
                    unmuteBtn.classList.add('unmuted');
                    icon.classList.remove('bi-volume-mute');
                    icon.classList.add('bi-volume-up');
                } else {
                    video.muted = true;
                    unmuteBtn.classList.remove('unmuted');
                    icon.classList.remove('bi-volume-up');
                    icon.classList.add('bi-volume-mute');
                }
            });
        }
    }
}

// Initialize featured video controls when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeaturedVideoControls);
} else {
    initFeaturedVideoControls();
}
