#!/usr/bin/env python3
"""
Schema Validator for GlassCode Academy
Validates lesson and quiz JSON files against expected schemas
"""

import json
import os
import sys
from pathlib import Path

class SchemaValidator:
    def __init__(self):
        # Set up paths to the actual content directory relative to script location
        script_dir = Path(__file__).parent.absolute()
        self.content_path = script_dir / ".." / ".." / "content"
        self.lessons_path = self.content_path / "lessons"
        self.quizzes_path = self.content_path / "quizzes"
        
        # Expected schemas based on C# models
        self.lesson_schema = {
            "required_fields": {
                "id", "moduleSlug", "title", "order", "objectives", 
                "intro", "code", "pitfalls", "exercises", "next", 
                "estimatedMinutes", "difficulty", "tags"
            },
            "optional_fields": {"explanation", "language"},
            "field_types": {
                "id": str,
                "moduleSlug": str,
                "title": str,
                "order": int,
                "objectives": list,
                "intro": str,
                "code": str,
                "pitfalls": list,
                "exercises": list,
                "next": str,
                "estimatedMinutes": int,
                "difficulty": str,
                "tags": list,
                "explanation": str,
                "language": str
            }
        }
        
        self.quiz_schema = {
            "required_fields": {
                "moduleSlug", "title", "totalQuestions", "passingScore", 
                "timeLimit", "questions"
            },
            "field_types": {
                "moduleSlug": str,
                "title": str,
                "totalQuestions": int,
                "passingScore": int,
                "timeLimit": int,
                "questions": list
            }
        }
        
        self.question_schema = {
            "required_fields": {
                "id", "question", "topic", "difficulty", "choices", 
                "correctIndex", "explanation", "industryContext", 
                "tags", "questionType", "estimatedTime", "correctAnswer"
            },
            "field_types": {
                "id": str,
                "question": str,
                "topic": str,
                "difficulty": str,
                "choices": list,
                "correctIndex": int,
                "explanation": str,
                "industryContext": str,
                "tags": list,
                "questionType": str,
                "estimatedTime": int,
                "correctAnswer": str
            }
        }
        
        self.validation_results = {
            "lessons": {},
            "quizzes": {},
            "summary": {
                "total_files": 0,
                "valid_files": 0,
                "files_with_errors": 0,
                "total_errors": 0
            }
        }

    def validate_field_type(self, value, expected_type, field_name):
        """Validate that a field has the expected type"""
        errors = []
        
        if expected_type == str and not isinstance(value, str):
            errors.append(f"Field '{field_name}' should be string, got {type(value).__name__}")
        elif expected_type == int and not isinstance(value, int):
            errors.append(f"Field '{field_name}' should be integer, got {type(value).__name__}")
        elif expected_type == list and not isinstance(value, list):
            errors.append(f"Field '{field_name}' should be array, got {type(value).__name__}")
        elif expected_type == dict and not isinstance(value, dict):
            errors.append(f"Field '{field_name}' should be object, got {type(value).__name__}")
            
        return errors

    def validate_lesson_structure(self, lesson, file_name):
        """Validate a single lesson against the expected schema"""
        errors = []
        
        # Check required fields
        for field in self.lesson_schema["required_fields"]:
            if field not in lesson:
                errors.append(f"Missing required field: {field}")
            else:
                # Check field type
                expected_type = self.lesson_schema["field_types"].get(field)
                if expected_type:
                    errors.extend(self.validate_field_type(
                        lesson[field], expected_type, field
                    ))
        
        # Check for unexpected fields
        all_expected_fields = (
            self.lesson_schema["required_fields"] | 
            self.lesson_schema["optional_fields"]
        )
        for field in lesson.keys():
            if field not in all_expected_fields:
                errors.append(f"Unexpected field: {field}")
        
        # Validate specific field constraints
        if "pitfalls" in lesson and isinstance(lesson["pitfalls"], list):
            for i, pitfall in enumerate(lesson["pitfalls"]):
                if not isinstance(pitfall, dict):
                    errors.append(f"Pitfall {i} should be an object")
                else:
                    required_pitfall_fields = {"mistake", "solution", "severity"}
                    for pfield in required_pitfall_fields:
                        if pfield not in pitfall:
                            errors.append(f"Pitfall {i} missing field: {pfield}")
        
        if "exercises" in lesson and isinstance(lesson["exercises"], list):
            for i, exercise in enumerate(lesson["exercises"]):
                if not isinstance(exercise, dict):
                    errors.append(f"Exercise {i} should be an object")
                else:
                    required_exercise_fields = {"title", "description", "checkpoints"}
                    for efield in required_exercise_fields:
                        if efield not in exercise:
                            errors.append(f"Exercise {i} missing field: {efield}")
        
        return errors

    def validate_quiz_structure(self, quiz, file_name):
        """Validate a quiz file against the expected schema"""
        errors = []
        
        # Check required fields
        for field in self.quiz_schema["required_fields"]:
            if field not in quiz:
                errors.append(f"Missing required field: {field}")
            else:
                expected_type = self.quiz_schema["field_types"].get(field)
                if expected_type:
                    errors.extend(self.validate_field_type(
                        quiz[field], expected_type, field
                    ))
        
        # Validate questions array
        if "questions" in quiz and isinstance(quiz["questions"], list):
            for i, question in enumerate(quiz["questions"]):
                question_errors = self.validate_question_structure(question, i)
                errors.extend([f"Question {i+1}: {err}" for err in question_errors])
        
        # Validate totalQuestions matches actual count
        if "questions" in quiz and "totalQuestions" in quiz:
            actual_count = len(quiz["questions"])
            declared_count = quiz["totalQuestions"]
            if actual_count != declared_count:
                errors.append(f"totalQuestions ({declared_count}) doesn't match actual count ({actual_count})")
        
        return errors

    def validate_question_structure(self, question, index):
        """Validate a single question against the expected schema"""
        errors = []
        
        # Check required fields
        for field in self.question_schema["required_fields"]:
            if field not in question:
                errors.append(f"Missing required field: {field}")
            else:
                expected_type = self.question_schema["field_types"].get(field)
                if expected_type:
                    errors.extend(self.validate_field_type(
                        question[field], expected_type, field
                    ))
        
        # Validate choices array
        if "choices" in question and isinstance(question["choices"], list):
            if len(question["choices"]) < 2:
                errors.append("Should have at least 2 choices")
        
        # Validate correctIndex
        if "correctIndex" in question and "choices" in question:
            if isinstance(question["correctIndex"], int) and isinstance(question["choices"], list):
                if question["correctIndex"] >= len(question["choices"]) or question["correctIndex"] < 0:
                    errors.append(f"correctIndex ({question['correctIndex']}) out of range for choices array")
        
        # Validate ID format (should be string)
        if "id" in question:
            if not isinstance(question["id"], str):
                errors.append(f"ID should be string, got {type(question['id']).__name__}")
        
        return errors

    def validate_file(self, file_path, file_type):
        """Validate a single JSON file"""
        result = {
            "file": str(file_path.name),
            "path": str(file_path),
            "type": file_type,
            "valid": True,
            "errors": [],
            "warnings": []
        }
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if file_type == "lesson":
                # Lessons are arrays
                if not isinstance(data, list):
                    result["errors"].append("Lesson file should contain an array")
                else:
                    for i, lesson in enumerate(data):
                        lesson_errors = self.validate_lesson_structure(lesson, file_path.name)
                        result["errors"].extend([f"Lesson {i+1}: {err}" for err in lesson_errors])
            
            elif file_type == "quiz":
                # Quizzes are objects
                if not isinstance(data, dict):
                    result["errors"].append("Quiz file should contain an object")
                else:
                    result["errors"].extend(self.validate_quiz_structure(data, file_path.name))
            
        except json.JSONDecodeError as e:
            result["errors"].append(f"Invalid JSON: {str(e)}")
        except Exception as e:
            result["errors"].append(f"Error reading file: {str(e)}")
        
        if result["errors"]:
            result["valid"] = False
        
        return result

    def validate_all_files(self):
        """Validate all lesson and quiz files"""
        print("🔍 Starting comprehensive schema validation...")
        
        # Validate lesson files
        if self.lessons_path.exists():
            for lesson_file in self.lessons_path.glob("*.json"):
                result = self.validate_file(lesson_file, "lesson")
                self.validation_results["lessons"][lesson_file.name] = result
                self.validation_results["summary"]["total_files"] += 1
                if result["valid"]:
                    self.validation_results["summary"]["valid_files"] += 1
                else:
                    self.validation_results["summary"]["files_with_errors"] += 1
                    self.validation_results["summary"]["total_errors"] += len(result["errors"])
        
        # Validate quiz files
        if self.quizzes_path.exists():
            for quiz_file in self.quizzes_path.glob("*.json"):
                result = self.validate_file(quiz_file, "quiz")
                self.validation_results["quizzes"][quiz_file.name] = result
                self.validation_results["summary"]["total_files"] += 1
                if result["valid"]:
                    self.validation_results["summary"]["valid_files"] += 1
                else:
                    self.validation_results["summary"]["files_with_errors"] += 1
                    self.validation_results["summary"]["total_errors"] += len(result["errors"])

    def print_results(self):
        """Print validation results"""
        print("\n" + "="*80)
        print("📊 SCHEMA VALIDATION RESULTS")
        print("="*80)
        
        summary = self.validation_results["summary"]
        print(f"📁 Total files checked: {summary['total_files']}")
        print(f"✅ Valid files: {summary['valid_files']}")
        print(f"❌ Files with errors: {summary['files_with_errors']}")
        print(f"🚨 Total errors: {summary['total_errors']}")
        
        if summary["files_with_errors"] == 0:
            print("\n🎉 All files passed schema validation!")
            return True
        
        # Print detailed errors
        print("\n" + "-"*80)
        print("📋 DETAILED ERROR REPORT")
        print("-"*80)
        
        for category in ["lessons", "quizzes"]:
            category_results = self.validation_results[category]
            if not category_results:
                continue
                
            print(f"\n📚 {category.upper()} FILES:")
            for file_name, result in category_results.items():
                if not result["valid"]:
                    print(f"\n❌ {file_name}:")
                    for error in result["errors"]:
                        print(f"   • {error}")
        
        return False

    def generate_report_file(self):
        """Generate a detailed validation report file"""
        report_path = Path("/Users/veland/GlassCodeAcademy/glasscode/schema_validation_report.json")
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(self.validation_results, f, indent=2, ensure_ascii=False)
        print(f"\n📄 Detailed report saved to: {report_path}")

def main():
    validator = SchemaValidator()
    validator.validate_all_files()
    
    success = validator.print_results()
    validator.generate_report_file()
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()