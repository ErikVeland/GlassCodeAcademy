#!/usr/bin/env python3

import json
import re

def clean_dotnet_fundamentals():
    # Read the corrupted file
    with open('content/lessons/dotnet-fundamentals.json', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all JSON objects that look like lessons
    # Pattern to match lesson objects
    lesson_pattern = r'\{\s*"id"\s*:\s*"dotnet-fundamentals-lesson-\d+"[^}]*"version"\s*:\s*"[^"]*"\s*\}'
    
    lessons = []
    seen_ids = set()
    
    # Find all matches
    for match in re.finditer(lesson_pattern, content, re.DOTALL):
        lesson_str = match.group(0)
        try:
            # Parse the JSON object
            lesson_obj = json.loads(lesson_str)
            lesson_id = lesson_obj['id']
            
            # Only add if we haven't seen this ID before
            if lesson_id not in seen_ids:
                lessons.append(lesson_obj)
                seen_ids.add(lesson_id)
                print(f"Added lesson: {lesson_id}")
            else:
                print(f"Skipping duplicate lesson: {lesson_id}")
        except json.JSONDecodeError as e:
            print(f"Error parsing lesson: {e}")
            continue
    
    # Sort lessons by order field
    lessons.sort(key=lambda x: x.get('order', 0))
    
    # Write the cleaned JSON back to file
    with open('content/lessons/dotnet-fundamentals.json', 'w', encoding='utf-8') as f:
        json.dump(lessons, f, indent=2, ensure_ascii=False)
    
    print(f"Successfully cleaned file. Kept {len(lessons)} unique lessons.")

if __name__ == '__main__':
    clean_dotnet_fundamentals()