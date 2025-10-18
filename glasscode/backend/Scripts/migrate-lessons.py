#!/usr/bin/env python3
"""
Lesson Migration Script
Migrates lessons from JSON files to the database via API endpoints.
"""

import json
import os
import requests
import sys
from typing import Dict, List, Any, Optional
from pathlib import Path

# Configuration
API_BASE_URL = "http://localhost:8080/api"
LESSONS_DIR = "/Users/veland/GlassCodeAcademy/glasscode/frontend/public/content/lessons"
DEFAULT_COURSE_ID = 1

class LessonMigrator:
    def __init__(self):
        self.modules_cache: Dict[str, int] = {}
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
    
    def log(self, message: str, level: str = "INFO"):
        """Log messages with timestamp"""
        print(f"[{level}] {message}")
    
    def get_existing_modules(self) -> Dict[str, int]:
        """Fetch existing modules and create a slug -> id mapping"""
        try:
            response = self.session.get(f"{API_BASE_URL}/modules")
            response.raise_for_status()
            modules = response.json()
            
            module_map = {}
            for module in modules:
                module_map[module['slug']] = module['id']
            
            self.log(f"Found {len(module_map)} existing modules")
            return module_map
        except Exception as e:
            self.log(f"Error fetching modules: {e}", "ERROR")
            return {}
    
    def create_module(self, module_slug: str, title: str) -> Optional[int]:
        """Create a new module and return its ID"""
        try:
            # Generate a title from slug if not provided
            if not title:
                title = module_slug.replace('-', ' ').title()
            
            module_data = {
                "title": title,
                "description": f"Module for {title}",
                "slug": module_slug,
                "order": len(self.modules_cache) + 1,
                "isPublished": True,
                "courseId": DEFAULT_COURSE_ID
            }
            
            response = self.session.post(f"{API_BASE_URL}/modules", json=module_data)
            response.raise_for_status()
            
            # The API might return the created module or just success
            try:
                result = response.json()
                module_id = result.get('id') if isinstance(result, dict) else None
            except:
                module_id = None
            
            # If we don't get the ID from response, fetch it
            if not module_id:
                updated_modules = self.get_existing_modules()
                module_id = updated_modules.get(module_slug)
            
            if module_id:
                self.modules_cache[module_slug] = module_id
                self.log(f"Created module '{module_slug}' with ID {module_id}")
                return module_id
            else:
                self.log(f"Failed to get ID for created module '{module_slug}'", "ERROR")
                return None
                
        except Exception as e:
            self.log(f"Error creating module '{module_slug}': {e}", "ERROR")
            return None
    
    def get_or_create_module(self, module_slug: str, title: str = "") -> Optional[int]:
        """Get existing module ID or create new module"""
        if module_slug in self.modules_cache:
            return self.modules_cache[module_slug]
        
        # Check if module exists
        existing_modules = self.get_existing_modules()
        if module_slug in existing_modules:
            module_id = existing_modules[module_slug]
            self.modules_cache[module_slug] = module_id
            return module_id
        
        # Create new module
        return self.create_module(module_slug, title)
    
    def transform_lesson_data(self, lesson: Dict[str, Any], module_id: int) -> Dict[str, Any]:
        """Transform lesson JSON data to match LessonCreateDto format"""
        
        # Create content JSON from lesson data
        content = {
            "intro": lesson.get("intro", ""),
            "code": lesson.get("code", {}),
            "pitfalls": lesson.get("pitfalls", []),
            "exercises": lesson.get("exercises", []),
            "next": lesson.get("next", [])
        }
        
        # Create metadata JSON
        metadata = {
            "objectives": lesson.get("objectives", []),
            "tags": lesson.get("tags", []),
            "lastUpdated": lesson.get("lastUpdated", ""),
            "version": lesson.get("version", "1.0.0"),
            "sources": lesson.get("sources", [])
        }
        
        # Map difficulty
        difficulty = lesson.get("difficulty", "Beginner")
        if difficulty not in ["Beginner", "Intermediate", "Advanced"]:
            difficulty = "Beginner"
        
        return {
            "title": lesson.get("title", "Untitled Lesson"),
            "slug": self.generate_slug(lesson.get("title", "untitled-lesson")),
            "order": lesson.get("order", 1),
            "content": json.dumps(content),
            "metadata": json.dumps(metadata),
            "isPublished": True,
            "difficulty": difficulty,
            "estimatedMinutes": lesson.get("estimatedMinutes", 30),
            "moduleId": module_id
        }
    
    def generate_slug(self, title: str) -> str:
        """Generate a URL-friendly slug from title"""
        import re
        slug = title.lower()
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)
        slug = re.sub(r'\s+', '-', slug)
        slug = slug.strip('-')
        return slug
    
    def create_lesson(self, lesson_data: Dict[str, Any]) -> bool:
        """Create a lesson via API"""
        try:
            response = self.session.post(f"{API_BASE_URL}/lessons-db", json=lesson_data)
            response.raise_for_status()
            
            self.log(f"Created lesson: {lesson_data['title']}")
            return True
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 500:
                try:
                    error_data = e.response.json()
                    if "duplicate key" in error_data.get("innerException", ""):
                        self.log(f"Lesson already exists: {lesson_data['title']}", "WARNING")
                        return True  # Consider this a success since lesson exists
                except:
                    pass
            
            self.log(f"Error creating lesson '{lesson_data['title']}': {e}", "ERROR")
            return False
        except Exception as e:
            self.log(f"Error creating lesson '{lesson_data['title']}': {e}", "ERROR")
            return False
    
    def load_lessons_from_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Load lessons from a JSON file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lessons = json.load(f)
            
            if not isinstance(lessons, list):
                self.log(f"Invalid format in {file_path}: expected array", "ERROR")
                return []
            
            self.log(f"Loaded {len(lessons)} lessons from {os.path.basename(file_path)}")
            return lessons
            
        except Exception as e:
            self.log(f"Error loading {file_path}: {e}", "ERROR")
            return []
    
    def migrate_lessons_from_file(self, file_path: str) -> tuple[int, int]:
        """Migrate all lessons from a single JSON file"""
        lessons = self.load_lessons_from_file(file_path)
        if not lessons:
            return 0, 0
        
        # Get module slug from first lesson
        module_slug = lessons[0].get("moduleSlug", "")
        if not module_slug:
            self.log(f"No moduleSlug found in {file_path}", "ERROR")
            return 0, len(lessons)
        
        # Get or create module
        module_title = module_slug.replace('-', ' ').title()
        module_id = self.get_or_create_module(module_slug, module_title)
        if not module_id:
            self.log(f"Failed to get/create module for {module_slug}", "ERROR")
            return 0, len(lessons)
        
        # Migrate lessons
        success_count = 0
        for lesson in lessons:
            lesson_data = self.transform_lesson_data(lesson, module_id)
            if self.create_lesson(lesson_data):
                success_count += 1
        
        return success_count, len(lessons)
    
    def migrate_all_lessons(self) -> None:
        """Migrate all lesson files"""
        lessons_dir = Path(LESSONS_DIR)
        if not lessons_dir.exists():
            self.log(f"Lessons directory not found: {LESSONS_DIR}", "ERROR")
            return
        
        # Find all JSON files
        json_files = list(lessons_dir.glob("*.json"))
        if not json_files:
            self.log("No lesson JSON files found", "ERROR")
            return
        
        self.log(f"Found {len(json_files)} lesson files to migrate")
        
        total_success = 0
        total_lessons = 0
        
        for json_file in json_files:
            self.log(f"\nMigrating {json_file.name}...")
            success, total = self.migrate_lessons_from_file(str(json_file))
            total_success += success
            total_lessons += total
            
            self.log(f"  {success}/{total} lessons migrated successfully")
        
        self.log(f"\nMigration complete: {total_success}/{total_lessons} lessons migrated successfully")
        
        if total_success < total_lessons:
            self.log(f"{total_lessons - total_success} lessons failed to migrate", "WARNING")

def main():
    """Main entry point"""
    migrator = LessonMigrator()
    
    print("Starting lesson migration...")
    print(f"API Base URL: {API_BASE_URL}")
    print(f"Lessons Directory: {LESSONS_DIR}")
    print("-" * 50)
    
    try:
        migrator.migrate_all_lessons()
    except KeyboardInterrupt:
        print("\nMigration interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()