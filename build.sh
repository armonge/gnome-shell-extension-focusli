#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
set -o xtrace

gnome-extensions pack --force --extra-source=icon.png --extra-source=manager.js --extra-source=sound.js --extra-source=sounds/
