#!/usr/bin/env python3
"""
Simple Schema Validator for GlassCode Academy
Validates lesson and quiz JSON files against expected schemas
"""

import json
import os
import glob

def validate_lesson_file(file_path):
    """Validate a lesson JSON file"""
    errors = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Check if it's a list of lessons
        if not isinstance(data, list):
            errors.append("File should contain a list of lessons")
            return errors
        
        for i, lesson in enumerate(data):
            if not isinstance(lesson, dict):
                errors.append("Lesson {} is not an object".format(i))
                continue
            
            # Check required fields
            required_fields = ['id', 'moduleSlug', 'title', 'order']
            for field in required_fields:
                if field not in lesson:
                    errors.append("Lesson {} missing required field: {}".format(i, field))
                elif field == 'id' and not isinstance(lesson[field], str):
                    errors.append("Lesson {} field '{}' should be string, got {}".format(i, field, type(lesson[field]).__name__))
                elif field == 'order' and not isinstance(lesson[field], int):
                    errors.append("Lesson {} field '{}' should be integer, got {}".format(i, field, type(lesson[field]).__name__))
                elif field in ['moduleSlug', 'title'] and not isinstance(lesson[field], str):
                    errors.append("Lesson {} field '{}' should be string, got {}".format(i, field, type(lesson[field]).__name__))
    
    except json.JSONDecodeError as e:
        errors.append("JSON parsing error: {}".format(str(e)))
    except Exception as e:
        errors.append("Error reading file: {}".format(str(e)))
    
    return errors

def validate_quiz_file(file_path):
    """Validate a quiz JSON file"""
    errors = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Check if it has required top-level fields
        if not isinstance(data, dict):
            errors.append("File should contain a quiz object")
            return errors
        
        if 'questions' not in data:
            errors.append("Quiz missing 'questions' field")
            return errors
        
        if 'totalQuestions' not in data:
            errors.append("Quiz missing 'totalQuestions' field")
        elif not isinstance(data['totalQuestions'], int):
            errors.append("Field 'totalQuestions' should be integer, got {}".format(type(data['totalQuestions']).__name__))
        
        questions = data['questions']
        if not isinstance(questions, list):
            errors.append("Field 'questions' should be a list")
            return errors
        
        # Validate totalQuestions count
        if 'totalQuestions' in data and len(questions) != data['totalQuestions']:
            errors.append("totalQuestions ({}) doesn't match actual questions count ({})".format(data['totalQuestions'], len(questions)))
        
        # Validate each question
        for i, question in enumerate(questions):
            if not isinstance(question, dict):
                errors.append("Question {} is not an object".format(i))
                continue
            
            # Check required fields
            required_fields = ['id', 'topic', 'type', 'question', 'choices', 'correctAnswer']
            for field in required_fields:
                if field not in question:
                    errors.append("Question {} missing required field: {}".format(i, field))
                elif field == 'id' and not isinstance(question[field], str):
                    errors.append("Question {} field '{}' should be string, got {}".format(i, field, type(question[field]).__name__))
                elif field == 'choices' and not isinstance(question[field], list):
                    errors.append("Question {} field '{}' should be list, got {}".format(i, field, type(question[field]).__name__))
                elif field in ['topic', 'type', 'question', 'correctAnswer'] and not isinstance(question[field], str):
                    errors.append("Question {} field '{}' should be string, got {}".format(i, field, type(question[field]).__name__))
            
            # Validate choices count
            if 'choices' in question and isinstance(question['choices'], list):
                if len(question['choices']) != 4:
                    errors.append("Question {} should have exactly 4 choices, got {}".format(i, len(question['choices'])))
    
    except json.JSONDecodeError as e:
        errors.append("JSON parsing error: {}".format(str(e)))
    except Exception as e:
        errors.append("Error reading file: {}".format(str(e)))
    
    return errors

def main():
    """Main validation function"""
    # Get the script directory and navigate to the content directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    content_dir = os.path.join(script_dir, "..", "..", "content")
    lessons_path = os.path.join(content_dir, "lessons")
    quizzes_path = os.path.join(content_dir, "quizzes")
    
    total_files = 0
    files_with_errors = 0
    total_errors = 0
    
    print("=== GlassCode Academy Schema Validation ===")
    print()
    
    # Validate lesson files
    print("Validating lesson files...")
    lesson_files = glob.glob(os.path.join(lessons_path, "*.json"))
    
    for file_path in lesson_files:
        total_files += 1
        file_name = os.path.basename(file_path)
        errors = validate_lesson_file(file_path)
        
        if errors:
            files_with_errors += 1
            total_errors += len(errors)
            print("ERRORS in {}: {} errors".format(file_name, len(errors)))
            for error in errors:
                print("  - {}".format(error))
        else:
            print("OK: {}".format(file_name))
    
    print()
    
    # Validate quiz files
    print("Validating quiz files...")
    quiz_files = glob.glob(os.path.join(quizzes_path, "*.json"))
    
    for file_path in quiz_files:
        total_files += 1
        file_name = os.path.basename(file_path)
        errors = validate_quiz_file(file_path)
        
        if errors:
            files_with_errors += 1
            total_errors += len(errors)
            print("ERRORS in {}: {} errors".format(file_name, len(errors)))
            for error in errors:
                print("  - {}".format(error))
        else:
            print("OK: {}".format(file_name))
    
    print()
    print("=== Validation Summary ===")
    print("Total files checked: {}".format(total_files))
    print("Files with errors: {}".format(files_with_errors))
    print("Total errors found: {}".format(total_errors))
    
    if total_errors == 0:
        print("All files passed schema validation!")
    else:
        print("Schema validation completed with errors.")

if __name__ == "__main__":
    main()