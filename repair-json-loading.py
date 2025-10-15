#!/usr/bin/env python3
"""
Script to repair all JSON loading methods in DataService.cs to handle both:
1. Wrapper structures (quiz files with 'questions' array)
2. Direct arrays (lesson files)

This script will update all Load*Data methods to use the same pattern as LoadLaravelData.
"""

import re
import os
import json
from pathlib import Path

def get_content_types():
    """Get all content types based on the Load methods in DataService.cs"""
    return [
        'React', 'Web', 'Performance', 'Security', 'Tailwind', 'Vue', 
        'Database', 'DotNet', 'Node', 'NextJs', 'E2ETesting', 'Programming', 
        'Testing', 'VersionControl', 'Typescript', 'GraphQL', 'Sass'
    ]

def create_fixed_load_method(content_type):
    """Create a fixed Load method for the given content type"""
    
    # Determine file names based on content type
    if content_type == 'NextJs':
        lesson_file = 'nextjs-fundamentals.json'
        quiz_file = 'nextjs-fundamentals.json'  # Same file for NextJS
    elif content_type == 'E2ETesting':
        lesson_file = 'e2e-testing-fundamentals.json'
        quiz_file = 'e2e-testing-fundamentals.json'
    elif content_type == 'VersionControl':
        lesson_file = 'version-control-fundamentals.json'
        quiz_file = 'version-control-fundamentals.json'
    else:
        lesson_file = f'{content_type.lower()}-fundamentals.json'
        quiz_file = f'{content_type.lower()}-fundamentals.json'
    
    return f'''    private void Load{content_type}Data()
    {{
        try
        {{
            // Load {content_type} Lessons
            var {content_type.lower()}LessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "{content_type.lower()}_lessons.json");
            if (System.IO.File.Exists({content_type.lower()}LessonsPath))
            {{
                var {content_type.lower()}LessonsJson = System.IO.File.ReadAllText({content_type.lower()}LessonsPath);
                {content_type}Lessons = JsonSerializer.Deserialize<List<{content_type}Lesson>>({content_type.lower()}LessonsJson, new JsonSerializerOptions
                 {{
                     PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                     PropertyNameCaseInsensitive = true
                 }}) ?? new List<{content_type}Lesson>();
                Console.WriteLine($"Loaded {{{content_type}Lessons.Count()}} {content_type} lessons");
            }}

            // Load {content_type} Interview Questions
            var {content_type.lower()}QuestionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "{content_type.lower()}_questions.json");
            if (System.IO.File.Exists({content_type.lower()}QuestionsPath))
            {{
                var {content_type.lower()}QuestionsJson = System.IO.File.ReadAllText({content_type.lower()}QuestionsPath);
                
                // Parse as JsonDocument to check structure
                using var doc = JsonDocument.Parse({content_type.lower()}QuestionsJson);
                
                if (doc.RootElement.TryGetProperty("questions", out var questionsElement))
                {{
                    // Wrapper structure - deserialize the questions array
                    var questionsJson = questionsElement.GetRawText();
                    {content_type}InterviewQuestions = JsonSerializer.Deserialize<List<{content_type}InterviewQuestion>>(questionsJson, new JsonSerializerOptions
                     {{
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }}) ?? new List<{content_type}InterviewQuestion>();
                 }}
                 else
                 {{
                     // Direct array structure
                     {content_type}InterviewQuestions = JsonSerializer.Deserialize<List<{content_type}InterviewQuestion>>({content_type.lower()}QuestionsJson, new JsonSerializerOptions
                     {{
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }}) ?? new List<{content_type}InterviewQuestion>();
                }}
                
                Console.WriteLine($"Loaded {{{content_type}InterviewQuestions.Count()}} {content_type} interview questions");
            }}
        }}
        catch (Exception ex)
        {{
            Console.WriteLine($"Error loading {content_type} data: {{ex.Message}}");
            {content_type}Lessons = new List<{content_type}Lesson>();
            {content_type}InterviewQuestions = new List<{content_type}InterviewQuestion>();
        }}
    }}'''

def find_method_boundaries(content, method_name):
    """Find the start and end positions of a method in the content"""
    # Find the method declaration
    pattern = rf'private void {method_name}\(\)'
    match = re.search(pattern, content)
    if not match:
        return None, None
    
    start_pos = match.start()
    
    # Find the opening brace
    brace_pos = content.find('{', start_pos)
    if brace_pos == -1:
        return None, None
    
    # Count braces to find the matching closing brace
    brace_count = 1
    pos = brace_pos + 1
    
    while pos < len(content) and brace_count > 0:
        if content[pos] == '{':
            brace_count += 1
        elif content[pos] == '}':
            brace_count -= 1
        pos += 1
    
    if brace_count == 0:
        return start_pos, pos
    else:
        return None, None

def repair_dataservice():
    """Repair the DataService.cs file"""
    dataservice_path = "/Users/veland/GlassCodeAcademy/glasscode/backend/Services/DataService.cs"
    
    if not os.path.exists(dataservice_path):
        print(f"Error: DataService.cs not found at {dataservice_path}")
        return False
    
    # Read the current file
    with open(dataservice_path, 'r') as f:
        content = f.read()
    
    # Get all content types except Laravel (already fixed)
    content_types = [ct for ct in get_content_types() if ct != 'Laravel']
    
    # Replace each Load method one by one, working backwards to preserve positions
    replacements = []
    
    for content_type in content_types:
        method_name = f'Load{content_type}Data'
        start_pos, end_pos = find_method_boundaries(content, method_name)
        
        if start_pos is not None and end_pos is not None:
            replacement = create_fixed_load_method(content_type)
            replacements.append((start_pos, end_pos, replacement, content_type))
            print(f"Found {method_name} method at positions {start_pos}-{end_pos}")
        else:
            print(f"Warning: Could not find {method_name} method")
    
    # Sort replacements by start position in reverse order (work backwards)
    replacements.sort(key=lambda x: x[0], reverse=True)
    
    # Apply replacements
    for start_pos, end_pos, replacement, content_type in replacements:
        content = content[:start_pos] + replacement + content[end_pos:]
        print(f"Updated Load{content_type}Data method")
    
    # Write the updated content back
    with open(dataservice_path, 'w') as f:
        f.write(content)
    
    print(f"Successfully updated DataService.cs with {len(replacements)} fixed Load methods")
    return True

def main():
    """Main function"""
    print("Starting JSON loading repair script...")
    print("This script will update all Load*Data methods in DataService.cs")
    print("to handle both wrapper structures and direct arrays.")
    print()
    
    # Repair DataService.cs
    if repair_dataservice():
        print()
        print("✅ Repair completed successfully!")
        print("All Load*Data methods have been updated to handle both JSON structures.")
        print()
        print("Next steps:")
        print("1. Restart the backend to test the changes")
        print("2. Check the health endpoint to verify all content loads correctly")
    else:
        print("❌ Repair failed!")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())