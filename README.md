# UniFi Doorbell Tool

A set of scripts for customising your UniFi Doorbell G4 Pro. You can:

- Customise the chime played through the doorbell when somebody pushes the button
- Customise the screen animations displayed for key events such as when somebody
  walks up to the doorbell, or when they press the ringer.

As well as copying/configuring the animations, the script can also generate
animations for you in the correct spritesheet format from an image sequence or
GIF.

## I can already do this from the UniFi Protect app. Why do I need this tool?

If you’re happy enough with uploading GIFs directly to the Protect app, it’s
possible you don’t need this tool. However, there’s a few key advantages of this
tool:

- Since the settings on the doorbell seem to periodically reset (when there’s a
  power loss event, for example), you could hook this tool up to a cron job to
  ensure it gets run periodically
- GIF is a convenient format, but it’s lossy (doesn’t have the best image
  quality); PNG spritesheets can use 24-bit colour and opacity, with full colour
- At present you can only set the `WELCOME` screen animation via the Protect
  app, whereas you can set any number of other events, like
  `WAITING_FOR_RESPONSE`, which is shown after the doorbell is pressed.

## Requirements

- Node.js
- Yarn
- [sshpass](https://sshpass.com)

## Setup

1. Enable SSH access to your doorbell device by _first_ enabling SSH access to
   whichever device is running UniFi Protect (e.g. your UDM Pro or CloudKey+),
   via the UniFi Control Plane; you’ll be prompted to set a password, which you
   can then use with the `root` user to SSH into that device.
2. Once connected via SSH either edit or create (dependent on whether it exists
   or not) the file `/etc/unifi-protect/config.json` and add a key/value pair of
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
command. Both `.wav` and `.ogg` audio formats are supported (I’ve not tested
anything else, but it’s possible `.mp3` is supported too).

You can also supply arguments for `--volume` and `--repeat` to change the volume
(!) and how many times the chime should play after the buzzer is pressed. Note:
this is not the same as the sound played by e.g. a connected PoE Chime (if you
have one); you can customise this by uploading a custom `.wav` or `.mp3` file
from the UniFi Protect app.

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
Internally the doorbell uses a spritesheet format where each frame is laid out
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

## Examples

To make it easier to test (and because these are the images I’ve been setting on
my own doorbell in time for Halloween), I’ve included some example images and
sound files. You can try either of these and they _should_ work for you:

_To get the spooky music for the Shade in Hollow Knight:_

```
$ yarn chime --filename Hollow_Knight_Shade.wav
```

_To get the codec alert sound from Metal Gear Solid:_

```
$ yarn chime --filename MGS_Codec.wav
```

_To set the welcome screen animation when somebody walks up to your doorbell to
the Shade from Hollow Knight appearing, floating around then disappearing
again, do any one of:_

```
$ yarn animation --screen WELCOME --image ShadeAppear --framerate 20
$ yarn animation --screen WELCOME --image ShadeAppear.gif --framerate 20
$ yarn animation --screen WELCOME --image ShadeAppear.png --framerate 20 --frames 20
```

(This is the exact same animation, only as an image sequence, GIF, or
spritesheet image respectively. Note how the last one requires you to explicitly
state the number of frames).

_To set the ‘ringing’ screen to the Shade from Hollow Knight floating there, all
spooky, do any of:_

```
$ yarn animation --screen WAITING_FOR_RESPONSE --image ShadeIdle --framerate 20
$ yarn animation --screen WAITING_FOR_RESPONSE --image ShadeIdle.gif --framerate 20
$ yarn animation --screen WAITING_FOR_RESPONSE --image ShadeIdle.png --framerate 20 --frames 20
```

## Advanced Usage

I’ve not actually tried using these yet since the source images I wanted to use
fill the whole screen, but you can choose to use a smaller image size than
240×240, and then position it within the view at a specific set of coordinates
using the `--x` and `--y` arguments, optionally combined with the `--horizontal`
and `--vertical` arguments.

The full list of supported screens that you can customise are as follows (some
may not be supported by the G4 Doorbell, I’m not entirely sure):

```
BE_RIGHT_THERE
BLANK
CONNECTING_WIFI
DO_NOT_DISTURB
DOOR_LOCKED
DOOR_UNLOCKED
FACTORY_RESETTING
FINGERPRINT_ERROR_BIG
FINGERPRINT_ERROR_MIDDLE
FINGERPRINT_RECOGNIZED
FINGERPRINT_SCAN_FINGER
FINGERPRINT_SCANNING_FINGER
INITIALIZING
INSUFFICIENT_POWER
LEAVE_PACKAGE_AT_DOOR
MESSAGE
NFC_ACCESS_GRANTED
NFC_ACCESS_REJECTED
NFC_CARD_NOT_SUPPORTED
NFC_CARD_REJECTED
NFC_CONFIRM_CARD
NFC_CONFIRM_POCKET
NFC_CONSOLE_OFFLINE
NFC_PLACE_CARD
NFC_POCKET_REJECTED
NFC_REGISTER_ERROR
NFC_REGISTERED_OTHER_SITE
NFC_SCAN_CARD_AGAIN
NO_CONNECTION_KNOCK
NO_WIFI_IN_RANGE
OFFLINE
OPEN_MOBILE_APP
PAIR_COMPLETE
PAIR_FAILED
PAIRING
POOR_WIFI_SIGNAL
RESET_HOLD
RESTARTING
SETUP_COMPLETE
SHUTTING_DOWN_COUNT
SHUTTING_DOWN
TALKING
UNCONFIGURED
UPDATING_FIRMWARE
UPDATING_MCU
WAITING_FOR_RESPONSE
WELCOME_TEXT
WELCOME
WIFI_RECONFIGURE
```
