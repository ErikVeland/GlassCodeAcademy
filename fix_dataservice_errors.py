#!/usr/bin/env python3

import re
import os

def fix_dataservice_errors():
    file_path = "/Users/veland/GlassCodeAcademy/glasscode/backend/Services/DataService.cs"
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Fix method signatures - change int questionId to string questionId
    content = re.sub(r'public AnswerResult Validate(\w+)Answer\(int questionId', 
                     r'public AnswerResult Validate\1Answer(string questionId', content)
    
    # Fix GetQuestionById method signatures if they exist
    content = re.sub(r'GetQuestionById\(int questionId\)', 
                     r'GetQuestionById(string questionId)', content)
    
    # Fix ID assignments in data loading - change from int to string
    content = re.sub(r'Id = GetIntFlexible\(q, "id"\) \?\? 0,', 
                     r'Id = GetString(q, "id") ?? "0",', content)
    
    # Fix ID comparisons - remove int.TryParse and direct comparison
    # Pattern: if (int.TryParse(questionId, out int someVar)) { ... q.Id == someVar ...}
    content = re.sub(r'if \(int\.TryParse\(questionId, out int (\w+)\)\)\s*\{\s*var (\w+) = (\w+)\.FirstOrDefault\(q => q\.Id == \1\);',
                     r'var \2 = \3.FirstOrDefault(q => q.Id == questionId);',
                     content, flags=re.MULTILINE | re.DOTALL)
    
    # Fix remaining direct ID comparisons where q.Id == someIntVariable
    content = re.sub(r'q\.Id == (\w+QuestionId)', r'q.Id == questionId', content)
    
    # Fix any remaining int.TryParse patterns
    content = re.sub(r'int\.TryParse\(questionId, out int \w+\)', 'true', content)
    
    # Fix method group comparisons (when method name is compared to string)
    content = re.sub(r'(\w+)\.Type == "open-ended" \|\|\s*\(\1\.CorrectAnswer\.HasValue && answerIndex == \1\.CorrectAnswer\.Value\)',
                     r'\1.Type == "open-ended" || (\1.CorrectAnswer.HasValue && answerIndex == \1.CorrectAnswer.Value)', content)
    
    with open(file_path, 'w') as f:
        f.write(content)
    
    print("Fixed DataService.cs compilation errors")
    print(f"Updated {file_path}")

if __name__ == "__main__":
    fix_dataservice_errors()