#!/usr/bin/env python3
"""
Script to update all hardcoded paths in DataService.cs to use the new ContentPath variable
"""

import re

def fix_dataservice_paths():
    # Get the script directory and navigate to the DataService.cs file
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, "Services", "DataService.cs")
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Pattern to match the old path construction
    old_pattern = r'System\.IO\.Path\.Combine\(AppDomain\.CurrentDomain\.BaseDirectory,\s*"\.\."\s*,\s*"\.\."\s*,\s*"\.\."\s*,\s*"\.\."\s*,\s*"\.\."\s*,\s*"content"([^)]*)\)'
    
    def replace_path(match):
        # Extract the remaining path parts after "content"
        remaining_path = match.group(1)
        if remaining_path:
            # Remove leading comma and whitespace, then split by commas
            remaining_path = remaining_path.strip().lstrip(',').strip()
            if remaining_path:
                # Split by commas and clean up quotes
                parts = [part.strip().strip('"') for part in remaining_path.split(',')]
                parts_str = ', '.join(f'"{part}"' for part in parts)
                return f'System.IO.Path.Combine(ContentPath, {parts_str})'
        
        return 'ContentPath'
    
    # Replace all occurrences
    new_content = re.sub(old_pattern, replace_path, content)
    
    # Also handle the specific case where content is combined with subdirectories
    old_pattern2 = r'System\.IO\.Path\.Combine\(AppDomain\.CurrentDomain\.BaseDirectory,\s*"\.\."\s*,\s*"\.\."\s*,\s*"\.\."\s*,\s*"\.\."\s*,\s*"\.\."\s*,\s*"content/([^"]+)"\)'
    
    def replace_path2(match):
        path_part = match.group(1)
        # Split by / and create proper path combine
        parts = path_part.split('/')
        parts_str = ', '.join(f'"{part}"' for part in parts)
        return f'System.IO.Path.Combine(ContentPath, {parts_str})'
    
    new_content = re.sub(old_pattern2, replace_path2, new_content)
    
    # Write back the updated content
    with open(file_path, 'w') as f:
        f.write(new_content)
    
    print("✅ Updated all DataService paths to use ContentPath variable")

if __name__ == "__main__":
    fix_dataservice_paths()