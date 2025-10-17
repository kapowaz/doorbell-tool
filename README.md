# UniFi Doorbell Tool

A set of scripts for customising your UniFi Doorbell G4 Pro. You can:

- Customise the chime played through the doorbell when somebody pushes the button
- Customise the screen animations displayed for key events

As well as copying/configuring the animations, the script can also generate
animations for you in the correct spritesheet format from an image sequence or
GIF.

## Requirements

- Node.js
- Yarn
- [sshpass](https://sshpass.com)

## Setup

1. Enable SSH access to your doorbell device by _first_ enabling SSH access to
   whichever device is running UniFi Protect (e.g. your UDM Pro or CloudKey+),
   via the UniFi Control Plane; you’ll be prompted to set a password, which you
   can then use with the `root` user to SSH into that device.
2. Once connected via SSH (dependent on whether it exists or not) either edit or
   create the file `/etc/unifi-protect/config.json` and add a key/value pair of
   `"enableSsh": true` to the root object.
3. Run `systemctl restart unifi-protect` to restart UniFi Protect
4. From the UniFi Protect settings for the doorbell device, find the ‘recovery
   key’ from its settings: this is also the SSH password for this device.
5. Set environment variables for `$G4_DOORBELL_SSH_PASSWORD` and
   `$G4_DOORBELL_HOSTNAME` with the recovery key and your doorbell’s IP address
   respectively. You can get the recovery key from the UniFi Protect settings for
   your device.
6. `cd` into this repository and run `yarn` to install all dependencies

## Usage

_To update the chime played through your doorbell when somebody pushes the
button, run:_

```
$ yarn chime --filename SomeAudioFile.wav
```

The path to the filename is relative to the `src/chimes/` directory within this
repository, so put your audio file within that directory before running the
command. Both `.wav` and `.ogg` audio formats are supported (I’ve not test
anything else, but it’s possible `.mp3` is supported too).

You can also supply arguments for `--volume` and `--repeat` to change the volume
(!) and how many times the chime should play after the buzzer is pressed. Note:
this is not the same as the sound played by e.g. a connected PoE Chime, if you
have one; at the point I’m writing this, that can only be set using the UniFi
Protect app from the preinstalled list of chimes.

_To update the animations displayed on the doorbell screen for specific key
events, run:_

```
$ yarn animation --screen SCREEN_NAME --image <image> --framerate 20
```

In this case, `SCREEN_NAME` is the name of one of the predefined screens
displayed on the doorbell for specific events. The full list can be found in
`types.ts`, but the main ones you’ll probably want to set are `WELCOME` and
`WAITING_FOR_RESPONSE` which are displayed when somebody walks up to the
doorbell, and when they push the ringer. respectively.

The tool can accept a variety of different ways to create an animation.
Internally the doorbell uses a ‘slideshow’ format where each frame is laid out
horizontally across a single PNG image, and animates this by showing a different
slice of the image according to the animation duration. The tool can accept an
image created in this format if you’d prefer, but you can also provide it a GIF
image or a folder containing an image sequence (i.e. sequentially numbered
images) in PNG or JPEG format. Just put your images into the `src/animations/`
directory, as the path accepted by the script is relative to this location.

If you want to customise multiple screens (or you just want to test the tool
without changing anything on your doorbell), you can run the script with the
`--dry_run` flag enabled, and it will generate the output images and config
files in the `build/` directory; subsequent runs of the script will use this
file as the starting point, overwriting the default config for any screens you
update. If you want to start out fresh again, just delete anything in the
`build/` directory.
