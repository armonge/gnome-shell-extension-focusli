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
const GstPlayer = imports.gi.GstPlayer;
const Lang = imports.lang;
const Manager = Extension.imports.manager;
const Slider = imports.ui.slider;
const St = imports.gi.St;

const DEFAULT_VOLUME = 0.5;

const SoundBox = new Lang.Class({
    Name: 'SoundBox',
    Extends: St.BoxLayout,
    Properties: {
        'sensitive': GObject.ParamSpec.boolean('sensitive', 'Sensitive',
            'Whether the widget is sensitive',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, false),
    },

    set sensitive(s) {
        this._sensitive = s;

        this.opacity = s ? 255 : 100;
    },

    get sensitive() {
        return this._sensitive;
    },

    getUri: function (sound) {
        /* All URIs are relative to $HOME. */
        return Gst.filename_to_uri (sound.uri);
    },

    _init: function (sound) {
        this.parent ({
            style_class: 'soundbox flat',
            vertical: true,
        });

        let icon = new St.Icon({
            style_class: 'icon',
            icon_name: sound.icon,
            reactive: true,
        });
        this.add_child(icon);

        let slider = new Slider.Slider (DEFAULT_VOLUME);
        this.add_child (slider.actor);

        slider.connect('value-changed', this._onValueChanged.bind (this));

        this.player = new GstPlayer.Player();
        this.player.set_uri (this.getUri(sound));

        icon.connect('button-press-event', Lang.bind(this, function() {
            if (this.sensitive) {
                this.player.stop();
            } else {
                this.player.play();
            }

            this.sensitive = !this.sensitive;
        }));
    },

    _onValueChanged: function(slider, value, property) {
        this.player.set_volume(value);

        this.sensitive = (value > 0);
    },
});
