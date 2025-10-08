#!/usr/bin/env bash
set -euo pipefail

# Script to integrate loose lesson files into the proper content structure

echo "=== Integrating Loose Lesson Files ==="

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function to integrate a single lesson file
integrate_lesson() {
    local lesson_file=$1
    local module_name=$2
    
    if [ ! -f "$lesson_file" ]; then
        log "WARNING: Lesson file $lesson_file not found"
        return 1
    fi
    
    local target_file="/Users/veland/GlassCodeAcademy/content/lessons/${module_name}.json"
    if [ ! -f "$target_file" ]; then
        log "WARNING: Target file $target_file not found"
        return 1
    fi
    
    log "Integrating $lesson_file into $target_file"
    
    # Create a backup of the target file
    cp "$target_file" "${target_file}.backup.$(date +%s)"
    
    # Use jq to add the lesson to the array
    jq -s '.[0] + [.[1]]' "$target_file" "$lesson_file" > "${target_file}.tmp" && mv "${target_file}.tmp" "$target_file"
    
    # Remove the original loose file
    rm "$lesson_file"
    
    log "Successfully integrated $lesson_file"
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    log "ERROR: jq is required but not installed. Please install jq first."
    exit 1
fi

# Count loose files before integration
log "Found loose lesson files:"
log "  Laravel: $(ls /Users/veland/GlassCodeAcademy/laravel-lesson-*.json 2>/dev/null | wc -l) files"
log "  Node.js: $(ls /Users/veland/GlassCodeAcademy/node-lesson-*.json 2>/dev/null | wc -l) files"
log "  SASS: $(ls /Users/veland/GlassCodeAcademy/sass-lesson-*.json 2>/dev/null | wc -l) files"
log "  Tailwind: $(ls /Users/veland/GlassCodeAcademy/tailwind-lesson-*.json 2>/dev/null | wc -l) files"
log "  Vue: $(ls /Users/veland/GlassCodeAcademy/vue-lesson-*.json 2>/dev/null | wc -l) files"

# Integrate Laravel lessons
for file in /Users/veland/GlassCodeAcademy/laravel-lesson-*.json; do
    if [ -f "$file" ]; then
        integrate_lesson "$file" "laravel-fundamentals"
    fi
done

# Integrate Node.js lessons
for file in /Users/veland/GlassCodeAcademy/node-lesson-*.json; do
    if [ -f "$file" ]; then
        integrate_lesson "$file" "node-fundamentals"
    fi
done

# Integrate SASS lessons
for file in /Users/veland/GlassCodeAcademy/sass-lesson-*.json; do
    if [ -f "$file" ]; then
        integrate_lesson "$file" "sass-advanced"
    fi
done

# Integrate Tailwind lessons
for file in /Users/veland/GlassCodeAcademy/tailwind-lesson-*.json; do
    if [ -f "$file" ]; then
        integrate_lesson "$file" "tailwind-advanced"
    fi
done

# Integrate Vue lessons
for file in /Users/veland/GlassCodeAcademy/vue-lesson-*.json; do
    if [ -f "$file" ]; then
        integrate_lesson "$file" "vue-advanced"
    fi
done

log "=== Lesson integration complete! ==="
log "Backup files have been created with .backup.timestamp extensions"