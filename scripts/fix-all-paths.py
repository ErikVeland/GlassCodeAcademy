#!/usr/bin/env python3
"""
Script to fix all content paths in DataService.cs to use the correct relative path.
The backend runs from glasscode/backend but content is at the project root.
"""

import re
import os

def fix_dataservice_paths():
    dataservice_path = "/Users/veland/GlassCodeAcademy/glasscode/backend/Services/DataService.cs"
    
    if not os.path.exists(dataservice_path):
        print(f"Error: {dataservice_path} not found")
        return False
    
    # Read the file
    with open(dataservice_path, 'r') as f:
        content = f.read()
    
    # Pattern to match content paths that need fixing
    pattern = r'System\.IO\.Path\.Combine\(AppDomain\.CurrentDomain\.BaseDirectory,\s*"content/(lessons|quizzes)/([^"]+)"\)'
    
    # Replacement pattern - add "..", ".." to go up two levels
    replacement = r'System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "content/\1/\2")'
    
    # Find all matches
    matches = re.findall(pattern, content)
    print(f"Found {len(matches)} paths to fix:")
    for match in matches:
        print(f"  - content/{match[0]}/{match[1]}")
    
    # Apply the replacement
    new_content = re.sub(pattern, replacement, content)
    
    # Check if any changes were made
    if content == new_content:
        print("No changes needed - all paths are already correct")
        return True
    
    # Write the updated content back
    with open(dataservice_path, 'w') as f:
        f.write(new_content)
    
    print(f"Successfully updated {len(matches)} paths in DataService.cs")
    return True

if __name__ == "__main__":
    fix_dataservice_paths()