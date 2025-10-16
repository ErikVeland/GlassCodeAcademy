#!/usr/bin/env python3
"""
Script to add 'sources' property to all JSON lesson files that are missing it.
This ensures consistency across all lesson files.
"""

import json
import os
from pathlib import Path

# Define the base sources template - can be customized per module
def get_default_sources():
    return []

# List of files that need the sources property added
files_to_update = [
    "dotnet-fundamentals.json",
    "e2e-testing.json", 
    "graphql-advanced.json",
    "laravel-fundamentals.json",
    "nextjs-advanced.json",
    "node-fundamentals.json",
    "performance-optimization.json",
    "programming-fundamentals.json",
    "sass-advanced.json",
    "security-fundamentals.json",
    "tailwind-advanced.json",
    "testing-fundamentals.json",
    "typescript-fundamentals.json",
    "version-control.json",
    "vue-advanced.json",
    "web-fundamentals.json"
]

def add_sources_to_file(file_path):
    """Add sources property to each lesson object in the JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Add sources property to each lesson object
        for lesson in data:
            if 'sources' not in lesson:
                lesson['sources'] = get_default_sources()
        
        # Write back to file with proper formatting
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Added sources property to {file_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return False

def main():
    lessons_dir = Path("/Users/veland/GlassCodeAcademy/content/lessons")
    
    print("Adding 'sources' property to JSON lesson files...")
    print("=" * 50)
    
    success_count = 0
    total_count = len(files_to_update)
    
    for filename in files_to_update:
        file_path = lessons_dir / filename
        if file_path.exists():
            if add_sources_to_file(file_path):
                success_count += 1
        else:
            print(f"⚠️  File not found: {filename}")
    
    print("=" * 50)
    print(f"Successfully updated {success_count}/{total_count} files")
    
    if success_count == total_count:
        print("🎉 All files updated successfully!")
    else:
        print(f"⚠️  {total_count - success_count} files had issues")

if __name__ == "__main__":
    main()