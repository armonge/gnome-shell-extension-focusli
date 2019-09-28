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
const GstAudio = imports.gi.GstAudio;
const Manager = Extension.imports.manager;
const Slider = imports.ui.slider;
const St = imports.gi.St;

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
      )
    }
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
        vertical: true
      });

      let icon = new St.Icon({
        style_class: "icon",
        icon_name: sound.icon,
        reactive: true
      });
      this.add_child(icon);

      this.slider = new Slider.Slider(DEFAULT_VOLUME);
      this.add_child(this.slider);

      this.slider.connect("notify::value", this._onSliderChanged.bind(this));

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

    _onSliderChanged() {
      const value = this.slider.value;
      this.player.setVolume(value);
      this.sensitive = value > 0;
    }
  }
);

const SoundPlayer = class SoundPlayer {
  constructor(sound) {
    this.playbin = Gst.ElementFactory.make("playbin", sound.name);
    this.playbin.set_property("uri", this.getUri(sound));
    this.sink = Gst.ElementFactory.make("pulsesink", "sink");
    this.playbin.set_property("audio-sink", this.sink);

    this.prerolled = false;
    let bus = this.playbin.get_bus();
    bus.add_signal_watch();
    bus.connect("message", (bus, msg) => {
      if (msg != null) this._onMessageReceived(msg);
    });
  }

  play() {
    this.playbin.set_state(Gst.State.PLAYING);
  }

  pause() {
    this.playbin.set_state(Gst.State.NULL);
    this.prerolled = false;
  }

  setVolume(value) {
    this.playbin.set_volume(GstAudio.StreamVolumeFormat.LINEAR, value);

    let [rv, state, pstate] = this.playbin.get_state(Gst.State.NULL);
    if (value == 0) {
      this.playbin.set_state(Gst.State.NULL);
    } else if (state != Gst.State.PLAYING) {
      this.playbin.set_state(Gst.State.PLAYING);
    }
  }

  _onMessageReceived(message) {
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

  getUri(sound) {
    /* All URIs are relative to $HOME. */
    return Gst.filename_to_uri(sound.uri);
  }
};
