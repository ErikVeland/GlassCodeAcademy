const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Load data
const lessons = require('./data/lessons.json');
const questions = require('./data/questions.json');

// Routes
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/lessons', (req, res) => {
  res.render('lessons', { lessons });
});

app.get('/lessons/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const lesson = lessons.find(l => l.id === id);
  if (lesson) {
    res.render('lesson-detail', { lesson });
  } else {
    res.status(404).render('404');
  }
});

app.get('/quiz', (req, res) => {
  // Shuffle questions and take first 5
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 5);
  res.render('quiz', { questions: selected });
});

// API Routes
app.get('/api/lessons', (req, res) => {
  res.json(lessons);
});

app.get('/api/lessons/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const lesson = lessons.find(l => l.id === id);
  if (lesson) {
    res.json(lesson);
  } else {
    res.status(404).json({ error: 'Lesson not found' });
  }
});

app.get('/api/questions', (req, res) => {
  res.json(questions);
});

app.get('/api/questions/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const question = questions.find(q => q.id === id);
  if (question) {
    res.json(question);
  } else {
    res.status(404).json({ error: 'Question not found' });
  }
});

app.post('/api/submit-answer', (req, res) => {
  const { questionId, answer } = req.body;
  const question = questions.find(q => q.id === questionId);
  
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }
  
  const isCorrect = answer === question.correctAnswer;
  
  res.json({
    correct: isCorrect,
    explanation: question.explanation
  });
});

app.listen(PORT, () => {
  console.log(`Node.js backend server running on port ${PORT}`);
});