import json
import re

# Read the JSON file
with open('/Users/veland/GlassCodeAcademy/content/lessons/programming-fundamentals.json', 'r') as f:
    content = f.read()

# Fix the backslashes in the tree diagram by properly escaping them
# Find the tree diagram section and fix it
pattern = r'// Create a simple binary tree\s*//\s*1\s*//\s*/ \\\s*//\s*2   3\s*//\s*/ \\\s*//\s*4   5'
replacement = '''// Create a simple binary tree
//       1
//      / \\\\
//     2   3
//    / \\\\
//   4   5'''

# Use regex to find and replace the pattern
fixed_content = re.sub(
    r'// Create a simple binary tree\\s*//\\s*1\\s*//\\s*/ \\\\\\s*//\\s*2   3\\s*//\\s*/ \\\\\\s*//\\s*4   5',
    replacement,
    content,
    flags=re.DOTALL
)

# Write the fixed content back to the file
with open('/Users/veland/GlassCodeAcademy/content/lessons/programming-fundamentals.json', 'w') as f:
    f.write(fixed_content)

print("JSON file fixed successfully!")