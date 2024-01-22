#!/bin/sh

getCurrentVersion() {
  cd "./generated/$1"
  echo $(git describe --abbrev=0 --tags)
  cd ..
  cd ..
}

NEW_JAVA_VERSION=$(semver -i "$(sh ./generation-utils/get-new-version-level.sh)" "$(getCurrentVersion "java")")

NEW_JAVASCRIPT_VERSION=$(semver -i "$(sh ./generation-utils/get-new-version-level.sh)" "$(getCurrentVersion "javascript")")

NEW_TYPESCRIPT_VERSION=$(semver -i "$(sh ./generation-utils/get-new-version-level.sh)" "$(getCurrentVersion "typescript")")

NEW_BROWSER_VERSION=$(semver -i "$(sh ./generation-utils/get-new-version-level.sh)" "$(getCurrentVersion "browser")")

echo "Release javascript client"

cd ./generated/javascript

echo "Commit"
git add .
git commit -m "Release $NEW_JAVASCRIPT_VERSION"

echo "Create tag"
git tag -a "$NEW_JAVASCRIPT_VERSION" -m "Release $NEW_JAVASCRIPT_VERSION"

echo "Push"
git push origin master --force --follow-tags

cd ../../

rm -r -f ./generated/javascript

echo "Release browser client"

cd ./generated/browser

echo "Commit"
git add .
git commit -m "Release $NEW_BROWSER_VERSION"

echo "Create tag"
git tag -a "$NEW_BROWSER_VERSION" -m "Release $NEW_BROWSER_VERSION"

echo "Push"
git push origin master --force --follow-tags

cd ../../

rm -r -f ./generated/browser

echo "Release typescript client"

cd ./generated/typescript

echo "Commit"
git add .
git commit -m "Release $NEW_TYPESCRIPT_VERSION"

echo "Create tag"
git tag -a "$NEW_TYPESCRIPT_VERSION" -m "Release $NEW_TYPESCRIPT_VERSION"

echo "Push"
git push origin master --force --follow-tags

cd ../../

rm -r -f ./generated/typescript

echo "Release java client"

cd ./generated/java

echo "Commit"
git add .
git commit -m "Release $NEW_JAVA_VERSION"

echo "Create tag"
git tag -a "$NEW_JAVA_VERSION" -m "Release $NEW_JAVA_VERSION"

echo "Push"
git push origin master --force --follow-tags

cd ../../

rm -r -f ./generated/java
