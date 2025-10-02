// Custom JavaScript for the Node.js module

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            document.documentElement.classList.toggle('dark');
        });
    }
    
    // Quiz functionality
    const quizForm = document.getElementById('quiz-form');
    if (quizForm) {
        quizForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // In a real implementation, this would submit the quiz answers
            alert('Quiz submitted!');
        });
    }
    
    // Copy code functionality
    window.copyCode = function() {
        // In a real implementation, this would copy the code to clipboard
        alert('Code copied to clipboard!');
    };
});