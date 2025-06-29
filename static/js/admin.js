function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(sec => sec.style.display = 'none');
    
    // Show the selected section
    const selected = document.getElementById(sectionId);
    if (selected) selected.style.display = 'block';
    
    // Update active state in navigation
    const allNavItems = document.querySelectorAll('.nav-item');
    allNavItems.forEach(item => item.classList.remove('active'));
    
    // Find and activate the clicked nav item
    const activeNavItem = Array.from(allNavItems).find(item => {
        return item.getAttribute('onclick').includes(sectionId);
    });
    
    if (activeNavItem) {
        activeNavItem.classList.add('active');
        
        // Scroll to section on mobile
        if (window.innerWidth <= 768) {
            selected.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Add event listener for window resize to adjust layout
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        // Reset any mobile-specific styles when back to desktop
        document.querySelector('.main-content').style.marginTop = '80px';
    }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    showSection('contact');
    
    // Add mobile menu toggle if needed
    if (window.innerWidth <= 768) {
        // You can add a mobile menu toggle button here if desired
    }
});