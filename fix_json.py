import json
import re

# Read the JSON file
with open('/Users/veland/GlassCodeAcademy/content/lessons/programming-fundamentals.json', 'r') as f:
    content = f.read()

# Fix the backslashes in the tree diagram
# The issue is in lesson 9 where backslashes are not properly escaped
pattern = r'// Create a simple binary tree\\n//       1\\n//      / \\\\\\n//     2   3\\n//    / \\\\\\n//   4   5'
replacement = '// Create a simple binary tree\\n//       1\\n//      / \\\\\\\\\\n//     2   3\\n//    / \\\\\\\\\n//   4   5'

# Replace the pattern
fixed_content = content.replace(
    '// Create a simple binary tree\\n//       1\\n//      / \\\\\\n//     2   3\\n//    / \\\\\\n//   4   5',
    '// Create a simple binary tree\\n//       1\\n//      / \\\\\\\\\\n//     2   3\\n//    / \\\\\\\\\n//   4   5'
)

# Write the fixed content back to the file
with open('/Users/veland/GlassCodeAcademy/content/lessons/programming-fundamentals.json', 'w') as f:
    f.write(fixed_content)

print("JSON file fixed successfully!")