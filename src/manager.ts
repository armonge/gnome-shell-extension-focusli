/* manager.ts
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

import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio'

export interface Sound {
    name: string;
    uri: string;
    icon: string;
}

export class TManager extends GObject.Object {
    sounds: Sound[] = []
    loadSounds(dir: Gio.File) {
        const SOUNDS_BASE_PATH = dir.get_child("sounds").get_path();
        const DB_PATH = GLib.build_filenamev([SOUNDS_BASE_PATH!, "database.json"]);

        const decoder = new TextDecoder();
        const contents = decoder.decode(GLib.file_get_contents(DB_PATH)[1])
        this.sounds = JSON.parse(contents)["sounds"];
        this.emit("sounds-loaded");
    }
}

export const Manager = GObject.registerClass(
    {
        Signals: {
            "sounds-loaded": {},
        },
    },
    TManager
);
