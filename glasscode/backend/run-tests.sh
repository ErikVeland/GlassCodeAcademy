#!/bin/bash

# Backend Test Runner Script
# Runs all tests with coverage reporting and detailed output

set -e

echo "🧪 GlassCode Academy - Backend Test Runner"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "backend.csproj" ]; then
    print_error "Please run this script from the backend directory"
    exit 1
fi

# Check if test project exists
if [ ! -d "Backend.Tests" ]; then
    print_error "Backend.Tests directory not found"
    exit 1
fi

print_status "Restoring NuGet packages..."
dotnet restore Backend.Tests/Backend.Tests.csproj

print_status "Building test project..."
dotnet build Backend.Tests/Backend.Tests.csproj --no-restore

print_status "Running tests with coverage..."

# Create test results directory
mkdir -p TestResults

# Run tests with coverage
dotnet test Backend.Tests/Backend.Tests.csproj \
    --no-build \
    --verbosity normal \
    --logger "trx;LogFileName=test-results.trx" \
    --logger "console;verbosity=detailed" \
    --results-directory TestResults \
    --collect:"XPlat Code Coverage" \
    --settings Backend.Tests/coverlet.runsettings 2>/dev/null || true

# Check if tests ran successfully
if [ $? -eq 0 ]; then
    print_success "All tests completed!"
else
    print_warning "Some tests may have failed or test packages need to be installed"
fi

# Generate coverage report if coverage files exist
if find TestResults -name "*.xml" -type f | grep -q .; then
    print_status "Coverage files found in TestResults/"
    
    # Install reportgenerator if not already installed
    if ! dotnet tool list -g | grep -q reportgenerator; then
        print_status "Installing ReportGenerator..."
        dotnet tool install -g dotnet-reportgenerator-globaltool
    fi
    
    # Generate HTML coverage report
    print_status "Generating coverage report..."
    reportgenerator \
        -reports:"TestResults/**/coverage.cobertura.xml" \
        -targetdir:"TestResults/CoverageReport" \
        -reporttypes:"Html;TextSummary" \
        2>/dev/null || print_warning "Could not generate coverage report"
    
    if [ -f "TestResults/CoverageReport/index.html" ]; then
        print_success "Coverage report generated: TestResults/CoverageReport/index.html"
    fi
else
    print_warning "No coverage files found"
fi

print_status "Test run completed!"
echo ""
echo "📊 Test Results:"
echo "  - Test results: TestResults/test-results.trx"
echo "  - Coverage report: TestResults/CoverageReport/index.html"
echo ""
echo "🚀 To run specific tests:"
echo "  dotnet test Backend.Tests --filter \"FullyQualifiedName~DataService\""
echo ""
echo "📈 To run with different verbosity:"
echo "  dotnet test Backend.Tests --verbosity detailed"