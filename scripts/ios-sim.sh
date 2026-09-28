#!/bin/sh
# Build the web app, sync it into iOS and launch it on a simulator (booted one, else first iPhone).
# Prints only errors and one final line, so agents get short output. Full log: ios/App/build-sim/last.log
set -e
cd "$(dirname "$0")/.."
DD=ios/App/build-sim
LOG=$DD/last.log
mkdir -p "$DD"

UDID=${SIM_UDID:-$(xcrun simctl list devices booted | grep -m1 -E '^ +iPhone' | grep -oE '[0-9A-F-]{36}' || true)}
if [ -z "$UDID" ]; then
  UDID=$(xcrun simctl list devices available | grep -m1 -E '^ +iPhone' | grep -oE '[0-9A-F-]{36}')
  xcrun simctl boot "$UDID"
fi
NAME=$(xcrun simctl list devices | grep "$UDID" | sed -E 's/^ +//; s/ \(.*//')

npm run -s build:ios >"$LOG" 2>&1 || { tail -30 "$LOG"; exit 1; }
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -destination "id=$UDID" -derivedDataPath "$DD" build >>"$LOG" 2>&1 ||
  { grep -E "error:|BUILD FAILED" "$LOG" | head -20; exit 1; }
xcrun simctl install "$UDID" "$DD/Build/Products/Debug-iphonesimulator/App.app"
xcrun simctl launch --terminate-running-process "$UDID" dev.dnegi.workingtime >/dev/null
echo "Running on $NAME ($UDID)"
