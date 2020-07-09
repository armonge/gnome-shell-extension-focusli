# Focusli
Improve focus and increase your productivity by listening to different sounds right from GNOME Shell.

![Screenshot](https://blogs.gnome.org/felipeborges/files/2017/05/extension.png)

Introduction: http://feborg.es/focusli

## Details & Info:

* To add/remove new sounds, you can edit the `~/.local/share/gnome-shell/extensions/focusli@armonge.info/sounds/database.json` file.
* All the sounds are royalty free (available at http://soundbible.com/royalty-free-sounds-1.html)
* The original sounds are ogg files. Make sure you have the proper plugins/codecs.
* When disabling a sound or setting the volume to 0, the player stops, saving you processing time.

## Troubleshooting

This extensions requires GStreamer gst-plugins-base to run, if you find the following error 
```
Error: Requiring GstAudio, version none: Typelib file for namespace 'GstAudio' (any version) not found
```

try running:
```
$ sudo apt install gir1.2-gst-plugins-base-1.0
```

For features and bug reports, please file an issue at https://github.com/armonge/gnome-shell-extension-focusli/issues
