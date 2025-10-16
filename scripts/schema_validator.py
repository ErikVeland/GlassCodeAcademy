#!/usr/bin/env python3
"""
Schema validator for Glass Code Academy content files.
Validates lesson and quiz files against the C# BaseLesson and BaseInterviewQuestion schemas.
"""

import json
import os
import sys
from typing import Dict, List, Any, Union

# Schema definitions based on C# BaseLesson and BaseInterviewQuestion models
lesson_schema = {
    # Required fields from BaseLesson
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
    'tags': list,
    # Optional fields from BaseLesson
    'lastUpdated': str,
    'version': str,
    'sources': list,
    'topic': str,
    'description': str,
    'codeExample': dict,
    'output': str
}

quiz_schema = {
    'questions': list,
    'totalQuestions': int
}

question_schema = {
    # Required fields from BaseInterviewQuestion
    'id': int,
    'topic': str,
    'type': str,
    'question': str,
    'choices': list,
    'correctAnswer': int,
    'explanation': str,
    'difficulty': str,
    'industryContext': str,
    'tags': list,
    'questionType': str,
    'estimatedTime': int,
    'sources': list
}

# Define required vs optional fields
required_lesson_fields = ['id', 'moduleSlug', 'title', 'order', 'objectives', 'intro', 'code', 'pitfalls', 'exercises', 'next', 'estimatedMinutes', 'difficulty', 'tags']
optional_lesson_fields = ['lastUpdated', 'version', 'sources', 'topic', 'description', 'codeExample', 'output']

required_question_fields = ['id', 'question', 'choices', 'correctAnswer']
optional_question_fields = ['topic', 'type', 'explanation', 'difficulty', 'industryContext', 'tags', 'questionType', 'estimatedTime', 'sources']

# Valid values
valid_difficulties = ['Beginner', 'Intermediate', 'Advanced']
valid_question_types = ['multiple-choice', 'true-false', 'coding', 'open-ended']

def validate_nested_object(obj: Dict[str, Any], expected_fields: List[str], object_name: str) -> List[str]:
    """Validate nested object structure."""
    errors = []
    for field in expected_fields:
        if field not in obj:
            errors.append(f"{object_name} missing field: {field}")
    return errors

def validate_type(value: Any, expected_type: type, field_name: str) -> List[str]:
    """Validate field type."""
    errors = []
    if expected_type == int and not isinstance(value, int):
        errors.append(f"Field {field_name} should be an integer, got {type(value).__name__}")
    elif expected_type == str and not isinstance(value, str):
        errors.append(f"Field {field_name} should be a string, got {type(value).__name__}")
    elif expected_type == list and not isinstance(value, list):
        errors.append(f"Field {field_name} should be a list, got {type(value).__name__}")
    elif expected_type == dict and not isinstance(value, dict):
        errors.append(f"Field {field_name} should be a dictionary, got {type(value).__name__}")
    return errors

def validate_lesson(lesson: Dict[str, Any]) -> List[str]:
    """Validate a lesson object against the BaseLesson schema."""
    errors = []
    
    # Check required fields
    for field in required_lesson_fields:
        if field not in lesson or lesson[field] is None:
            errors.append(f"Missing required field: {field}")
            continue
        
        # Type validation
        expected_type = lesson_schema[field]
        errors.extend(validate_type(lesson[field], expected_type, field))
    
    # Check optional fields if present
    for field in optional_lesson_fields:
        if field in lesson and lesson[field] is not None:
            expected_type = lesson_schema[field]
            errors.extend(validate_type(lesson[field], expected_type, field))
    
    # Special validations for lessons
    if 'code' in lesson and isinstance(lesson['code'], dict):
        code_errors = validate_nested_object(lesson['code'], ['example', 'explanation', 'language'], 'Code object')
        errors.extend(code_errors)
    
    if 'pitfalls' in lesson and isinstance(lesson['pitfalls'], list):
        for i, pitfall in enumerate(lesson['pitfalls']):
            if isinstance(pitfall, dict):
                pitfall_errors = validate_nested_object(pitfall, ['mistake', 'solution', 'severity'], f'Pitfall {i}')
                errors.extend(pitfall_errors)
    
    if 'exercises' in lesson and isinstance(lesson['exercises'], list):
        for i, exercise in enumerate(lesson['exercises']):
            if isinstance(exercise, dict):
                exercise_errors = validate_nested_object(exercise, ['title', 'description', 'checkpoints'], f'Exercise {i}')
                errors.extend(exercise_errors)
    
    if 'sources' in lesson and isinstance(lesson['sources'], list):
        for i, source in enumerate(lesson['sources']):
            if isinstance(source, dict):
                source_errors = validate_nested_object(source, ['title', 'url'], f'Source {i}')
                errors.extend(source_errors)
    
    # Validate difficulty
    if 'difficulty' in lesson and lesson['difficulty'] not in valid_difficulties:
        errors.append(f"Invalid difficulty: {lesson['difficulty']}. Should be one of: {', '.join(valid_difficulties)}")
    
    return errors

