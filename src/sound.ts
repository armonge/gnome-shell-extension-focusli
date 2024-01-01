/* sound.ts
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

import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gst from 'gi://Gst';
import GstAudio from 'gi://GstAudio';
import St from 'gi://St';
import * as Slider from 'resource:///org/gnome/shell/ui/slider.js';
import {Sound} from "./manager.js";

const DEFAULT_VOLUME = 0.5;

export class TSoundBox extends St.BoxLayout {
    _sensitive: boolean = false
    _slider: Slider.Slider
    _player: SoundPlayer

    set sensitive(s) {
        this._sensitive = s;

        this.opacity = s ? 255 : 100;
    }

    get sensitive() {
        return this._sensitive;
    }

    constructor(sound: Sound) {
        super({
            style_class: "soundbox flat",
            vertical: true,
        });

        this._slider = new Slider.Slider(DEFAULT_VOLUME);
        this._player = new SoundPlayer(sound);

        let icon = new St.Icon({
            style_class: "icon",
            gicon: Gio.icon_new_for_string(sound.icon),
            reactive: true,
        });

        this.add_child(icon);
        this.add_child(this._slider);

        this._slider.connect("notify::value", this._onSliderChanged.bind(this));
        icon.connect("button-press-event", this._onButtonPress.bind(this));
    }

    _onButtonPress() {
        if (this.sensitive) {
            this._player.pause();
        } else {
            this._player.play();
        }

        this.sensitive = !this.sensitive;
    }

    _onSliderChanged() {
        const value = this._slider.value;
        this._player.setVolume(value);
        this.sensitive = value > 0;
    }
}

export const SoundBox = GObject.registerClass(
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
    TSoundBox
);

class SoundPlayer {
    _prerolled = false
    _playbin: Gst.Pipeline
    _sink: GstAudio.AudioBaseSink
    _sound: Sound

    get soundURI() {
        /* All URIs are relative to $HOME. */
        return Gst.filename_to_uri(this._sound.uri);
    }

    constructor(sound: Sound) {
        this._sound = sound
        this._playbin = Gst.ElementFactory.make("playbin", sound.name) as Gst.Pipeline;
        this._sink = Gst.ElementFactory.make("pulsesink", "sink") as GstAudio.AudioBaseSink;

        this._playbin.set_property("uri", this.soundURI);
        this._playbin.set_property("audio-sink", this._sink);

        let bus = this._playbin.get_bus();
        bus.add_signal_watch();
        bus.connect("message", (_bus, msg) => {
            if (msg != null) this._onMessageReceived(msg);
        });
    }

    play() {
        this._playbin.set_state(Gst.State.PLAYING);
    }

    pause() {
        this._playbin.set_state(Gst.State.PAUSED);
        this._prerolled = false;
    }

    setVolume(value: number) {
        (this._playbin as any).set_volume(GstAudio.StreamVolumeFormat.LINEAR, value);

        let [_rv, state, _pstate] = this._playbin.get_state(Gst.State.NULL);
        if (value == 0) {
            this._playbin.set_state(Gst.State.NULL);
        } else if (state != Gst.State.PLAYING) {
            this._playbin.set_state(Gst.State.PLAYING);
        }
    }

    _onMessageReceived(message: Gst.Message) {
        if (message.type == Gst.MessageType.SEGMENT_DONE) {
            this._playbin.seek_simple(Gst.Format.TIME, Gst.SeekFlags.SEGMENT, 0);
        }
        if (message.type == Gst.MessageType.ASYNC_DONE) {
            if (!this._prerolled) {
                this._playbin.seek_simple(
                    Gst.Format.TIME,
                    Gst.SeekFlags.FLUSH | Gst.SeekFlags.SEGMENT,
                    0
                );
                this._prerolled = true;
            }
        }

        return true;
    }
};
