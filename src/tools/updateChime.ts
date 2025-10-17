import fs from 'fs';
import { exec as execChildProcess } from 'child_process';
import colors from 'colors';
import util from 'util';
import yargs from 'yargs';
import prettier from 'prettier';
import type { UBNTSoundConfig } from './types';
import { logSuccess, logError } from './utils';

const SOUNDS_CONFIG_DEFAULTS = './src/tools/defaults/ubnt_sounds_leds.json';
const OUTPUT_PATH = './build';
const SOUND_FILE_DESTINATION_PATH = '/var/etc/sounds';
const SOUNDS_CONFIG_FILE_DESTINATION_PATH = '/var/etc/persistent/ubnt_sounds_leds.conf';
const PROCESS_PATH = '/bin/ubnt_sounds_leds';

/**
 * Get options from the command line
 */
const parser = yargs(process.argv.slice(2))
  .usage('Usage: yarn chime [options]')
  .version(false)
  .options({
    filename: { type: 'string', demandOption: true },
    repeat: { type: 'number', default: 1 },
    volume: { type: 'number', default: 100 },
    version: { hidden: true },
    help: { hidden: true },
  });

const exec = util.promisify(execChildProcess);
const soundsConfigDefaults: UBNTSoundConfig = JSON.parse(
  fs.readFileSync(SOUNDS_CONFIG_DEFAULTS, 'utf8'),
);

const updateChime = async () => {
  const argv = await parser.parse();

  const { filename: soundFileName, repeat: repeatTimes, volume } = argv;
  const soundFileSourcePath = `src/chimes/${soundFileName}`;
  const soundFileDestinationPath = `../sounds/${soundFileName}`;

  if (fs.existsSync(soundFileSourcePath)) {
    const soundsConfigOutput = JSON.stringify({
      ...soundsConfigDefaults,
      customSounds: [
        {
          ...soundsConfigDefaults.customSounds[0],
          file: soundFileDestinationPath,
          repeatTimes,
          volume,
        },
      ],
    });

    const outputFileName = `${OUTPUT_PATH}/ubnt_sounds_leds.conf`;
    const formattedOutput = await prettier.format(soundsConfigOutput, { parser: 'json' });

    /**
     * Generate a new sound config file
     */

    try {
      fs.writeFileSync(outputFileName, formattedOutput, 'utf8');
      logSuccess(`Wrote sounds config file to: ${colors.bold(outputFileName)}`);

      /**
       * Copy sounds config file to device
       */
      logSuccess(
        `Copying sounds config file to ${colors.bold(SOUNDS_CONFIG_FILE_DESTINATION_PATH)}…`,
      );

      exec(
        `sshpass -p $G4_DOORBELL_SSH_PASSWORD scp -O ${outputFileName} ubnt@$G4_DOORBELL_HOSTNAME:${SOUNDS_CONFIG_FILE_DESTINATION_PATH}`,
      );

      /**
       * Copy custom chime sound file to doorbell device
       */
      logSuccess(
        `Copying custom chime sound file ${colors.bold(soundFileName)} to doorbell device…`,
      );

      exec(
        `sshpass -p $G4_DOORBELL_SSH_PASSWORD scp -O ${soundFileSourcePath} ubnt@$G4_DOORBELL_HOSTNAME:${SOUND_FILE_DESTINATION_PATH}`,
      );

      /**
       * Restart the /bin/ubnt_sounds_leds process
       */
      logSuccess(`Restarting ${colors.bold(PROCESS_PATH)} process…`);

      exec(
        `sshpass -p $G4_DOORBELL_SSH_PASSWORD ssh ubnt@$G4_DOORBELL_HOSTNAME -f 'killall ${PROCESS_PATH}'`,
      );
    } catch (error) {
      logError(`${error}`);
    }
  } else {
    logError(`The specified sound file ${colors.bold(soundFileSourcePath)} does not exist`);
  }
};

updateChime();
