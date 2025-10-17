import fs from 'fs';
import path from 'path';
import { exec as execChildProcess } from 'child_process';
import colors from 'colors';
import util from 'util';
import yargs from 'yargs';
import sharp from 'sharp';
import type { OverlayOptions } from 'sharp';
import prettier from 'prettier';
import { SCREEN_NAME_TYPES } from './types.ts';
import type { ScreenName, ScreenFrame } from './types.ts';
import { logError, logWarning, logSuccess } from './utils.ts';

const CONFIG_DEFAULTS = './src/tools/defaults/ubnt_lcm_gui_sysid_a575.json';
const ACCEPTABLE_FRAME_IMAGE_FORMATS = ['png', 'jpeg', 'jpg', 'tiff', 'tif', 'webp'];
const OUTPUT_PATH = './build';
const OUTPUT_CONFIG_PATH = `${OUTPUT_PATH}/ubnt_lcm_gui.json`;
const CONFIG_DESTINATION_PATH = '/var/etc/persistent/ubnt_lcm_gui.json';
const SLIDESHOW_FILE_DESTINATION_PATH = '/var/etc/persistent';
const PROCESS_PATH = '/bin/ubnt_lcm_gui';
const IMAGE_MOUNT_PATH = '/usr/etc/gui/screen_240x240';
const CONFIG_MOUNT_PATH = '/usr/etc/gui/ubnt_lcm_gui_sysid_a575.json';

const isScreenName = (name: string): name is ScreenName => {
  return SCREEN_NAME_TYPES.includes(name);
};

/**
 * Get options from the command line
 */
const parser = yargs(process.argv.slice(2))
  .usage('Usage: yarn animation [options]')
  .version(false)
  .options({
    screen: {
      type: 'string',
      demandOption: true,
      describe: 'ScreenName to apply this animation to',
    },
    image: {
      type: 'string',
      demandOption: true,
      describe: 'Image file or sequence to use for this animation',
    },
    duration: {
      type: 'number',
      default: 1000,
      describe: 'Animation duration, in milliseconds. Not required for static images',
    },
    frames: {
      type: 'number',
      describe:
        'Number of frames in the animation, if creating a slideshow with a single spritesheet image',
    },
    framerate: {
      type: 'number',
      describe:
        'Framerate (per second) for the animation, as an alternative to providing an explicit duration',
    },
    loop: {
      type: 'boolean',
      default: true,
      describe: 'Should the animation loop?',
    },
    slideshow: {
      type: 'boolean',
      default: true,
      describe: 'Should the animation be a slideshow or a static image?',
    },
    x: {
      type: 'number',
      default: 0,
      describe: 'X (horizontal) offset for the left side of the image',
    },
    y: {
      type: 'number',
      default: 0,
      describe: 'Y (vertical) offset for the top of the image',
    },
    horizontal: {
      default: 'center',
      describe: 'Horizontal alignment of the image',
      choices: ['left', 'center', 'right'] as const,
    },
    vertical: {
      default: 'middle',
      describe: 'Vertical alignment of the image',
      choices: ['top', 'middle', 'bottom'] as const,
    },
    dry_run: {
      type: 'boolean',
      default: false,
      describe: 'Run commands without uploading to the device, to inspect output etc.',
    },
    version: { hidden: true },
    help: { hidden: true },
  });

const exec = util.promisify(execChildProcess);

const animationConfigPath = fs.existsSync(OUTPUT_CONFIG_PATH)
  ? OUTPUT_CONFIG_PATH
  : CONFIG_DEFAULTS;

const animationsConfig: {
  screens: {
    name: string;
    frames: ScreenFrame[];
  }[];
} = JSON.parse(fs.readFileSync(animationConfigPath, 'utf8'));

const hasAcceptedFileExtension = (imagePath: string): boolean => {
  const extension = path.extname(imagePath).split('.')[1];
  return ACCEPTABLE_FRAME_IMAGE_FORMATS.includes(extension);
};

const outputSlideshowImage = async ({
  images,
  width,
  height,
  outputImage,
}: {
  images: OverlayOptions[];
  width: number;
  height: number;
  outputImage: string;
}) => {
  await sharp({
    create: {
      width: width * images.length,
      height,
      channels: 3,
      background: 'transparent',
    },
  })
    .composite(images)
    .toFile(outputImage);
};

