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

import Gio from '@girs/gio-2.0';
import GObject from '@girs/gobject-2.0';
import Gst from '@girs/gst-1.0';
import GstAudio from '@girs/gstaudio-1.0';
import St from '@girs/st-13';
import {Slider} from '@girs/gnome-shell/ui/slider';
import {Sound} from "./manager"

const DEFAULT_VOLUME = 0.5;

export class TSoundBox extends St.BoxLayout {
    _sensitive: boolean
    _slider: Slider
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

        let gicon = Gio.icon_new_for_string(sound.icon);

        let icon = new St.Icon({
            style_class: "icon",
            gicon,
            reactive: true,
        });
        this.add_child(icon);

        this._slider = new Slider(DEFAULT_VOLUME);
        this._slider.connect("notify::value", this._onSliderChanged.bind(this));
        this.add_child(this._slider);

        this._player = new SoundPlayer(sound);

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
    prerolled = false
    playbin: Gst.Pipeline
    sink: GstAudio.AudioBaseSink

    constructor(sound: Sound) {
        this.playbin = Gst.ElementFactory.make("playbin", sound.name) as Gst.Pipeline;
        this.sink = Gst.ElementFactory.make("pulsesink", "sink") as GstAudio.AudioBaseSink;

        this.playbin.set_property("uri", this.getUri(sound));
        this.playbin.set_property("audio-sink", this.sink);

        let bus = this.playbin.get_bus();
        bus.add_signal_watch();
        bus.connect("message", (_bus, msg) => {
            if (msg != null) this._onMessageReceived(msg);
        });
    }

    play() {
        this.playbin.set_state(Gst.State.PLAYING);
    }

    pause() {
        this.playbin.set_state(Gst.State.PAUSED);
        this.prerolled = false;
    }

    setVolume(value: number) {
        this.playbin.set_volume(GstAudio.StreamVolumeFormat.LINEAR, value);

        let [_rv, state, _pstate] = this.playbin.get_state(Gst.State.NULL);
        if (value == 0) {
            this.playbin.set_state(Gst.State.NULL);
        } else if (state != Gst.State.PLAYING) {
            this.playbin.set_state(Gst.State.PLAYING);
        }
    }

    _onMessageReceived(message: Gst.Message) {
        if (message.type == Gst.MessageType.SEGMENT_DONE) {
            this.playbin.seek_simple(Gst.Format.TIME, Gst.SeekFlags.SEGMENT, 0);
        }
        if (message.type == Gst.MessageType.ASYNC_DONE) {
            if (!this.prerolled) {
                this.playbin.seek_simple(
                    Gst.Format.TIME,
                    Gst.SeekFlags.FLUSH | Gst.SeekFlags.SEGMENT,
                    0
                );
                this.prerolled = true;
            }
        }

        return true;
    }

    getUri(sound: Sound) {
        /* All URIs are relative to $HOME. */
        return Gst.filename_to_uri(sound.uri);
    }
};
