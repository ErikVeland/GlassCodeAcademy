const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Helper function to read JSON files
const readJsonFile = (filename) => {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'data', filename), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

// Helper function to apply query parameters
const applyQueryParams = (items, req) => {
  let result = [...items];
  
  // Filter by topic if provided
  if (req.query.topic) {
    result = result.filter(item => 
      item.topic && item.topic.toLowerCase() === req.query.topic.toLowerCase()
    );
  }
  
  // Sort if requested
  if (req.query.sortBy) {
    const sortBy = req.query.sortBy;
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    result.sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return -1 * sortOrder;
      if (a[sortBy] > b[sortBy]) return 1 * sortOrder;
      return 0;
    });
  }
  
  // Apply limit and offset for pagination
  const limit = req.query.limit ? parseInt(req.query.limit) : null;
  const offset = req.query.offset ? parseInt(req.query.offset) : 0;
  
  if (offset > 0) result = result.slice(offset);
  if (limit) result = result.slice(0, limit);
  
  return result;
};

// Vue Lessons API
app.get('/api/vue/lessons', (req, res) => {
  try {
    const lessons = readJsonFile('lessons.json');
    const result = applyQueryParams(lessons, req);
    res.json(result);
  } catch (error) {
    console.error('Error fetching Vue lessons:', error);
    res.status(500).json({ error: 'Failed to fetch Vue lessons' });
  }
});

// Vue Interview Questions API
app.get('/api/vue/questions', (req, res) => {
  try {
    const questions = readJsonFile('questions.json');
    const result = applyQueryParams(questions, req);
    res.json(result);
  } catch (error) {
    console.error('Error fetching Vue questions:', error);
    res.status(500).json({ error: 'Failed to fetch Vue questions' });
  }
});

// Submit answer for Vue questions
app.post('/api/vue/answer', (req, res) => {
  try {
    const { questionId, answerIndex } = req.body;
    const questions = readJsonFile('questions.json');
    const question = questions.find(q => q.id === questionId);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    const isCorrect = question.type === 'open-ended' || 
                     (question.correctAnswer !== undefined && answerIndex === question.correctAnswer);
    
    res.json({
      isCorrect,
      explanation: question.explanation
    });
  } catch (error) {
    console.error('Error validating Vue answer:', error);
    res.status(500).json({ error: 'Failed to validate answer' });
  }
});

// Serve React frontend for any GET request that doesn't match an API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Vue.js backend server running on port ${PORT}`);
});