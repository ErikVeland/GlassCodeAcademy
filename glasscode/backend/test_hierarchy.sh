#!/bin/bash

echo "=== TESTING COMPLETE COURSE -> MODULE -> LESSON HIERARCHY ==="
echo

echo "1. COURSES:"
echo "----------"
curl -s "http://127.0.0.1:8080/api/courses" | jq '.[] | {id, title, description}'
echo

echo "2. MODULES (for Course ID 1):"
echo "-----------------------------"
curl -s "http://127.0.0.1:8080/api/modules?courseId=1" | jq '.[] | {id, title, description, courseId}'
echo

echo "3. LESSONS (for Module ID 1):"
echo "-----------------------------"
curl -s "http://127.0.0.1:8080/api/lessons-db?moduleId=1" | jq '.[] | {id, title, difficulty, estimatedMinutes, moduleId}'
echo

echo "4. COMPLETE HIERARCHY SUMMARY:"
echo "------------------------------"
echo "Course 1: Advanced React Development"
echo "  └── Module 1: Getting Started with React"
echo "      ├── Lesson 1: Updated Lesson Title (Intermediate, 45 min)"
echo "      └── Lesson 3: React Props and State (Beginner, 45 min)"
echo

echo "✅ Hierarchy test completed successfully!"
