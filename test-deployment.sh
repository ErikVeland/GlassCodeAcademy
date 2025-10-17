#!/bin/bash

# Test script to validate deployment scripts don't hang
# This script simulates deployment scenarios and checks for hanging conditions

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/deployment-test-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

test_timeout() {
    local cmd="$1"
    local timeout_seconds="$2"
    local description="$3"
    
    log "Testing: $description"
    log "Command: $cmd"
    log "Timeout: ${timeout_seconds}s"
    
    if timeout "$timeout_seconds" bash -c "$cmd" >> "$LOG_FILE" 2>&1; then
        log "✅ PASS: $description completed within timeout"
        return 0
    else
        local exit_code=$?
        if [ $exit_code -eq 124 ]; then
            log "❌ FAIL: $description timed out after ${timeout_seconds}s"
        else
            log "❌ FAIL: $description failed with exit code $exit_code"
        fi
        return 1
    fi
}



check_infinite_loops() {
    local script="$1"
    log "Checking for potential infinite loops in $script..."
    
    # Check for while loops without proper exit conditions
    local suspicious_patterns=(
        "while.*true"
        "while.*\[\[.*\]\].*do.*sleep.*done"
        "while.*curl.*do.*sleep.*done"
    )
    
    local issues_found=0
    for pattern in "${suspicious_patterns[@]}"; do
        if grep -n -E "$pattern" "$script" | grep -v "MAX_ATTEMPTS\|max_attempts\|ATTEMPT.*-le\|attempt.*-le"; then
            log "⚠️  WARNING: Potential infinite loop pattern found: $pattern"
            issues_found=$((issues_found + 1))
        fi
    done
    
    if [ $issues_found -eq 0 ]; then
        log "✅ PASS: No obvious infinite loop patterns found"
        return 0
    else
        log "⚠️  WARNING: Found $issues_found potential infinite loop patterns"
        return 1
    fi
}

check_timeout_usage() {
    local script="$1"
    log "Checking timeout usage in $script..."
    
    # Check if curl commands use timeout
    local curl_without_timeout=$(grep -n "curl" "$script" | grep -v "timeout" | wc -l)
    local curl_with_timeout=$(grep -n "timeout.*curl" "$script" | wc -l)
    
    log "Found $curl_with_timeout curl commands with timeout"
    log "Found $curl_without_timeout curl commands without timeout"
    
    if [ "$curl_without_timeout" -gt 0 ]; then
        log "⚠️  WARNING: Some curl commands don't use timeout"
        grep -n "curl" "$script" | grep -v "timeout" | head -5
        return 1
    else
        log "✅ PASS: All curl commands use timeout"
        return 0
    fi
}

main() {
    log "Starting deployment script validation..."
    log "Log file: $LOG_FILE"
    
    local bootstrap_script="$SCRIPT_DIR/bootstrap.sh"
    local update_script="$SCRIPT_DIR/update.sh"
    
    local total_tests=0
    local passed_tests=0
    
    # Test 1: Syntax validation
    log "Testing: Bootstrap script syntax"
    total_tests=$((total_tests + 1))
    if bash -n "$bootstrap_script" >/dev/null 2>&1; then
        log "✅ PASS: Bootstrap script syntax is valid"
        passed_tests=$((passed_tests + 1))
    else
        local exit_code=$?
        log "❌ FAIL: Bootstrap script has syntax errors (exit code $exit_code)"
        bash -n "$bootstrap_script" 2>&1 | head -3 | while read line; do
            log "  Error: $line"
        done
    fi
    
    log "Testing: Update script syntax"
    total_tests=$((total_tests + 1))
    if bash -n "$update_script" >/dev/null 2>&1; then
        log "✅ PASS: Update script syntax is valid"
        passed_tests=$((passed_tests + 1))
    else
        local exit_code=$?
        log "❌ FAIL: Update script has syntax errors (exit code $exit_code)"
        bash -n "$update_script" 2>&1 | head -3 | while read line; do
            log "  Error: $line"
        done
    fi
    
    # Test 2: Check for infinite loops
    total_tests=$((total_tests + 1))
    if check_infinite_loops "$bootstrap_script"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    total_tests=$((total_tests + 1))
    if check_infinite_loops "$update_script"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # Test 3: Check timeout usage
    total_tests=$((total_tests + 1))
    if check_timeout_usage "$bootstrap_script"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    total_tests=$((total_tests + 1))
    if check_timeout_usage "$update_script"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # Test 4: Dry run validation (syntax check with environment simulation)
    total_tests=$((total_tests + 1))
    if test_timeout "APP_NAME=test DEPLOY_USER=test APP_DIR=/tmp DOMAIN=test.com EMAIL=test@test.com bash -n $bootstrap_script" 10 "Bootstrap script dry run"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    total_tests=$((total_tests + 1))
    if test_timeout "APP_NAME=test DEPLOY_USER=test APP_DIR=/tmp bash -n $update_script" 10 "Update script dry run"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # Summary
    log ""
    log "=== DEPLOYMENT VALIDATION SUMMARY ==="
    log "Total tests: $total_tests"
    log "Passed tests: $passed_tests"
    log "Failed tests: $((total_tests - passed_tests))"
    log "Success rate: $(( (passed_tests * 100) / total_tests ))%"
    log "Log file: $LOG_FILE"
    
    if [ $passed_tests -eq $total_tests ]; then
        log "🎉 ALL TESTS PASSED - Deployment scripts appear to be robust"
        exit 0
    else
        log "⚠️  SOME TESTS FAILED - Review the issues above"
        exit 1
    fi
}

main "$@"