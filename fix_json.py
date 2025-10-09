# -*- coding: utf-8 -*-
import json
import sys
import io

def fix_json(file_path):
    try:
        with io.open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Try to parse the JSON
        data = json.loads(content)
        
        # Write back the properly formatted JSON
        with io.open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print("✅ Successfully fixed {}".format(file_path))
        return True
    except Exception as e:
        print("❌ Error fixing {}: {}".format(file_path, str(e)))
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python fix_json.py <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    success = fix_json(file_path)
    sys.exit(0 if success else 1)