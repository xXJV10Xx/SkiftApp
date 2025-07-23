#!/bin/bash

# 🚀 Skiftappen Deployment Script
# This script builds and deploys the app to App Store and Google Play Store

set -e

echo "🚀 Starting Skiftappen deployment..."

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

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    print_error "EAS CLI is not installed. Please install it first:"
    echo "npm install -g @expo/eas-cli"
    exit 1
fi

# Check if logged in to Expo
if ! eas whoami &> /dev/null; then
    print_error "Not logged in to Expo. Please login first:"
    echo "eas login"
    exit 1
fi

# Function to build for platform
build_for_platform() {
    local platform=$1
    local profile=$2
    
    print_status "Building for $platform with profile: $profile"
    
    if eas build --platform $platform --profile $profile --non-interactive; then
        print_success "Build completed for $platform"
    else
        print_error "Build failed for $platform"
        exit 1
    fi
}

# Function to submit to store
submit_to_store() {
    local platform=$1
    
    print_status "Submitting to $platform store..."
    
    if eas submit --platform $platform --latest; then
        print_success "Successfully submitted to $platform store"
    else
        print_error "Failed to submit to $platform store"
        exit 1
    fi
}

# Main deployment process
main() {
    print_status "Starting deployment process..."
    
    # 1. Build for Android (Production)
    print_status "Step 1: Building for Android..."
    build_for_platform "android" "production"
    
    # 2. Build for iOS (Production)
    print_status "Step 2: Building for iOS..."
    build_for_platform "ios" "production"
    
    # 3. Submit to Google Play Store
    print_status "Step 3: Submitting to Google Play Store..."
    submit_to_store "android"
    
    # 4. Submit to App Store
    print_status "Step 4: Submitting to App Store..."
    submit_to_store "ios"
    
    print_success "🎉 Deployment completed successfully!"
    print_status "Your app is now being processed by the stores."
    print_status "Check your store dashboards for status updates."
}

# Function to build only (without submitting)
build_only() {
    print_status "Building for both platforms (no submission)..."
    
    build_for_platform "android" "production"
    build_for_platform "ios" "production"
    
    print_success "✅ Builds completed successfully!"
    print_status "You can now manually submit the builds to the stores."
}

# Function to build for testing
build_test() {
    print_status "Building test versions..."
    
    build_for_platform "android" "preview"
    build_for_platform "ios" "preview"
    
    print_success "✅ Test builds completed!"
}

# Parse command line arguments
case "${1:-}" in
    "build-only")
        build_only
        ;;
    "test")
        build_test
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  (no option)  - Full deployment (build + submit)"
        echo "  build-only   - Build only (no submission)"
        echo "  test         - Build test versions"
        echo "  help         - Show this help message"
        ;;
    *)
        main
        ;;
esac 