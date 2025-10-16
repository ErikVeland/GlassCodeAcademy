#!/usr/bin/env python3
"""
Script to add 'legacy' property to all JSON lesson files that are missing it.
This ensures consistency across all lesson files.
"""

import json
import os
from pathlib import Path

# Define the default legacy structure for files that don't have legacy data
def get_default_legacy():
    return None  # Use null for files that don't have legacy information

# List of files that need the legacy property added
files_to_update = [
    "database-systems.json",
    "dotnet-fundamentals.json",
    "e2e-testing.json",
    "nextjs-advanced.json",
    "performance-optimization.json",
    "programming-fundamentals.json",
    "react-fundamentals.json",
    "security-fundamentals.json",
    "testing-fundamentals.json",
    "version-control.json",
    "web-fundamentals.json"
]

def add_legacy_to_file(file_path):
    """Add legacy property to each lesson object in the JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Add legacy property to each lesson object
        for lesson in data:
            if 'legacy' not in lesson:
                lesson['legacy'] = get_default_legacy()
        
        # Write back to file with proper formatting
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Added legacy property to {file_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return False

def main():
    lessons_dir = Path("/Users/veland/GlassCodeAcademy/content/lessons")
    
    print("Adding 'legacy' property to JSON lesson files...")
    print("=" * 50)
    
    success_count = 0
    total_count = len(files_to_update)
    
    for filename in files_to_update:
        file_path = lessons_dir / filename
        if file_path.exists():
            if add_legacy_to_file(file_path):
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