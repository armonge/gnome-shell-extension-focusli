/* extension.js
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

var Gst = imports.gi.Gst;

const GObject = imports.gi.GObject;
const Animation = imports.ui.animation;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const St = imports.gi.St;
const Main = imports.ui.main;
const Manager = Extension.imports.manager;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Sound = Extension.imports.sound;

Gst.init(null);

const Popup = GObject.registerClass(
  class Popup extends PopupMenu.PopupBaseMenuItem {
    _init() {
      super._init({
        reactive: false,
        can_focus: false
      });

      this.box = new St.BoxLayout({
        vertical: true
      });
      this.add(this.box);

      this.manager = new Manager.Manager();
      this.manager.connect("sounds-loaded", () => {
        this._onSoundsReady();
      });
    }

    _onSoundsReady() {
      let sounds = this.manager.sounds;
      /* Add SoundBoxes two at the time */
      for (let idx = 0; idx < sounds.length; idx += 2) {
        let sound_box1 = new Sound.SoundBox(sounds[idx]);
        let line = new St.BoxLayout();
        line.add_child(sound_box1);

        if (sounds[idx + 1]) {
          let sound_box2 = new Sound.SoundBox(sounds[idx + 1]);
          line.add_child(sound_box2);
        }

        this.box.add_child(line);
        log(line);
      }
    }
  }
);

const Button = GObject.registerClass(
  class Button extends PanelMenu.Button {
    _init() {
      super._init(0.0, "Focusli");

      let box = new St.BoxLayout({
        style_class: "panel-status-menu-box"
      });

      let icon_path = GLib.build_filenamev([
        Extension.dir.get_path(),
        "icon.png"
      ]);
      let gicon = Gio.Icon.new_for_string(icon_path);
      let icon = new St.Icon({
        gicon: gicon,
        style_class: "system-status-icon"
      });
      box.add_child(icon);
      this.add_child(box);

      let popup = new Popup();
      this.menu.addMenuItem(popup);
    }
  }
);

function init() {}

let button;

function enable() {
  button = new Button();
  Main.panel.addToStatusArea("focusli", button);
}

function disable() {
  button.destroy();
}
