#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

set -o xtrace

./build.sh
# gnome-extensions reset focusli@armonge.info
gnome-extensions disable focusli@armonge.info
gnome-extensions uninstall focusli@armonge.info || true
gnome-extensions install --force focusli@armonge.info.shell-extension.zip
gnome-extensions enable focusli@armonge.info

busctl --user call org.gnome.Shell /org/gnome/Shell org.gnome.Shell Eval s 'Meta.restart("Restarting…")'

# sleep 10
# # gnome-extensions show focusli@armonge.info

# killall -SIGQUIT gnome-shell

# sleep 10
# gnome-extensions install --force focusli@armonge.info.shell-extension.zip
# gnome-extensions enable focusli@armonge.info

# gnome-extensions show focusli@armonge.info
