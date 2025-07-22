// Main JavaScript for Edylicious - Optimized and Debloated

// Debounce function for performance
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
  
  // Loading overlay - faster hide
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.style.opacity = '0';
    setTimeout(() => loadingOverlay.style.display = 'none', 300);
  }

  // Header scroll effect - debounced
  const header = document.getElementById('header');
  const scrollToTop = document.getElementById('scrollToTop');
  
  const handleScroll = debounce(() => {
    const scrolled = window.scrollY > 100;
    header?.classList.toggle('scrolled', scrolled);
    scrollToTop?.classList.toggle('visible', scrolled);
  }, 10);

  window.addEventListener('scroll', handleScroll, { passive: true });

  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const navMobile = document.getElementById('navMobile');
  
  mobileMenuToggle?.addEventListener('click', function() {
    const isActive = navMobile.classList.toggle('active');
    this.textContent = isActive ? '✕' : '☰';
  });

  // Scroll to top
  scrollToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(targetId);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Lazy loading with Intersection Observer
  if ('IntersectionObserver' in window) {
    // Image lazy loading
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });

    // Animation observer for fade-in effects
    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          animationObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    });

    // Add animation class to elements
    document.querySelectorAll('.gallery-item, .cta-button, .fade-in').forEach(el => {
      el.classList.add('animate-on-scroll');
      animationObserver.observe(el);
    });
  }

  // Optimize image loading with native lazy loading fallback
  document.querySelectorAll('img').forEach(img => {
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
  });

});

// Performance monitoring (optional - remove in production)
if (window.performance && performance.mark) {
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    console.log('Page load time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
  });
}