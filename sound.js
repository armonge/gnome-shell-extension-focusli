/* sound.js
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
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gst = imports.gi.Gst;
const St = imports.gi.St;

const Me = imports.misc.extensionUtils.getCurrentExtension();

const DEFAULT_VOLUME = 0.5;

var SoundBox = GObject.registerClass(
  {
    Properties: {
      sensitive: GObject.ParamSpec.boolean(
        "sensitive",
        "Sensitive",
        "Whether the widget is sensitive",
        GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
        false
      ),
    },
  },
  class SoundBox extends St.BoxLayout {
    set sensitive(s) {
      this._sensitive = s;

      this.opacity = s ? 255 : 100;
    }

    get sensitive() {
      return this._sensitive;
    }

    _init(sound) {
      super._init({
        style_class: "soundbox flat",
        vertical: true,
      });

      let gicon = Gio.icon_new_for_string(sound.icon);
      // let icon = new St.Icon({ gicon });

      let icon = new St.Icon({
        style_class: "icon",
        // icon_name: sound.icon,
        gicon,
        reactive: true,
      });
      this.add_child(icon);

      this.player = new SoundPlayer(sound);

      icon.connect("button-press-event", () => {
        if (this.sensitive) {
          this.player.pause();
        } else {
          this.player.play();
        }

        this.sensitive = !this.sensitive;
      });
    }
  }
);

const SoundPlayer = class SoundPlayer {
  constructor(sound) {
    this.sound = sound;
  }

  play() {
    this.cancellable = Gio.Cancellable.new();
    this.player = global.display.get_sound_player();
    this.soundFile = Gio.File.new_for_path(this.sound.uri);
    this.player.play_from_file(
      this.soundFile,
      this.sound.name,
      this.cancellable
    );
  }

  pause() {
    this.cancellable.cancel();
  }
};
