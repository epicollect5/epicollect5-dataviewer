#!/usr/bin/env bash
set -e  # stop if any command fails

# Adjust these paths as needed
DIST_DIR="dist"
# Replace the path below with your actual epicollect5-server location
PUBLIC_DIR="path/to/epicollect5-server/public/dataviewer"

JS_DEST="$PUBLIC_DIR/js"
CSS_DEST="$PUBLIC_DIR/css"

echo "Copying build files from $DIST_DIR to $PUBLIC_DIR..."

# Ensure destination folders exist
mkdir -p "$JS_DEST" "$CSS_DEST"

# Copy JS files
if ls "$DIST_DIR"/dataviewer.js* >/dev/null 2>&1; then
  echo "→ Copying JS files to epicollect5-server repo..."
  cp "$DIST_DIR"/*.js "$JS_DEST/"
fi

# Copy JS map files
if ls "$DIST_DIR"/*.js.map >/dev/null 2>&1; then
  echo "→ Copying JS map files to epicollect5-server repo..."
  cp "$DIST_DIR"/*.js.map "$JS_DEST/"
fi

# Copy CSS files
if ls "$DIST_DIR"/dataviewer.css >/dev/null 2>&1; then
  echo "→ Copying CSS files to epicollect5-server repo..."
  cp "$DIST_DIR"/dataviewer.css "$CSS_DEST/"
fi
