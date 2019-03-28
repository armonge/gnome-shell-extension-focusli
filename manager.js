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

const SOUNDS_BASE_PATH = Extension.dir.get_child("sounds").get_path();
const DB_PATH = GLib.build_filenamev([SOUNDS_BASE_PATH, "database.json"]);

var Manager = GObject.registerClass(
  {
    Signals: {
      "sounds-loaded": {}
    }
  },
  class Manager extends GObject.Object {
    _init() {
      super._init();

      this.loadSounds();
    }

    loadSounds() {
      let file = Gio.File.new_for_path(DB_PATH);
      file.load_contents_async(null, (file, res) => {
        let contents;
        try {
          contents = file.load_contents_finish(res)[1].toString();
          this.sounds = JSON.parse(contents)["sounds"];

          this.emit("sounds-loaded");
        } catch (e) {
          log(e);
        }
      });
    }
  }
);
