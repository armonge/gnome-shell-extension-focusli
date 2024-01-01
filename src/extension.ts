/* extension.ts
 *
 * Copyright (C) 2017 Felipe Borges <felipeborges@gnome.org>
 *               2024 Andrés Reyes Monge <armonge@gmail.com>
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

import {Extension, ExtensionMetadata} from 'resource:///org/gnome/shell/extensions/extension.js';

import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gst from 'gi://Gst';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Manager, TManager} from './manager.js';
import {SoundBox} from './sound.js';

class TPopup extends PopupMenu.PopupBaseMenuItem {
    manager: TManager;
    box: St.BoxLayout

    constructor(extension_dir: Gio.File) {
        super({
            reactive: false,
            can_focus: false,
        });

        this.box = new St.BoxLayout({
            vertical: true,
        });
        this.add_child(this.box);

        this.manager = new Manager();
        this.manager.connect("sounds-loaded", () => {
            this._onSoundsReady();
        });

        this.manager.loadSounds(extension_dir);
    }

    _onSoundsReady() {
        let sounds = this.manager.sounds;
        /* Add SoundBoxes two at the time */
        for (let idx = 0; idx < sounds.length; idx += 2) {
            let sound_box1 = new SoundBox(sounds[idx]);
            let line = new St.BoxLayout();
            line.add_child(sound_box1);

            if (sounds[idx + 1]) {
                let sound_box2 = new SoundBox(sounds[idx + 1]);
                line.add_child(sound_box2);
            }

            this.box.add_child(line);
        }
    }
}

const Popup = GObject.registerClass(TPopup);

class TButton extends PanelMenu.Button {
    constructor(extension_dir: Gio.File) {
        super(0.0, "Focusli");

        let box = new St.BoxLayout({
            style_class: "panel-status-menu-box",
        });

        let icon_path = GLib.build_filenamev([
            extension_dir.get_path()!,
            "icon.png",
        ]);
        let icon = new St.Icon({
            gicon: Gio.Icon.new_for_string(icon_path),
            style_class: "system-status-icon",
        });
        box.add_child(icon);
        this.add_child(box);

        let popup = new Popup(extension_dir);
        this.menu.addMenuItem(popup);
    }
}
const Button = GObject.registerClass(TButton);

export default class FocusliExtension extends Extension {
    _button?: TButton | null;
    constructor(metadata: ExtensionMetadata) {
        super(metadata);
        console.debug(`constructing ${metadata.name}`);
    }


    enable() {
        console.debug(`enabling ${this.metadata.name}`);

        const gstLoaded = Gst.init_check(null);
        if (!gstLoaded) {
            return console.error("Gst couldn't be loaded")
        }

        this._button = new Button(this.dir);
        Main.panel.addToStatusArea("focusli", this._button);
        console.debug(`enabled test ${this.metadata.name}`);
    }

    disable() {
        console.debug(`disabling ${this.metadata.name}`);
        this._button?.destroy();
        this._button = null
    }

}
