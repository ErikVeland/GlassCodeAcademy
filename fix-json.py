#!/usr/bin/env python3

import json
import os
import sys
import re
from pathlib import Path

def fix_json_file(file_path):
    """Attempt to fix common JSON syntax errors"""
    try:
        # Read the file content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Try to parse as-is first
        try:
            data = json.loads(content)
            print(f"✓ {file_path.name}: Already valid")
            return True
        except json.JSONDecodeError as e:
            print(f"✗ {file_path.name}: {e}")
        
        # Try common fixes
        original_content = content
        
        # Fix 1: Remove trailing commas before } or ]
        content = re.sub(r',(\s*[}\]])', r'\1', content)
        
        # Fix 2: Handle control characters (replace common ones)
        content = content.replace('\x00', '').replace('\x01', '').replace('\x02', '')
        
        # Fix 3: Fix escape sequences
        content = content.replace('\\$', '$').replace('\\@', '@')
        
        # Fix 4: Remove extra characters at the end
        content = content.rstrip()
        while content.endswith((']%', '}%', '%', ']]', '}}')):
            if content.endswith(']%') or content.endswith('}%'):
                content = content[:-2]
            elif content.endswith('%'):
                content = content[:-1]
            elif content.endswith(']]'):
                content = content[:-1]
            elif content.endswith('}}'):
                content = content[:-1]
            content = content.rstrip()
        
        # Try to parse the fixed content
        try:
            data = json.loads(content)
            # Write the fixed content back
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"✓ {file_path.name}: Fixed successfully")
            return True
        except json.JSONDecodeError:
            # Try to find and fix specific issues
            lines = content.split('\n')
            
            # Fix 5: Handle missing commas between array/object elements
            fixed_lines = []
            for i, line in enumerate(lines):
                fixed_lines.append(line)
                # Check if this line ends with } or ] and next line starts with { or [
                if i < len(lines) - 1:
                    stripped_line = line.rstrip()
                    next_line = lines[i + 1].lstrip()
                    if (stripped_line.endswith(('}', ']')) and 
                        next_line.startswith(('{', '[')) and
                        not line.rstrip().endswith(',')):
                        # Add missing comma
                        fixed_lines[-1] = line.rstrip() + ','
            
            content = '\n'.join(fixed_lines)
            
            # Try parsing again
            try:
                data = json.loads(content)
                # Write the fixed content back
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print(f"✓ {file_path.name}: Fixed successfully (missing commas)")
                return True
            except json.JSONDecodeError:
                # Fix 6: Try to remove invalid escape sequences
                content = re.sub(r'\\([^"\\/bfnrtu])', r'\1', content)
                
                try:
                    data = json.loads(content)
                    # Write the fixed content back
                    with open(file_path, 'w', encoding='utf-8') as f:
                        json.dump(data, f, indent=2, ensure_ascii=False)
                    print(f"✓ {file_path.name}: Fixed successfully (escape sequences)")
                    return True
                except json.JSONDecodeError:
                    print(f"✗ {file_path.name}: Could not fix automatically")
                    return False
                
    except Exception as e:
        print(f"✗ {file_path.name}: Error processing file - {e}")
        return False

def main():
    content_dir = Path('content')
    lessons_dir = content_dir / 'lessons'
    quizzes_dir = content_dir / 'quizzes'
    
    fixed_count = 0
    error_count = 0
    
    # Fix lesson files
    print("=== Fixing Lesson Files ===")
    for json_file in lessons_dir.glob('*.json'):
        if fix_json_file(json_file):
            fixed_count += 1
        else:
            error_count += 1
    
    # Fix quiz files
    print("\n=== Fixing Quiz Files ===")
    for json_file in quizzes_dir.glob('*.json'):
        if fix_json_file(json_file):
            fixed_count += 1
        else:
            error_count += 1
    
    print(f"\n=== Summary ===")
    print(f"Fixed: {fixed_count} files")
    print(f"Errors: {error_count} files")
    
    if error_count > 0:
        print("\nSome files could not be automatically fixed. Please check them manually.")
        return 1
    else:
        print("\nAll JSON files are now valid!")
        return 0

if __name__ == '__main__':
    sys.exit(main())