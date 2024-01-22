#!/bin/sh

echo "Clean"

rm -r -f "./generated"

echo "Add ssh key"

ssh-keyscan gitlab.com >> ~/.ssh/known_hosts

echo "Create folder"

mkdir "./generated"
mkdir "./generated/java"
mkdir "./generated/javascript"
mkdir "./generated/typescript"

echo "Clone Repos"

git clone git@gitlab.com:mypvpme/userserver/api/clients/userserver-api-client-javascript.git ./generated/javascript
git clone git@gitlab.com:mypvpme/userserver/api/clients/userserver-api-client-browser.git ./generated/browser
git clone git@gitlab.com:mypvpme/userserver/api/clients/userserver-api-client-typescript.git ./generated/typescript
git clone git@gitlab.com:mypvpme/userserver/api/clients/userserver-api-client-java.git ./generated/java
