#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const quizzesDir = path.join(__dirname, '..', 'content', 'quizzes');

function fixQuizIdFormat() {
    const files = fs.readdirSync(quizzesDir).filter(file => file.endsWith('.json'));
    let modifiedFiles = 0;
    
    files.forEach(file => {
        const filePath = path.join(quizzesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        try {
            const data = JSON.parse(content);
            let modified = false;
            
            if (data.questions && Array.isArray(data.questions)) {
                data.questions.forEach((question, index) => {
                    // If ID is a string, convert to number (1-based index)
                    if (typeof question.id === 'string') {
                        question.id = index + 1;
                        modified = true;
                        console.log(`${file}: Converting string ID "${question.id}" to number ${index + 1}`);
                    }
                });
            }
            
            if (modified) {
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                modifiedFiles++;
                console.log(`✓ Fixed ID formats in ${file}`);
            }
        } catch (error) {
            console.error(`Error processing ${file}:`, error.message);
        }
    });
    
    console.log(`\nProcessed ${files.length} quiz files, modified ${modifiedFiles} files.`);
}

fixQuizIdFormat();