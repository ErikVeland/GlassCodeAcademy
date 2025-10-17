#!/usr/bin/env python3
import json
import os
import re

def remove_legacy_fields(file_path):
    """Remove legacy fields from a JSON file"""
    print(f"Processing {file_path}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove legacy field blocks using regex
    # This pattern matches the legacy field and its entire content block (both objects and null values)
    # First remove legacy fields with trailing comma
    updated_content = re.sub(r'"legacy":\s*(\{[^}]*\}|null),\s*', '', content, flags=re.MULTILINE)
    # Then remove legacy fields with leading comma
    updated_content = re.sub(r',\s*"legacy":\s*(\{[^}]*\}|null)', '', updated_content, flags=re.MULTILINE)
    # Finally remove standalone legacy fields
    updated_content = re.sub(r'"legacy":\s*(\{[^}]*\}|null)', '', updated_content, flags=re.MULTILINE)
    
    # Clean up any double commas that might result from removal
    updated_content = re.sub(r',\s*,', ',', updated_content)
    
    # Clean up trailing commas before closing braces/brackets
    updated_content = re.sub(r',\s*([}\]])', r'\1', updated_content)
    
    # Validate JSON
    try:
        json.loads(updated_content)
        print(f"Valid JSON after removing legacy fields")
    except json.JSONDecodeError as e:
        print(f"Invalid JSON after processing: {e}")
        return False
    
    # Write back to file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    
    return True
    
    # Write the updated content back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    
    print(f"✓ Successfully removed legacy fields from {file_path}")
    return True

def main():
    # Quiz files
    script_dir = os.path.dirname(os.path.abspath(__file__))
    quiz_dir = os.path.join(script_dir, "content", "quizzes")
    # Process all quiz files in the directory
    quiz_files = []
    for file in os.listdir(quiz_dir):
        if file.endswith('.json'):
            quiz_files.append(file)
    
    success_count = 0
    total_count = len(quiz_files)
    
    for filename in quiz_files:
        file_path = os.path.join(quiz_dir, filename)
        if os.path.exists(file_path):
            if remove_legacy_fields(file_path):
                success_count += 1
        else:
            print(f"✗ File not found: {file_path}")
    
    print(f"\nProcessed {success_count}/{total_count} quiz files successfully")
    
    # Check if lessons directory exists and process lesson files
    lessons_dir = os.path.join(script_dir, "content", "lessons")
    if os.path.exists(lessons_dir):
        print(f"\nChecking for lesson files with legacy fields...")
        for root, dirs, files in os.walk(lessons_dir):
            for file in files:
                if file.endswith('.json') and 'SCHEMA' not in file.upper():
                    file_path = os.path.join(root, file)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if '"legacy"' in content:
                            print(f"Found legacy fields in lesson file: {file_path}")
                            if remove_legacy_fields(file_path):
                                success_count += 1
                            total_count += 1

if __name__ == "__main__":
    main()