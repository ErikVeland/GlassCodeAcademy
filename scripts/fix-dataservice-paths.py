#!/usr/bin/env python3
"""
DataService Path Fixer Script

This script automatically fixes incorrect path references in DataService.cs
by removing the "../../../" components and making paths relative to 
AppDomain.CurrentDomain.BaseDirectory.

Based on the Next.js fix pattern:
- OLD: System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "content/lessons/...")
- NEW: System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "content/lessons/...")

Usage:
    python3 fix-dataservice-paths.py [--dry-run] [--file path/to/DataService.cs]
"""

import re
import sys
import argparse
from pathlib import Path

def fix_path_references(content):
    """
    Fix incorrect path references in DataService.cs content.
    
    Args:
        content (str): The file content to fix
        
    Returns:
        tuple: (fixed_content, changes_made)
    """
    changes_made = []
    
    # Pattern to match the incorrect path format
    # Matches: AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "content/...
    pattern = r'(System\.IO\.Path\.Combine\(AppDomain\.CurrentDomain\.BaseDirectory,\s*)"\.\."\s*,\s*"\.\."\s*,\s*"\.\."\s*,\s*("content/[^"]+"\))'
    
    def replacement(match):
        prefix = match.group(1)
        content_path = match.group(2)
        old_line = match.group(0)
        new_line = f"{prefix}{content_path}"
        
        changes_made.append({
            'old': old_line,
            'new': new_line
        })
        
        return new_line
    
    fixed_content = re.sub(pattern, replacement, content)
    
    return fixed_content, changes_made

def main():
    parser = argparse.ArgumentParser(description='Fix DataService.cs path references')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Show what would be changed without making changes')
    parser.add_argument('--file', type=str, 
                       default='../glasscode/backend/Services/DataService.cs',
                       help='Path to DataService.cs file')
    
    args = parser.parse_args()
    
    # Resolve the file path relative to the script location
    script_dir = Path(__file__).parent
    file_path = script_dir / args.file
    
    if not file_path.exists():
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    
    # Read the file
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)
    
    # Fix the paths
    fixed_content, changes_made = fix_path_references(content)
    
    if not changes_made:
        print("✅ No incorrect path references found. All paths are already correct!")
        return
    
    print(f"Found {len(changes_made)} path reference(s) to fix:")
    print()
    
    for i, change in enumerate(changes_made, 1):
        print(f"Change {i}:")
        print(f"  OLD: {change['old']}")
        print(f"  NEW: {change['new']}")
        print()
    
    if args.dry_run:
        print("🔍 DRY RUN: No changes were made to the file.")
        print(f"To apply these changes, run: python3 {Path(__file__).name} --file {args.file}")
    else:
        # Write the fixed content back to the file
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            print(f"✅ Successfully fixed {len(changes_made)} path reference(s) in {file_path}")
        except Exception as e:
            print(f"Error writing file: {e}")
            sys.exit(1)

if __name__ == '__main__':
    main()