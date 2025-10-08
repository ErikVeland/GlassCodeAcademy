#!/usr/bin/env bash
echo "Test update script functionality"
DOTNET_SDK_VERSION=$(dotnet --list-sdks | head -1 | cut -d " " -f 1)
echo "Current .NET SDK version: $DOTNET_SDK_VERSION"
echo "{
  \"sdk\": {
    \"version\": \"$DOTNET_SDK_VERSION\",
    \"rollForward\": \"latestFeature\"
  }
}" > global.json
echo "global.json updated with version: $DOTNET_SDK_VERSION"
