#!/bin/bash
NEW_VERSION=$(git describe --abbrev=0 --tags)
LAST_VERSION=$(git describe --abbrev=0 --tags $(git rev-list --tags --skip=1 --max-count=1))

VERSION_CHANGE=$(node -pe "const version = '$LAST_VERSION'.split('.'); const newVersion = '$NEW_VERSION'.split('.'); newVersion[0] != version[0] ? 'major' : newVersion[1] != version[1] ? 'minor' : 'patch'")

echo $VERSION_CHANGE
