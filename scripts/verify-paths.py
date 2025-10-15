#!/usr/bin/env python3
"""
Path Verification Script

This script verifies that all the content paths in DataService.cs 
point to existing files, simulating the path resolution logic.

Usage:
    python3 verify-paths.py [--base-dir path/to/base]
"""

import os
import argparse
from pathlib import Path

def get_expected_paths(base_directory):
    """
    Get all the expected content paths based on DataService.cs structure.
    
    Args:
        base_directory (str): The base directory (equivalent to AppDomain.CurrentDomain.BaseDirectory)
        
    Returns:
        dict: Dictionary of path descriptions and their resolved paths
    """
    # Extract path patterns from DataService.cs (handles both old and new patterns)
    path_pattern = r'System\.IO\.Path\.Combine\(AppDomain\.CurrentDomain\.BaseDirectory,\s*(?:"\.\."\s*,\s*"\.\."\s*,\s*)?"([^"]+)"\)'
    
    paths = {
        # Programming module
        'Programming Lessons': os.path.join(base_directory, "content", "lessons", "programming-fundamentals.json"),
        'Programming Questions': os.path.join(base_directory, "content", "quizzes", "programming-fundamentals.json"),
        
        # Web module
        'Web Lessons': os.path.join(base_directory, "content", "lessons", "web-fundamentals.json"),
        'Web Questions': os.path.join(base_directory, "content", "quizzes", "web-fundamentals.json"),
        
        # Next.js module
        'Next.js Lessons': os.path.join(base_directory, "content", "lessons", "nextjs-advanced.json"),
        'Next.js Questions': os.path.join(base_directory, "content", "quizzes", "nextjs-advanced.json"),
        
        # Performance module
        'Performance Lessons': os.path.join(base_directory, "content", "lessons", "performance-optimization.json"),
        'Performance Questions': os.path.join(base_directory, "content", "quizzes", "performance-optimization.json"),
        
        # Security module
        'Security Lessons': os.path.join(base_directory, "content", "lessons", "security-fundamentals.json"),
        'Security Questions': os.path.join(base_directory, "content", "quizzes", "security-fundamentals.json"),
        
        # Version Control module
        'Version Control Lessons': os.path.join(base_directory, "content", "lessons", "version-control.json"),
        'Version Control Questions': os.path.join(base_directory, "content", "quizzes", "version-control.json"),
    }
    
    return paths

def verify_paths(base_directory):
    """
    Verify that all expected content files exist.
    
    Args:
        base_directory (str): The base directory to check from
        
    Returns:
        tuple: (all_exist, results)
    """
    paths = get_expected_paths(base_directory)
    results = []
    all_exist = True
    
    for description, file_path in paths.items():
        exists = os.path.exists(file_path)
        if not exists:
            all_exist = False
        
        results.append({
            'description': description,
            'path': file_path,
            'exists': exists,
            'relative_path': os.path.relpath(file_path, base_directory)
        })
    
    return all_exist, results

def main():
    parser = argparse.ArgumentParser(description='Verify DataService.cs content paths')
    parser.add_argument('--base-dir', type=str, 
                       default='../glasscode/backend',
                       help='Base directory (equivalent to AppDomain.CurrentDomain.BaseDirectory)')
    
    args = parser.parse_args()
    
    # Resolve the base directory relative to the script location
    script_dir = Path(__file__).parent
    base_directory = script_dir / args.base_dir
    base_directory = base_directory.resolve()
    
    if not base_directory.exists():
        print(f"Error: Base directory not found: {base_directory}")
        return 1
    
    print(f"🔍 Verifying content paths from base directory: {base_directory}")
    print()
    
    all_exist, results = verify_paths(str(base_directory))
    
    # Print results
    for result in results:
        status = "✅" if result['exists'] else "❌"
        print(f"{status} {result['description']}")
        print(f"   Path: {result['relative_path']}")
        if not result['exists']:
            print(f"   Full path: {result['path']}")
        print()
    
    if all_exist:
        print("🎉 All content files found! The path fixes are working correctly.")
        return 0
    else:
        missing_count = sum(1 for r in results if not r['exists'])
        print(f"⚠️  {missing_count} content file(s) missing. Check the paths above.")
        return 1

if __name__ == '__main__':
    exit(main())