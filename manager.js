/* manager.js
 *
 * Copyright (C) 2017 Felipe Borges <felipeborges@gnome.org>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Lang = imports.lang;

const SOUNDS_BASE_PATH = Extension.dir.get_child('sounds').get_path();
const DB_PATH = GLib.build_filenamev([SOUNDS_BASE_PATH, "database.json"]);

const Manager = new Lang.Class({
    Name: 'Manager',
    Extends: GObject.Object,
    Signals: {
        'sounds-loaded': {},
    },

    _init: function() {
        this.parent();

        this.loadSounds();
    },

    loadSounds: function() {
        let file = Gio.File.new_for_path(DB_PATH);
        file.load_contents_async(null, (file, res) => {
            let contents;
            try {
                contents = file.load_contents_finish(res)[1].toString();
                this.sounds = JSON.parse(contents)['sounds'];
                this.sounds.forEach(Lang.bind(this, function(sound) {
                    if (!this.soundExists(sound)) {
                        this._downloadSound(sound);
                    }
                }));

                this.emit('sounds-loaded');
            } catch (e) {
                log(e);
            }
        });
    },

    _downloadSound: function(sound) {
        let stream = Gio.File.new_for_uri(sound.uri);
        stream.read_async(GLib.PRIORITY_DEFAULT, null, function(src,res) {
            let inputStream;
            try {
                inputStream = stream.read_finish(res);
            } catch(e) {
                return;
            }

            let destination = GLib.build_filenamev([SOUNDS_BASE_PATH, sound.name + ".mp3"]);
            let out = Gio.File.new_for_path(destination);
            out.replace_async(null, false, Gio.FileCreateFlags.NONE, GLib.PRIORITY_DEFAULT, null,
            Lang.bind(this, function(src, res) {
                let outputStream = out.replace_finish(res);

                outputStream.splice_async(inputStream,
                    Gio.OutputStreamSpliceFlags.CLOSE_SOURCE | Gio.OutputStreamSpliceFlags.CLOSE_TARGET,
                    GLib.PRIORITY_DEFAULT, null, Lang.bind(this, function(src, res) {
                        try {
                            outputStream.splice_finish(res);
                        } catch (e) {
                            return;
                        }
                    }));
            }));
        });
    },

    soundExists: function(sound) {
        let path = GLib.build_filenamev([SOUNDS_BASE_PATH, sound.name + ".mp3"]);
        let file = Gio.File.new_for_path(path);

        return file.query_exists(null);
    }
})
