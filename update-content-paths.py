#!/usr/bin/env python3

import re

# Read the DataService.cs file
with open('/Users/veland/GlassCodeAcademy/glasscode/backend/Services/DataService.cs', 'r') as f:
    content = f.read()

# Replace all incorrect paths with correct ones
content = content.replace('"..", "content/', '"..", "..", "content/')

# Write the updated content back
with open('/Users/veland/GlassCodeAcademy/glasscode/backend/Services/DataService.cs', 'w') as f:
    f.write(content)

print("Updated all content paths to use correct ../../content/ relative path")