import {build} from "esbuild";
import {cp} from "fs/promises";
import {resolve, dirname} from "path";
import {fileURLToPath} from 'url';
import AdmZip from "adm-zip";
import metadata from "./src/metadata.json" assert {type: 'json'};

const __dirname = dirname(fileURLToPath(import.meta.url));

console.debug(`Building ${metadata.name} v${metadata.version}...`);

build({
    entryPoints: ['src/extension.ts'],
    outdir: 'dist',
    bundle: true,
    // Do not remove the functions `enable()`, `disable()` and `init()`
    treeShaking: false,
    // firefox60  // Since GJS 1.53.90
    // firefox68  // Since GJS 1.63.90
    // firefox78  // Since GJS 1.65.90
    // firefox91  // Since GJS 1.71.1
    // firefox102 // Since GJS 1.73.2
    target: "firefox78",
    platform: "neutral",
    // platform: "node",
    // mainFields: ['main'],
    // conditions: ['require', 'default'],
    format: 'esm',
    external: ['gi://*', 'resource://*', 'system', 'gettext', 'cairo'],
}).then(async () => {
    const soundsSrc = resolve(__dirname, "src/sounds");
    const soundsDist = resolve(__dirname, "dist/sounds");

    const metaSrc = resolve(__dirname, "src/metadata.json");
    const metaDist = resolve(__dirname, "dist/metadata.json");

    const styleSrc = resolve(__dirname, "src/stylesheet.css");
    const styleDist = resolve(__dirname, "dist/stylesheet.css");

    const iconSrc = resolve(__dirname, "src/icon.png");
    const iconDist = resolve(__dirname, "dist/icon.png");

    const zipFilename = `${metadata.uuid}.zip`;
    const zipDist = resolve(__dirname, zipFilename);
    await cp(metaSrc, metaDist);
    await cp(iconSrc, iconDist);
    await cp(styleSrc, styleDist);

    console.log("BEFORE", {soundsSrc, soundsDist})
    await cp(soundsSrc, soundsDist, {recursive: true});
    console.log("HERE")

    const zip = new AdmZip();
    zip.addLocalFolder(resolve(__dirname, "dist"));
    zip.writeZip(zipDist);

    console.log(`Build complete. Zip file: ${zipFilename}\n`);
    console.log(`Install with: gnome-extensions install ${zipFilename}`)
    console.log(`Update with: gnome-extensions install --force ${zipFilename}`)
    console.log(`Enable with: gnome-extensions enable ${metadata.uuid}`)
    console.log('');
    console.log(`Disable with: gnome-extensions disable ${metadata.uuid}`)
    console.log(`Remove with: gnome-extensions uninstall ${metadata.uuid}`)
    console.log('');
    console.log('To check if the extension has been recognized, you can execute the following: gnome-extensions list.')
    console.log(`If ${metadata.uuid} is listed in the output, you should be able to activate the extension.`);
    console.log('Otherwise, you will need to restart the GNOME Shell.');
});
