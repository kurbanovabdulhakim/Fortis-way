#!/usr/bin/env bash
# FortisWay - Multi-Device Skills Installer for macOS and Linux
# Copies all 4 web design & UI skills to your global user profile

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
SOURCE_SKILLS="$DIR/.agents/skills"

TARGET_DIRS=(
  "$HOME/.gemini/config/skills"
  "$HOME/.agents/skills"
  "$HOME/.claude/skills"
)

echo "======================================================"
echo " FORTISWAY: Installing 4 Web Design Skills for AI     "
echo "======================================================"

for target in "${TARGET_DIRS[@]}"; do
  mkdir -p "$target"
  for skill_dir in "$SOURCE_SKILLS"/*/; do
    if [ -d "$skill_dir" ]; then
      skill_name=$(basename "$skill_dir")
      dest="$target/$skill_name"
      mkdir -p "$dest"
      cp -r "$skill_dir"* "$dest/"
      echo " [OK] Installed '$skill_name' -> $dest"
    fi
  done
done

echo ""
echo "All 4 design skills successfully installed on this machine!"
echo "Available skills: frontend-design, frontend-ui-engineering, web-performance-optimization, ui-ux-pro-max"
