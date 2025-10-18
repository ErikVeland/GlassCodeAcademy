#!/usr/bin/env python
"""
Quiz Migration Script

This script migrates quiz data from JSON files to the database via API calls.
"""

import json
import os
import requests
import sys
import glob

# Configuration
API_BASE_URL = "http://127.0.0.1:8080/api"
CONTENT_PATH = "/Users/veland/GlassCodeAcademy/content/quizzes"

def load_quiz_file(file_path):
    """Load and parse a quiz JSON file"""
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print("Error loading {}: {}".format(file_path, e))
        return None

def find_matching_lesson(filename):
    """Try to find a matching lesson for the quiz file"""
    try:
        # Get all lessons
        response = requests.get("{}/LessonsDb".format(API_BASE_URL))
        if response.status_code == 200:
            lessons = response.json()
            
            # Extract topic from filename (remove .json extension)
            topic = os.path.splitext(os.path.basename(filename))[0].lower()
            
            # Try to find a matching lesson by title
            for lesson in lessons:
                if topic in lesson.get("title", "").lower():
                    return lesson.get("id")
        
        return None
    except Exception as e:
        print("Error finding matching lesson: {}".format(e))
        return None

def create_quiz(quiz_data, lesson_id=1):
    """Create a quiz via API call"""
    try:
        # Convert arrays to JSON strings as required by the API
        choices = quiz_data.get("choices", [])
        if isinstance(choices, list):
            choices_json = json.dumps(choices)
        else:
            choices_json = str(choices)
        
        tags = quiz_data.get("tags", [])
        if isinstance(tags, list):
            tags_json = json.dumps(tags)
        else:
            tags_json = str(tags)
        
        sources = quiz_data.get("sources", [])
        if isinstance(sources, list):
            sources_json = json.dumps(sources)
        else:
            sources_json = str(sources)
        
        quiz_payload = {
            "question": quiz_data.get("question", ""),
            "topic": quiz_data.get("topic", "General"),
            "difficulty": quiz_data.get("difficulty", "Beginner"),
            "choices": choices_json,
            "explanation": quiz_data.get("explanation", ""),
            "industryContext": quiz_data.get("industryContext", "General"),
            "tags": tags_json,
            "questionType": quiz_data.get("questionType", "multiple-choice"),
            "estimatedTime": quiz_data.get("estimatedTime", 2),
            "correctAnswer": quiz_data.get("correctAnswer", 0),
            "quizType": quiz_data.get("quizType", "practice"),
            "sources": sources_json,
            "sortOrder": 1,
            "lessonId": lesson_id
        }
        
        # Make the API call
        response = requests.post("{}/LessonQuiz".format(API_BASE_URL), json=quiz_payload)
        
        if response.status_code in [200, 201]:
            return response.json()
        else:
            print("Error creating quiz: {} - {}".format(response.status_code, response.text))
            return None
            
    except Exception as e:
        print("Error creating quiz: {}".format(e))
        return None

def check_quiz_exists(question):
    """Check if a quiz with the same question already exists"""
    try:
        response = requests.get("{}/LessonQuiz".format(API_BASE_URL))
        if response.status_code == 200:
            existing_quizzes = response.json()
            for quiz in existing_quizzes:
                if quiz.get("question") == question:
                    return True
        return False
    except Exception as e:
        print("Error checking existing quizzes: {}".format(e))
        return False

def migrate_quiz_file(file_path):
    """Migrate a single quiz file"""
    print("Processing: {}".format(file_path))
    
    # Load the quiz data
    quiz_data = load_quiz_file(file_path)
    if not quiz_data:
        return 0, 0
    
    # Find matching lesson or use default
    filename = os.path.basename(file_path)
    lesson_id = find_matching_lesson(filename)
    if lesson_id is None:
        lesson_id = 4  # Default to lesson ID 4 (General Programming Concepts)
    
    created_count = 0
    skipped_count = 0
    
    # Handle the questions array structure
    if "questions" in quiz_data:
        quizzes = quiz_data["questions"]
    elif isinstance(quiz_data, list):
        quizzes = quiz_data
    else:
        quizzes = [quiz_data]
    
    for quiz in quizzes:
        question = quiz.get("question", "")
        if not question:
            print("  Skipping quiz with no question")
            skipped_count += 1
            continue
        
        # Check if quiz already exists
        if check_quiz_exists(question):
            print("  Skipping existing quiz: {}".format(question[:50]))
            skipped_count += 1
            continue
        
        # Create the quiz
        result = create_quiz(quiz, lesson_id)
        if result:
            print("  Created quiz: {}".format(question[:50]))
            created_count += 1
        else:
            print("  Failed to create quiz: {}".format(question[:50]))
            skipped_count += 1
    
    return created_count, skipped_count

def main():
    """Main migration function"""
    if not os.path.exists(CONTENT_PATH):
        print("Content path does not exist: {}".format(CONTENT_PATH))
        sys.exit(1)
    
    total_created = 0
    total_skipped = 0
    
    # Process all JSON files in the content directory
    json_pattern = os.path.join(CONTENT_PATH, "*.json")
    for file_path in glob.glob(json_pattern):
        created, skipped = migrate_quiz_file(file_path)
        total_created += created
        total_skipped += skipped
    
    print("\nMigration completed!")
    print("Total quizzes created: {}".format(total_created))
    print("Total quizzes skipped: {}".format(total_skipped))

if __name__ == "__main__":
    main()