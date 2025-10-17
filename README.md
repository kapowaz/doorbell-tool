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
