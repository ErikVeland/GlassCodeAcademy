#!/usr/bin/env python3
"""
Script to fix JSON files in content/ directory by converting string IDs to integers.
This script will:
1. Find all .json files in the content/ directory
2. Convert "id": "123" to "id": 123 (string to integer)
3. Preserve all other data structure and formatting
4. Create backups before modifying files
"""

import json
import os
import re
import shutil
from pathlib import Path

def backup_file(file_path):
    """Create a backup of the file before modifying it."""
    backup_path = f"{file_path}.backup"
    if not os.path.exists(backup_path):
        shutil.copy2(file_path, backup_path)
        print(f"✓ Created backup: {backup_path}")
    else:
        print(f"⚠ Backup already exists: {backup_path}")

def fix_json_ids(file_path):
    """Fix string IDs in a JSON file by converting them to integers."""
    try:
        # Read the file content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if file contains string IDs that need fixing
        if not re.search(r'"id":\s*"[0-9]+"', content):
            print(f"⏭ No string IDs found in: {file_path}")
            return False
        
        # Create backup before modifying
        backup_file(file_path)
        
        # Parse JSON to validate structure
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in {file_path}: {e}")
            return False
        
        # Use regex to replace string IDs with integer IDs
        # This preserves formatting better than parsing and re-serializing JSON
        fixed_content = re.sub(
            r'"id":\s*"([0-9]+)"',
            r'"id": \1',
            content
        )
        
        # Verify the fix worked by parsing the modified JSON
        try:
            json.loads(fixed_content)
        except json.JSONDecodeError as e:
            print(f"❌ Fixed JSON is invalid in {file_path}: {e}")
            return False
        
        # Write the fixed content back to the file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        # Count how many IDs were fixed
        id_count = len(re.findall(r'"id":\s*[0-9]+', fixed_content))
        print(f"✅ Fixed {id_count} IDs in: {file_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return False

def main():
    """Main function to process all JSON files in content/ directory."""
    content_dir = Path("content")
    
    if not content_dir.exists():
        print("❌ Content directory not found!")
        return
    
    # Find all JSON files in content/ directory and subdirectories
    json_files = list(content_dir.rglob("*.json"))
    
    if not json_files:
        print("❌ No JSON files found in content/ directory!")
        return
    
    print(f"🔍 Found {len(json_files)} JSON files to process...")
    print()
    
    fixed_count = 0
    skipped_count = 0
    error_count = 0
    
    for json_file in sorted(json_files):
        # Skip backup files
        if json_file.name.endswith('.backup'):
            continue
            
        print(f"Processing: {json_file}")
        
        result = fix_json_ids(json_file)
        if result is True:
            fixed_count += 1
        elif result is False:
            skipped_count += 1
        else:
            error_count += 1
        
        print()
    
    print("=" * 50)
    print("SUMMARY:")
    print(f"✅ Files fixed: {fixed_count}")
    print(f"⏭ Files skipped (no string IDs): {skipped_count}")
    print(f"❌ Files with errors: {error_count}")
    print(f"📁 Total files processed: {len([f for f in json_files if not f.name.endswith('.backup')])}")
    
    if fixed_count > 0:
        print()
        print("🎉 ID conversion completed successfully!")
        print("💾 Backup files were created with .backup extension")
        print("🔍 You can verify the changes by checking the modified files")

if __name__ == "__main__":
    main()