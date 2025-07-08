// Utility functions for reliable scrolling

export const scrollToTop = (options?: { immediate?: boolean; retries?: number }) => {
  const { immediate = false, retries = 3 } = options || {};
  
  const performScroll = (attempt: number = 0) => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Set scroll position to absolute top
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: immediate ? 'auto' : 'smooth'
      });
      
      // Also set direct properties as fallback
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Verify scroll position and retry if needed
      setTimeout(() => {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
        if (currentScroll > 10 && attempt < retries) {
          console.log(`Scroll attempt ${attempt + 1} failed, retrying...`);
          performScroll(attempt + 1);
        } else if (currentScroll <= 10) {
          console.log(`Scroll to top successful after ${attempt + 1} attempts`);
        }
      }, immediate ? 10 : 100);
    });
  };
  
  performScroll();
};

export const scrollToTopWithNavigation = (navigate: (path: string) => void, currentPath: string) => {
  if (currentPath !== '/') {
    console.log('Navigating to home and scrolling to top...');
    navigate('/');
    
    // Wait for navigation to complete
    setTimeout(() => {
      scrollToTop({ immediate: true, retries: 5 });
    }, 50);
    
    // Additional attempts after navigation
    setTimeout(() => {
      scrollToTop({ immediate: false, retries: 3 });
    }, 200);
  } else {
    console.log('Already on home, scrolling to top...');
    scrollToTop({ immediate: true, retries: 5 });
  }
};
