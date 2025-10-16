#!/usr/bin/env python3

import re
import os

# Get the script directory and navigate to the project root
script_dir = os.path.dirname(os.path.abspath(__file__))
dataservice_path = os.path.join(script_dir, "glasscode", "backend", "Services", "DataService.cs")

# Read the DataService.cs file
with open(dataservice_path, 'r') as f:
    content = f.read()

# Replace all incorrect paths with correct ones
content = content.replace('"..", "content/', '"..", "..", "content/')

# Write the updated content back
with open(dataservice_path, 'w') as f:
    f.write(content)

print("Updated all content paths to use correct ../../content/ relative path")