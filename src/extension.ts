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

import '@girs/gjs'; // For global types like `log()`

import {Extension, ExtensionMetadata, gettext as _} from '@girs/gnome-shell/extensions/extension';

import Gio from '@girs/gio-2.0';
import GLib from '@girs/glib-2.0';
import GObject from '@girs/gobject-2.0';
import Gst from '@girs/gst-1.0';
import St from '@girs/st-13';
import * as Main from '@girs/gnome-shell/ui/main';
import {Button as PanelMenuButton} from '@girs/gnome-shell/ui/panelMenu';
import {PopupBaseMenuItem} from '@girs/gnome-shell/ui/popupMenu';
import {Manager, TManager} from './manager';
import {SoundBox} from './sound';

Gst.init(null);

class TPopup extends PopupBaseMenuItem {
    manager: TManager;
    box: St.BoxLayout

    constructor() {
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

        this.manager.loadSounds();
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

class TButton extends PanelMenuButton {
    constructor() {
        super(0.0, "Focusli");

        const extension = Extension.lookupByUUID('focusli@armonge.info');

        let box = new St.BoxLayout({
            style_class: "panel-status-menu-box",
        });

        let icon_path = GLib.build_filenamev([
            extension.dir.get_path(),
            "icon.png",
        ]);
        let gicon = Gio.Icon.new_for_string(icon_path);
        let icon = new St.Icon({
            gicon: gicon,
            style_class: "system-status-icon",
        });
        box.add_child(icon);
        this.add_child(box);

        let popup = new Popup();
        this.menu.addMenuItem(popup);
    }
}
const Button = GObject.registerClass(TButton);

export default class FocusliExtension extends Extension {
    button: TButton;
    constructor(metadata: ExtensionMetadata) {
        super(metadata);
        console.debug(`constructing ${this.metadata.name}`);
    }


    enable() {
        console.debug(`enabling ${this.metadata.name}`);
        this.button = new Button();
        Main.panel.addToStatusArea("focusli", this.button);
        console.debug(`enabled test ${this.metadata.name}`);
    }

    disable() {
        console.debug(`disabling ${this.metadata.name}`);
        this.button.destroy();
    }

}
