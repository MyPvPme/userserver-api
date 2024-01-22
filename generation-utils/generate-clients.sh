#!/bin/bash
getCurrentVersion() {
  cd "./generated/$1"
  echo "$(git describe --abbrev=0 --tags)"
  cd ..
  cd ..
}
# JAVA
NEW_JAVA_VERSION=$(semver -i "$(sh ./generation-utils/get-new-version-level.sh)" "$(getCurrentVersion "java")")
echo "New java client version $NEW_JAVA_VERSION"
openapi-generator-cli generate -i swagger-spec.json -o ./generated/java --artifact-version "$NEW_JAVA_VERSION" -c "./generation-utils/config/java.json" --remove-operation-id-prefix -g java -t "./generation-utils/templates/java"

NEW_JAVASCRIPT_VERSION=$(semver -i "$(sh ./generation-utils/get-new-version-level.sh)" "$(getCurrentVersion "javascript")")
echo "New javascript client version $NEW_JAVASCRIPT_VERSION"
openapi-generator-cli generate -i swagger-spec.json -o ./generated/javascript --artifact-version "$NEW_JAVASCRIPT_VERSION" -c "./generation-utils/config/javascript.json" --remove-operation-id-prefix -g javascript

NEW_TYPESCRIPT_VERSION=$(semver -i "$(sh ./generation-utils/get-new-version-level.sh)" "$(getCurrentVersion "typescript")")
echo "New typescript client version $NEW_TYPESCRIPT_VERSION"
openapi-generator-cli generate -i swagger-spec.json -o ./generated/typescript --artifact-version "$NEW_TYPESCRIPT_VERSION" -c "./generation-utils/config/typescript.json" --remove-operation-id-prefix -g typescript -t "./generation-utils/templates/typescript"

NEW_BROWSER_VERSION=$(semver -i "$(sh ./generation-utils/get-new-version-level.sh)" "$(getCurrentVersion "browser")")
echo "New browser client version $NEW_BROWSER_VERSION"
openapi-generator-cli generate -i swagger-spec.json -o ./generated/browser --artifact-version "$NEW_BROWSER_VERSION" -c "./generation-utils/config/browser.json" --remove-operation-id-prefix -g typescript -t "./generation-utils/templates/typescript"
