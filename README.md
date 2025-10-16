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
- [sshpass][sshpass]

## Setup

1. Run `yarn` to install all dependencies
2. Set environment variables for `$G4_DOORBELL_SSH_PASSWORD` and
   `$G4_DOORBELL_HOSTNAME` with the recovery key and your doorbell’s IP address
   respectively. You can get the recovery key from the UniFi Protect settings for
   your device.

## Usage

_To update the chime played through your doorbell when somebody pushes the
button, run:_

```
$ yarn chime --filename=SomeAudioFile.wav
```

You can also supply arguments for `--volume` and `--repeat` to change the volume
(!) and how many times the chime should play after the buzzer is pressed. Note:
this is not the same as the sound played by e.g. a connected PoE Chime, if you
have one; at the point I’m writing this, that can only be set using the UniFi
Protect app from the preinstalled list of chimes.
[sshpass]: https://sshpass.com
