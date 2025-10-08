const fs = require('fs');
const path = require('path');

// Read the programming fundamentals lessons in the new format
const inputFile = path.join(__dirname, '..', 'content', 'lessons', 'programming-fundamentals.json');
const outputFile = path.join(__dirname, '..', 'glasscode', 'backend', 'Data', 'programming_lessons.json');

// Read the input file
const inputData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

// Define topic categories based on lesson content
const topicMapping = {
  "Variables": "Variables & Data Types",
  "Control": "Control Structures",
  "Conditionals": "Control Structures",
  "Loops": "Control Structures",
  "Functions": "Functions & Scope",
  "Scope": "Functions & Scope",
  "Arrays": "Data Structures",
  "Array": "Data Structures",
  "Objects": "Data Structures",
  "Object": "Data Structures",
  "Error": "Debugging & Error Handling",
  "Debugging": "Debugging & Error Handling",
  "Algorithms": "Algorithms & Problem Solving",
  "Problem": "Algorithms & Problem Solving",
  "Strings": "String Manipulation",
  "String": "String Manipulation",
  "Numbers": "Numbers & Math",
  "Math": "Numbers & Math",
  "Dates": "Date & Time Handling",
  "Date": "Date & Time Handling",
  "File": "File I/O & Persistence",
  "Persistence": "File I/O & Persistence"
};

// Convert to the backend format
const convertedLessons = inputData.map((lesson, index) => {
  // Derive topic from lesson title or content
  let topic = "Programming Fundamentals";
  
  // Try to match topic based on title keywords
  const title = lesson.title.toLowerCase();
  for (const [keyword, category] of Object.entries(topicMapping)) {
    if (title.includes(keyword.toLowerCase())) {
      topic = category;
      break;
    }
  }
  
  return {
    Id: index + 1,
    Topic: topic,
    Title: lesson.title,
    Description: lesson.intro,
    CodeExample: lesson.code.example || '',
    Output: lesson.code.explanation || ''
  };
});

// Write to the output file
fs.writeFileSync(outputFile, JSON.stringify(convertedLessons, null, 2));

console.log(`Converted ${convertedLessons.length} lessons from ${inputFile} to ${outputFile}`);