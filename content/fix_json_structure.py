#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
JSON Structure Fixer for GlassCode Academy Content
Converts all JSON files to match the working schema used by DotNet and GraphQL content.
"""

import json
import os
import sys
import re
import glob

def fix_lesson_json(data, file_path):
    """Fix lesson JSON structure to match working schema"""
    changes = []
    
    if isinstance(data, list):
        # Already correct format - array of lesson objects
        for i, lesson in enumerate(data):
            if not isinstance(lesson, dict):
                continue
                
            # Ensure required fields exist
            required_fields = {
                'id': "lesson-" + str(i+1),
                'moduleSlug': os.path.splitext(os.path.basename(file_path))[0],
                'title': "Lesson " + str(i+1),
                'order': i + 1,
                'objectives': [],
                'intro': "",
                'code': {
                    'example': '',
                    'explanation': '',
                    'language': 'javascript'
                },
                'pitfalls': [],
                'exercises': []
            }
            
            for field, default_value in required_fields.items():
                if field not in lesson:
                    lesson[field] = default_value
                    changes.append("Added missing field '" + field + "' to lesson " + str(i+1))
        
        return data, changes
    else:
        # Convert single object to array format
        changes.append("Converted single lesson object to array format")
        return [data], changes

def fix_quiz_json(data, file_path):
    """Fix quiz JSON structure to match working schema"""
    changes = []
    
    if not isinstance(data, dict):
        changes.append("ERROR: Quiz file should be a single object")
        return data, changes
    
    # Ensure required top-level fields
    module_slug = os.path.splitext(os.path.basename(file_path))[0]
    required_fields = {
        'moduleSlug': module_slug,
        'title': module_slug.replace('-', ' ').title() + " Assessment",
        'description': "Comprehensive assessment covering key concepts from the " + module_slug + " module",
        'totalQuestions': 0,
        'passingScore': 70,
        'timeLimit': 30,
        'questions': []
    }
    
    for field, default_value in required_fields.items():
        if field not in data:
            data[field] = default_value
            changes.append("Added missing field '" + field + "'")
    
    # Fix questions array
    if 'questions' in data and isinstance(data['questions'], list):
        for i, question in enumerate(data['questions']):
            if not isinstance(question, dict):
                continue
            
            # Convert string IDs to integers
            if 'id' in question:
                if isinstance(question['id'], str):
                    # Try to extract number from string ID
                    match = re.search(r'(\d+)', question['id'])
                    if match:
                        question['id'] = int(match.group(1))
                        changes.append("Converted string ID to integer for question " + str(i+1))
                    else:
                        question['id'] = i + 1
                        changes.append("Generated new integer ID for question " + str(i+1))
            else:
                question['id'] = i + 1
                changes.append("Added missing ID for question " + str(i+1))
            
            # Ensure required question fields
            question_defaults = {
                'question': "Question " + str(i+1),
                'topic': "General",
                'difficulty': "Beginner",
                'choices': [],
                'correctIndex': 0,
                'explanation': "",
                'industryContext': "",
                'tags': [],
                'questionType': "multiple-choice",
                'estimatedTime': 60,
                'correctAnswer': 0
            }
            
            for field, default_value in question_defaults.items():
                if field not in question:
                    question[field] = default_value
                    changes.append("Added missing field '" + field + "' to question " + str(i+1))
            
            # Fix choices field - ensure it's an array
            if question['choices'] is None:
                question['choices'] = []
                changes.append("Fixed null choices for question " + str(i+1))
            elif not isinstance(question['choices'], list):
                question['choices'] = []
                changes.append("Converted non-array choices to array for question " + str(i+1))
            
            # Ensure correctIndex and correctAnswer are consistent
            if 'correctIndex' in question:
                question['correctAnswer'] = question['correctIndex']
            elif 'correctAnswer' in question:
                question['correctIndex'] = question['correctAnswer']
        
        # Update totalQuestions
        data['totalQuestions'] = len(data['questions'])
        if len(data['questions']) > 0:
            changes.append("Updated totalQuestions to " + str(len(data['questions'])))
    
    return data, changes

def process_json_file(file_path, dry_run=True):
    """Process a single JSON file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        changes = []
        
        # Determine if this is a lesson or quiz file
        if 'lessons' in str(file_path):
            fixed_data, file_changes = fix_lesson_json(data, file_path)
        elif 'quizzes' in str(file_path):
            fixed_data, file_changes = fix_quiz_json(data, file_path)
        else:
            # Skip files that aren't lessons or quizzes
            return []
        
        changes.extend(file_changes)
        
        if changes and not dry_run:
            # Write the fixed data back to file
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(fixed_data, f, indent=2, ensure_ascii=False)
            print("✅ Fixed " + str(file_path))
        elif changes:
            print("📝 Would fix " + str(file_path) + ":")
            for change in changes:
                print("   - " + change)
        
        return changes
        
    except json.JSONDecodeError as e:
        error_msg = "❌ JSON decode error in " + str(file_path) + ": " + str(e)
        print(error_msg)
        return [error_msg]
    except Exception as e:
        error_msg = "❌ Error processing " + str(file_path) + ": " + str(e)
        print(error_msg)
        return [error_msg]

def main():
    """Main function to process all JSON files"""
    content_dir = os.path.dirname(os.path.abspath(__file__))
    dry_run = '--dry-run' in sys.argv or len(sys.argv) == 1
    
    if dry_run:
        print("🔍 DRY RUN MODE - No files will be modified")
        print("Run with --apply to actually make changes")
    else:
        print("🔧 APPLYING CHANGES")
    
    print()
    
    # Find all JSON files in lessons and quizzes directories
    json_files = []
    lessons_pattern = os.path.join(content_dir, 'lessons', '**', '*.json')
    quizzes_pattern = os.path.join(content_dir, 'quizzes', '**', '*.json')
    
    json_files.extend(glob.glob(lessons_pattern, recursive=True))
    json_files.extend(glob.glob(quizzes_pattern, recursive=True))
    
    total_changes = 0
    error_count = 0
    
    for json_file in sorted(json_files):
        changes = process_json_file(json_file, dry_run)
        if any('ERROR' in change for change in changes):
            error_count += 1
        total_changes += len(changes)
    
    print()
    print("📊 Summary:")
    print("   Files processed: " + str(len(json_files)))
    print("   Total changes: " + str(total_changes))
    print("   Errors: " + str(error_count))
    
    if dry_run and total_changes > 0:
        print()
        print("To apply these changes, run:")
        print("python fix_json_structure.py --apply")

if __name__ == "__main__":
    main()