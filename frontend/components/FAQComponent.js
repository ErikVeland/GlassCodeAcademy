import React, { useState, useEffect } from 'react';

/**
 * FAQ Component
 * Displays frequently asked questions with search and categorization
 */

const FAQComponent = () => {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch FAQs and categories on component mount
  useEffect(() => {
    fetchFaqs();
    fetchCategories();
  }, [selectedCategory]);

  // Fetch published FAQs
  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/faqs?category=${selectedCategory}`);
      const result = await response.json();
      
      if (result.success) {
        setFaqs(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch FAQs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch FAQ categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/faqs/categories');
      const result = await response.json();
      
      if (result.success) {
        setCategories(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  // Filter FAQs based on search query
  const filteredFaqs = faqs.filter(faq => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      (faq.category && faq.category.toLowerCase().includes(query))
    );
  });

  // Record feedback for a FAQ
  const recordFeedback = async (faqId, isHelpful) => {
    try {
      const response = await fetch(`/api/faqs/${faqId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isHelpful }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update the FAQ in state with new counts
        setFaqs(prevFaqs => 
          prevFaqs.map(faq => 
            faq.id === faqId 
              ? { ...faq, ...result.data } 
              : faq
          )
        );
      }
    } catch (err) {
      console.error('Failed to record feedback', err);
    }
  };

  if (loading) {
    return <div className="faq-loading">Loading FAQs...</div>;
  }

  if (error) {
    return <div className="faq-error">Error: {error}</div>;
  }

  return (
    <div className="faq-component">
      <div className="faq-header">
        <h2>Frequently Asked Questions</h2>
        
        {/* Search Bar */}
        <div className="faq-search">
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="faq-search-input"
          />
        </div>
        
        {/* Category Filter */}
        <div className="faq-categories">
          <button
            className={`category-btn ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            All Categories
          </button>
          
          {categories.map(category => (
            <button
              key={category.name}
              className={`category-btn ${selectedCategory === category.name ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.name)}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>
      
      {/* FAQ List */}
      <div className="faq-list">
        {filteredFaqs.length === 0 ? (
          <div className="faq-empty">No FAQs found.</div>
        ) : (
          filteredFaqs.map(faq => (
            <FAQItem 
              key={faq.id} 
              faq={faq} 
              onFeedback={recordFeedback} 
            />
          ))
        )}
      </div>
    </div>
  );
};

// Individual FAQ Item Component
const FAQItem = ({ faq, onFeedback }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`faq-item ${isOpen ? 'open' : ''}`}>
      <div className="faq-question" onClick={() => setIsOpen(!isOpen)}>
        <h3>{faq.question}</h3>
        <span className="faq-toggle">{isOpen ? '−' : '+'}</span>
      </div>
      
      {isOpen && (
        <div className="faq-answer">
          <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
          
          <div className="faq-feedback">
            <p>Was this helpful?</p>
            <div className="feedback-buttons">
              <button 
                className="helpful-btn"
                onClick={() => onFeedback(faq.id, true)}
              >
                Yes ({faq.helpfulCount || 0})
              </button>
              <button 
                className="not-helpful-btn"
                onClick={() => onFeedback(faq.id, false)}
              >
                No ({faq.notHelpfulCount || 0})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQComponent;