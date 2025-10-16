#!/usr/bin/env python3
"""
Simple validator for Glass Code Academy content files.
Provides basic validation against C# BaseLesson and BaseInterviewQuestion schemas.
"""

import json
import os
import sys
from typing import Dict, List, Any

def validate_lesson_file(file_path: str) -> List[str]:
    """Validate a lesson file with basic checks."""
    errors = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        return [f"JSON parsing error: {e}"]
    except FileNotFoundError:
        return ["File not found"]
    
    # Handle both single lesson and array of lessons
    lessons = data if isinstance(data, list) else [data]
    
    for i, lesson in enumerate(lessons):
        if not isinstance(lesson, dict):
            errors.append(f"Lesson {i}: should be an object")
            continue
        
        # Check required fields based on C# BaseLesson
        required_fields = {
            'id': int,
            'moduleSlug': str,
            'title': str,
            'order': int,
            'objectives': list,
            'intro': str,
            'code': dict,
            'pitfalls': list,
            'exercises': list,
            'next': str,
            'estimatedMinutes': int,
            'difficulty': str,
            'tags': list
        }
        
        for field, expected_type in required_fields.items():
            if field not in lesson:
                errors.append(f"Lesson {i}: Missing required field '{field}'")
            elif not isinstance(lesson[field], expected_type):
                errors.append(f"Lesson {i}: Field '{field}' should be {expected_type.__name__}, got {type(lesson[field]).__name__}")
    
    return errors

def validate_quiz_file(file_path: str) -> List[str]:
    """Validate a quiz file with basic checks."""
    errors = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        return [f"JSON parsing error: {e}"]
    except FileNotFoundError:
        return ["File not found"]
    
    questions = []
    
    # Handle both formats: array of questions or quiz object with questions array
    if isinstance(data, list):
        # Direct array of questions format
        questions = data
    elif isinstance(data, dict):
        # Quiz object format with questions array
        if 'questions' not in data:
            errors.append("Missing 'questions' field")
        elif not isinstance(data['questions'], list):
            errors.append("'questions' should be a list")
        else:
            questions = data['questions']
        
        # Validate question count if totalQuestions is present
        if 'totalQuestions' in data:
            if not isinstance(data['totalQuestions'], int):
                errors.append("'totalQuestions' should be an integer")
            elif len(questions) != data['totalQuestions']:
                errors.append(f"Question count mismatch: expected {data['totalQuestions']}, got {len(questions)}")
    else:
        return ["File should contain either an array of questions or an object with a questions array"]
    
    # Validate each question based on C# BaseInterviewQuestion
    for i, question in enumerate(questions):
        if not isinstance(question, dict):
            errors.append(f"Question {i}: should be an object")
            continue
        
        # Check basic required fields (core fields for data integrity)
        # Note: In C# BaseInterviewQuestion, all fields are nullable, but we require core fields
        basic_required_fields = {
            'id': int,
            'question': str
        }
        
        # Optional fields that may be present
        optional_fields = {
            'topic': str,
            'type': str,
            'explanation': str,
            'difficulty': str,
            'industryContext': str,
            'tags': list,
            'questionType': str,
            'estimatedTime': int,
            'sources': list,
            'choices': list,
            'correctAnswer': int
        }
        
        # Validate basic required fields
        for field, expected_type in basic_required_fields.items():
            if field not in question:
                errors.append(f"Question {i}: Missing required field '{field}'")
            elif not isinstance(question[field], expected_type):
                errors.append(f"Question {i}: Field '{field}' should be {expected_type.__name__}, got {type(question[field]).__name__}")
        
        # Check question type specific requirements
        question_type = question.get('questionType') or question.get('type')
        if question_type == 'multiple-choice':
            # Multiple choice questions need choices and correctAnswer
            if 'choices' not in question:
                errors.append(f"Question {i}: Missing required field 'choices'")
            elif not isinstance(question['choices'], list):
                errors.append(f"Question {i}: Field 'choices' should be list")
            elif len(question['choices']) != 4:
                errors.append(f"Question {i}: Should have exactly 4 choices, got {len(question['choices'])}")
            
            if 'correctAnswer' not in question:
                errors.append(f"Question {i}: Missing required field 'correctAnswer'")
            elif not isinstance(question['correctAnswer'], int):
                errors.append(f"Question {i}: Field 'correctAnswer' should be int")
            elif 'choices' in question and isinstance(question['choices'], list):
                if question['correctAnswer'] < 0 or question['correctAnswer'] >= len(question['choices']):
                    errors.append(f"Question {i}: correctAnswer {question['correctAnswer']} is out of range")
        
        # Validate optional fields if present
        for field, expected_type in optional_fields.items():
            if field in question and not isinstance(question[field], expected_type):
                errors.append(f"Question {i}: Field '{field}' should be {expected_type.__name__}, got {type(question[field]).__name__}")
    
    return errors

def main():
    """Main function to run simple validation."""
    if len(sys.argv) < 2:
        print("Usage: python simple_validator.py <file_or_directory>")
        sys.exit(1)
    
    path = sys.argv[1]
    
    if os.path.isfile(path):
        # Validate single file
        if path.endswith('-lesson.json') or 'lessons' in path:
            errors = validate_lesson_file(path)
        elif path.endswith('-quiz.json') or 'quizzes' in path:
            errors = validate_quiz_file(path)
        else:
            print(f"Unknown file type: {path}")
            sys.exit(1)
        
        if errors:
            print(f"❌ {path}")
            for error in errors:
                print(f"   - {error}")
            sys.exit(1)
        else:
            print(f"✅ {path}")
    
    elif os.path.isdir(path):
        # Validate all files in directory
        total_files = 0
        invalid_files = 0
        
        for root, dirs, files in os.walk(path):
            for file in files:
                if file.endswith('.json'):
                    file_path = os.path.join(root, file)
                    total_files += 1
                    
                    if file.endswith('-lesson.json') or 'lessons' in file_path:
                        errors = validate_lesson_file(file_path)
                    elif file.endswith('-quiz.json') or 'quizzes' in file_path:
                        errors = validate_quiz_file(file_path)
                    else:
                        continue
                    
                    if errors:
                        invalid_files += 1
                        print(f"❌ {file_path}")
                        for error in errors:
                            print(f"   - {error}")
                    else:
                        print(f"✅ {file_path}")
        
        print(f"\nValidation Summary:")
        print(f"Total files: {total_files}")
        print(f"Valid files: {total_files - invalid_files}")
        print(f"Invalid files: {invalid_files}")
        
        if invalid_files > 0:
            sys.exit(1)
    
    else:
        print(f"Error: {path} is not a valid file or directory")
        sys.exit(1)

if __name__ == "__main__":
    main()