const updateAnimation = async () => {
  /**
   * Inputs we need to be able to update the animation:
   *
   * 1. ScreenName
   * 2. Image(s) — either a set of frames, _or_ a GIF image
   * 3. [Optional] duration for the animation (if not static)
   * 4. [Optional] should the animation loop (if not static)
   */
  const argv = await parser.parse();

  const {
    screen: screenName,
    image: imageName,
    duration,
    frames,
    framerate,
    loop,
    slideshow,
    x,
    y,
    horizontal,
    vertical,
    dry_run,
  } = argv;
  const animationSourcePath = `src/animations/${imageName}`;
  let outputImagePath = `${OUTPUT_PATH}/${imageName}`;
  let outputImageName = imageName;
  let animationFrames = frames;
  let imageDimensions = { width: 0, height: 0 };

  try {
    if (!isScreenName(screenName)) {
      throw new Error(
        `The provided argument for screen ${colors.bold(screenName)} is not a valid screen name`,
      );
    }

    if (!fs.existsSync(animationSourcePath)) {
      throw new Error(
        `The specified image file ${colors.bold(animationSourcePath)} does not exist`,
      );
    }

    logSuccess(`Importing animation from source ${colors.bold(animationSourcePath)}…`);

    const isDirectory = fs.lstatSync(animationSourcePath).isDirectory();
    const isGIF = path.extname(imageName) === '.gif';
    const isStaticImage = hasAcceptedFileExtension(animationSourcePath) && !slideshow;

    switch (true) {
      /**
       * A directory containing an image sequence
       */
      case isDirectory:
        {
          const contents = fs.readdirSync(animationSourcePath, { withFileTypes: true });
          outputImageName = `${imageName}.png`;
          outputImagePath = `${OUTPUT_PATH}/${outputImageName}`;

          /**
           * Filter out:
           *
           * - Things that aren’t files
           * - Files that don’t have an accepted file extension (e.g. .txt files)
           * - Image files that don’t have an acceptable image format (e.g. calling a GIF a .png)
           */
          const arrValidImages = await Promise.all(
            contents.map(async (file) => {
              const imagePath = `${file.parentPath}/${file.name}`;

              // not a file, filter it out
              if (!file.isFile()) {
                logWarning(`Skipping ${colors.bold(imagePath)} as it isn’t a file`);
                return false;
              }

              // not an accepted file extension
              if (!hasAcceptedFileExtension(imagePath)) {
                logWarning(
                  `Skipping ${colors.bold(imagePath)} as it doesn’t have an acceptable file extension`,
                );
                return false;
              }

              // an unacceptable image format masquerading as an accepted file extension
              const { format, width, height } = await sharp(imagePath).metadata();
              if (!ACCEPTABLE_FRAME_IMAGE_FORMATS.includes(format)) {
                logWarning(
                  `Skipping ${colors.bold(imagePath)} as its image format (${format}) isn’t acceptable`,
                );
                return false;
              }

              // whilst iterating, set the image dimensions based on the first found image
              if (imageDimensions.width === 0 || imageDimensions.height === 0) {
                imageDimensions = {
                  width,
                  height,
                };
              } else if (width !== imageDimensions.width || height !== imageDimensions.height) {
                // reject any images that have dimensions different to the first dimensions encountered
                logWarning(
                  `Skipping ${colors.bold(imagePath)} as its image dimensions (${width}×${height}) are incompatible`,
                );
                return false;
              }

              return true;
            }),
          );

          const filteredImages = contents.filter((_, index) => arrValidImages[index]);
          const hasImages = Boolean(filteredImages.length);

          if (!hasImages) {
            throw new Error(
              `No suitable image(s) for an image sequence found in the directory path`,
            );
          }

          logSuccess(
            `Found image sequence with ${colors.bold(`${filteredImages.length} ${imageDimensions.width}×${imageDimensions.height}`)} images`,
          );

          // turn the filtered images into an array of sharp OverlayOptions
          const images: OverlayOptions[] = filteredImages.map((file, index) => {
            return {
              input: `${file.parentPath}/${file.name}`,
              left: index * imageDimensions.width,
              top: 0,
            };
          });

          // composite all the images into a single image, and export as a PNG
          await outputSlideshowImage({
            images,
            outputImage: outputImagePath,
            ...imageDimensions,
          });
          logSuccess(`Wrote slideshow image file to ${colors.bold(outputImagePath)}`);
        }
        break;

      /**
       * An animated GIF
       */
      case isGIF:
        {
          try {
            const { pages, width, height } = await sharp(animationSourcePath).metadata();
            outputImageName = `${path.basename(imageName, '.gif')}.png`;
            outputImagePath = `${OUTPUT_PATH}/${outputImageName}`;
            animationFrames = pages;
            imageDimensions = { width, height };

            const images: OverlayOptions[] = await Promise.all(
              [...Array(pages)].map(async (_, index) => {
                const inputBuffer = await sharp(animationSourcePath, {
                  page: index,
                }).toBuffer();

                return {
                  input: inputBuffer,
                  left: index * width,
                  top: 0,
                };
              }),
            );

            await outputSlideshowImage({
              images,
              outputImage: outputImagePath,
              width,
              height,
            });
            logSuccess(`Wrote slideshow image file to ${colors.bold(outputImagePath)}`);
          } catch (error) {
            logError(`An error occurred attempting to parse GIF image: ${error}`);
          }
        }
        break;

      /**
       * A single static image
       */
      case isStaticImage:
        {
          logSuccess(`Creating single static image`);
          exec(`cp ${animationSourcePath} ${outputImagePath}`);
          const { width, height } = await sharp(animationSourcePath).metadata();
          imageDimensions = {
            width,
            height,
          };
        }

        break;

      /**
       * A single image slideshow requires a frames argument. We _could_ just
       * fall back to a multiple of 240, but this doesn’t work for smaller
       * slideshow image dimensions
       */
      case hasAcceptedFileExtension(animationSourcePath):
        {
          if (!Boolean(frames)) {
            throw new Error(
              `if you’re creating a slideshow from a single image, you must provide a frames argument`,
            );
          }

          logSuccess(`Creating single frame animation`);
          exec(`cp ${animationSourcePath} ${outputImagePath}`);

          const { width, height } = await sharp(animationSourcePath).metadata();

          imageDimensions = {
            width: width / (frames as number),
            height,
          };
        }

        break;
      default:
        throw new Error(`Not sure how we got here exactly?`);
    }

    const animationDuration = framerate
      ? Math.round((1 / framerate) * (animationFrames as number) * 1000)
      : duration;

    const screenFrames: ScreenFrame[] = [
      {
        images: [
          {
            x,
            y,
            w: 0, // confusingly, this always appears to be set to 0, rather than the actual width of a frame
            h: imageDimensions.height,
            // this shouldn’t be necessary, but for some reason this doesn’t work:
            // https://github.com/yargs/yargs/blob/main/docs/typescript.md#more-specific-typing-for-choices
            horizontal: horizontal as 'center' | 'left' | 'right',
            vertical: vertical as 'middle' | 'top' | 'bottom',
            file: outputImageName,
            animation: 'slideshow',
            duration: animationDuration,
            count: frames,
            animation_loop: loop,
          },
        ],
      },
    ];

    const screens = animationsConfig.screens.filter(
      (defaultScreen) => defaultScreen.name !== screenName,
    );

    const animationsConfigOutput = JSON.stringify({
      ...animationsConfig,
      screens: [
        ...screens,
        {
          name: screenName,
          frames: screenFrames,
        },
      ],
    });

    const formattedOutput = await prettier.format(animationsConfigOutput, { parser: 'json' });

    /**
     * Generate a new animations config file
     */
    fs.writeFileSync(OUTPUT_CONFIG_PATH, formattedOutput, 'utf8');
    logSuccess(`Wrote animations config file to: ${colors.bold(OUTPUT_CONFIG_PATH)}`);

    if (dry_run) throw new Error('Bailing out early to avoid sending new config to device…');

    /**
     * Copy animations config file to device
     */
    logSuccess(`Copying animations config file to ${colors.bold(CONFIG_DESTINATION_PATH)}…`);

    exec(
      `sshpass -p $G4_DOORBELL_SSH_PASSWORD scp -O ${OUTPUT_CONFIG_PATH} ubnt@$G4_DOORBELL_HOSTNAME:${CONFIG_DESTINATION_PATH}`,
    );

    /**
     * Copy custom slideshow image file to device
     */
    logSuccess(
      `Copying custom slideshow image file to ${colors.bold(SLIDESHOW_FILE_DESTINATION_PATH)}…`,
    );

    exec(
      `sshpass -p $G4_DOORBELL_SSH_PASSWORD scp -O ${outputImagePath} ubnt@$G4_DOORBELL_HOSTNAME:${SLIDESHOW_FILE_DESTINATION_PATH}`,
    );

    /**
     * Mount the custom image in the target directory
     */
    logSuccess(`Mounting custom slideshow image file in ${colors.bold(IMAGE_MOUNT_PATH)}…`);

    exec(
      `sshpass -p $G4_DOORBELL_SSH_PASSWORD ssh ubnt@$G4_DOORBELL_HOSTNAME -f 'mount -o bind ${SLIDESHOW_FILE_DESTINATION_PATH}/${outputImageName} ${IMAGE_MOUNT_PATH}/${outputImageName}'`,
    );

    /**
     * Mount the animations config file in the target directory
     */
    logSuccess(`Mounting animations config file at ${colors.bold(CONFIG_MOUNT_PATH)}…`);

    exec(
      `sshpass -p $G4_DOORBELL_SSH_PASSWORD ssh ubnt@$G4_DOORBELL_HOSTNAME -f 'mount -o bind ${CONFIG_DESTINATION_PATH} ${CONFIG_MOUNT_PATH}'`,
    );

    /**
     * Restart the service
     */
    logSuccess(`Restarting ${colors.bold(PROCESS_PATH)} process…`);

    exec(
      `sshpass -p $G4_DOORBELL_SSH_PASSWORD ssh ubnt@$G4_DOORBELL_HOSTNAME -f 'killall ${PROCESS_PATH}'`,
    );
  } catch (error) {
    logError(`${error}`);
  }
};

updateAnimation();
