#!/usr/bin/env python3

import psycopg2
from psycopg2 import sql

try:
    # Connect to the database
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="glasscode_dev",
        user="postgres",
        password="postgres"
    )
    
    cur = conn.cursor()
    
    # Test connection
    print("Database connection: SUCCESS")
    
    # Check counts
    cur.execute("SELECT COUNT(*) FROM \"Modules\";")
    module_count = cur.fetchone()[0]
    print(f"Modules: {module_count}")
    
    cur.execute("SELECT COUNT(*) FROM \"Lessons\";")
    lesson_count = cur.fetchone()[0]
    print(f"Lessons: {lesson_count}")
    
    cur.execute("SELECT COUNT(*) FROM \"LessonQuizzes\";")
    quiz_count = cur.fetchone()[0]
    print(f"Quizzes: {quiz_count}")
    
    # Check for programming fundamentals modules
    cur.execute("SELECT \"Id\", \"Title\", \"Slug\" FROM \"Modules\" WHERE \"Slug\" LIKE '%programming%';")
    programming_modules = cur.fetchall()
    print(f"Programming modules found: {len(programming_modules)}")
    
    for module in programming_modules:
        print(f"  - {module[1]} (ID: {module[0]}, Slug: {module[2]})")
        
        # Get lessons for this module
        cur.execute("SELECT \"Id\", \"Title\" FROM \"Lessons\" WHERE \"ModuleId\" = %s;", (module[0],))
        module_lessons = cur.fetchall()
        print(f"    Lessons: {len(module_lessons)}")
        
        total_quizzes = 0
        for lesson in module_lessons:
            cur.execute("SELECT COUNT(*) FROM \"LessonQuizzes\" WHERE \"LessonId\" = %s;", (lesson[0],))
            lesson_quiz_count = cur.fetchone()[0]
            total_quizzes += lesson_quiz_count
            print(f"      - {lesson[1]}: {lesson_quiz_count} quizzes")
            
        print(f"    Total quizzes for {module[2]}: {total_quizzes}")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")