def validate_question(question: Dict[str, Any]) -> List[str]:
    """Validate a question object against the BaseInterviewQuestion schema."""
    errors = []
    
    # Check required fields
    for field in required_question_fields:
        if field not in question or question[field] is None:
            errors.append(f"Missing required field: {field}")
            continue
        
        # Type validation
        expected_type = question_schema[field]
        errors.extend(validate_type(question[field], expected_type, field))
    
    # Special validations for questions
    if 'sources' in question and isinstance(question['sources'], list):
        for i, source in enumerate(question['sources']):
            if isinstance(source, dict):
                source_errors = validate_nested_object(source, ['title', 'url'], f'Source {i}')
                errors.extend(source_errors)
    
    # Validate correctAnswer range
    if 'choices' in question and 'correctAnswer' in question:
        if isinstance(question['choices'], list) and isinstance(question['correctAnswer'], int):
            if question['correctAnswer'] < 0 or question['correctAnswer'] >= len(question['choices']):
                errors.append(f"Invalid correctAnswer: {question['correctAnswer']}. Should be between 0 and {len(question['choices']) - 1}")
    
    # Validate difficulty
    if 'difficulty' in question and question['difficulty'] not in valid_difficulties:
        errors.append(f"Invalid difficulty: {question['difficulty']}. Should be one of: {', '.join(valid_difficulties)}")
    
    # Validate question type
    if 'questionType' in question and question['questionType'] not in valid_question_types:
        errors.append(f"Invalid question type: {question['questionType']}. Should be one of: {', '.join(valid_question_types)}")
    
    return errors

def validate_quiz(data: Union[Dict[str, Any], List[Dict[str, Any]]]) -> List[str]:
    """Validate a quiz object or array of questions."""
    errors = []
    questions = []
    
    # Handle both formats: array of questions or quiz object with questions array
    if isinstance(data, list):
        # Direct array of questions format
        questions = data
    elif isinstance(data, dict):
        # Quiz object format with questions array
        if 'questions' not in data:
            errors.append("Missing 'questions' field")
            return errors
        
        if not isinstance(data['questions'], list):
            errors.append("'questions' should be a list")
            return errors
        
        questions = data['questions']
        
        # Validate question count if totalQuestions is present
        if 'totalQuestions' in data:
            if not isinstance(data['totalQuestions'], int):
                errors.append("'totalQuestions' should be an integer")
            elif len(questions) != data['totalQuestions']:
                errors.append(f"Question count mismatch: expected {data['totalQuestions']}, got {len(questions)}")
    else:
        errors.append("Quiz file should contain either an array of questions or an object with a questions array")
        return errors
    
    # Validate each question
    for i, question in enumerate(questions):
        if not isinstance(question, dict):
            errors.append(f"Question {i} should be an object")
            continue
        
        question_errors = validate_question(question)
        for error in question_errors:
            errors.append(f"Question {i}: {error}")
    
    return errors

def validate_file(file_path: str) -> Dict[str, Any]:
    """Validate a single file."""
    result = {
        'file': file_path,
        'valid': True,
        'errors': []
    }
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        result['valid'] = False
        result['errors'].append(f"JSON parsing error: {e}")
        return result
    except FileNotFoundError:
        result['valid'] = False
        result['errors'].append("File not found")
        return result
    
    # Determine file type and validate accordingly
    if file_path.endswith('-lesson.json') or 'lessons' in file_path:
        # Lesson file
        if isinstance(data, list):
            for i, lesson in enumerate(data):
                lesson_errors = validate_lesson(lesson)
                for error in lesson_errors:
                    result['errors'].append(f"Lesson {i}: {error}")
        else:
            lesson_errors = validate_lesson(data)
            result['errors'].extend(lesson_errors)
    elif file_path.endswith('-quiz.json') or 'quizzes' in file_path:
        # Quiz file
        quiz_errors = validate_quiz(data)
        result['errors'].extend(quiz_errors)
    else:
        result['errors'].append("Unknown file type - cannot determine validation schema")
    
    if result['errors']:
        result['valid'] = False
    
    return result

def validate_all_files(content_dir: str) -> Dict[str, Any]:
    """Validate all content files in the directory."""
    results = {
        'summary': {
            'total_files': 0,
            'valid_files': 0,
            'invalid_files': 0
        },
        'files': []
    }
    
    # Find all JSON files
    for root, dirs, files in os.walk(content_dir):
        for file in files:
            if file.endswith('.json'):
                file_path = os.path.join(root, file)
                file_result = validate_file(file_path)
                results['files'].append(file_result)
                results['summary']['total_files'] += 1
                
                if file_result['valid']:
                    results['summary']['valid_files'] += 1
                else:
                    results['summary']['invalid_files'] += 1
    
    return results

def main():
    """Main function to run validation."""
    if len(sys.argv) < 2:
        print("Usage: python schema_validator.py <content_directory>")
        sys.exit(1)
    
    content_dir = sys.argv[1]
    if not os.path.exists(content_dir):
        print(f"Error: Directory {content_dir} does not exist")
        sys.exit(1)
    
    results = validate_all_files(content_dir)
    
    # Print summary
    print(f"Validation Summary:")
    print(f"Total files: {results['summary']['total_files']}")
    print(f"Valid files: {results['summary']['valid_files']}")
    print(f"Invalid files: {results['summary']['invalid_files']}")
    print()
    
    # Print detailed results
    for file_result in results['files']:
        if not file_result['valid']:
            print(f"❌ {file_result['file']}")
            for error in file_result['errors']:
                print(f"   - {error}")
        else:
            print(f"✅ {file_result['file']}")
    
    # Exit with error code if any files are invalid
    if results['summary']['invalid_files'] > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()