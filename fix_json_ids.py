#!/usr/bin/env python3

import json
import os
import glob

def convert_ids_to_strings(data):
    """Recursively convert integer IDs to strings in JSON data"""
    if isinstance(data, dict):
        for key, value in data.items():
            if key == "id" and isinstance(value, int):
                data[key] = str(value)
            else:
                convert_ids_to_strings(value)
    elif isinstance(data, list):
        for item in data:
            convert_ids_to_strings(item)

def fix_json_file(file_path):
    """Fix a single JSON file by converting integer IDs to strings"""
    try:
        print(f"Processing: {file_path}")
        
        # Read the file
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Convert IDs
        convert_ids_to_strings(data)
        
        # Write back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Successfully processed: {file_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return False

def main():
    """Main function to process all JSON files"""
    print("🔧 Starting comprehensive JSON ID conversion...")
    
    # Find all JSON files in content directory
    content_dir = "/Users/veland/GlassCodeAcademy/content"
    json_files = []
    
    # Get all JSON files recursively
    for root, dirs, files in os.walk(content_dir):
        for file in files:
            if file.endswith('.json') and file != 'registry.json':  # Skip registry.json
                json_files.append(os.path.join(root, file))
    
    print(f"📁 Found {len(json_files)} JSON files to process")
    
    success_count = 0
    error_count = 0
    
    for file_path in sorted(json_files):
        if fix_json_file(file_path):
            success_count += 1
        else:
            error_count += 1
    
    print(f"\n📊 Summary:")
    print(f"✅ Successfully processed: {success_count} files")
    print(f"❌ Errors: {error_count} files")
    print(f"🎯 Total files: {len(json_files)}")
    
    if error_count == 0:
        print("🎉 All JSON files have been successfully converted!")
    else:
        print("⚠️  Some files had errors. Please check the output above.")

if __name__ == "__main__":
    main()