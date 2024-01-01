#!/bin/bash -e
npx tsc
UUID="$(jq -r .uuid src/metadata.json)"
ZIP_FILENAME="${UUID}.zip"
cp -r src/metadata.json src/icon.png src/sounds src/stylesheet.css ./dist

(
    cd dist
    zip -r "../${ZIP_FILENAME}" .
)

cat <<EOF
    Build complete. Zip file: ${ZIP_FILENAME}
    Install with: gnome-extensions install ${ZIP_FILENAME}
    Update with: gnome-extensions install --force ${ZIP_FILENAME}
    Enable with: gnome-extensions enable ${UUID}

    Disable with: gnome-extensions disable ${UUID}
    Remove with: gnome-extensions uninstall ${UUID}

    To check if the extension has been recognized, you can execute the following: gnome-extensions list.
    If ${UUID} is listed in the output, you should be able to activate the extension.
    Otherwise, you will need to restart the GNOME Shell.
EOF
