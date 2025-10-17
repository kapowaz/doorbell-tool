export type UBNTSoundConfig = {
  customSounds: Array<{
    enable: boolean;
    file: string;
    repeatTimes: number;
    soundStateName: 'RING_BUTTON_PRESSED';
    volume: number;
  }>;
  fingerprintSoundsEnabled: number;
  forceDetectionStatusLightEnabled: number;
  glow: {
    activeAt: 'night';
    brightness: number;
    fadeOffMs: number;
    fadeOnMs: number;
    mode: 'personInFrontActivated';
    onMs: number;
  };
  lcmAutoOffStartMinute: number;
  lcmAutoOffStopMinute: number;
  lcmBrightness: number;
  ledAnimColorBg: 'black';
  ledAnimColorFg: 'blue';
  ledAnimDensity: number;
  ledAnimOnDurationMs: number;
  ledBreathingPeriodMs: number;
  ledFaceAlwaysOnWhenManaged: number;
  ledFaceEnabled: number;
  nfcSoundsEnabled: number;
  personDetectionSource: 'all';
  previousLedFaceEnabled: number;
  ringVolume: number;
  scanningFcdDisabled: number;
  speakerEnabled: number;
  speakerVolume: number;
  systemSoundsEnabled: number;
  userLedBlinkPeriodMs: number;
  userLedColorBg: 'black';
  userLedColorFg: 'blue';
  userLedOnNoff: number;
  welcomeType: 'image' | 'text';
};

export type ScreenName =
  | 'BE_RIGHT_THERE'
  | 'BLANK'
  | 'CONNECTING_WIFI'
  | 'DO_NOT_DISTURB'
  | 'DOOR_LOCKED'
  | 'DOOR_UNLOCKED'
  | 'FACTORY_RESETTING'
  | 'FINGERPRINT_ERROR_BIG'
  | 'FINGERPRINT_ERROR_MIDDLE'
  | 'FINGERPRINT_RECOGNIZED'
  | 'FINGERPRINT_SCAN_FINGER'
  | 'FINGERPRINT_SCANNING_FINGER'
  | 'INITIALIZING'
  | 'INSUFFICIENT_POWER'
  | 'LEAVE_PACKAGE_AT_DOOR'
  | 'MESSAGE'
  | 'NFC_ACCESS_GRANTED'
  | 'NFC_ACCESS_REJECTED'
  | 'NFC_CARD_NOT_SUPPORTED'
  | 'NFC_CARD_REJECTED'
  | 'NFC_CONFIRM_CARD'
  | 'NFC_CONFIRM_POCKET'
  | 'NFC_CONSOLE_OFFLINE'
  | 'NFC_PLACE_CARD'
  | 'NFC_POCKET_REJECTED'
  | 'NFC_REGISTER_ERROR'
  | 'NFC_REGISTERED_OTHER_SITE'
  | 'NFC_SCAN_CARD_AGAIN'
  | 'NO_CONNECTION_KNOCK'
  | 'NO_WIFI_IN_RANGE'
  | 'OFFLINE'
  | 'OPEN_MOBILE_APP'
  | 'PAIR_COMPLETE'
  | 'PAIR_FAILED'
  | 'PAIRING'
  | 'POOR_WIFI_SIGNAL'
  | 'RESET_HOLD'
  | 'RESTARTING'
  | 'SETUP_COMPLETE'
  | 'SHUTTING_DOWN_COUNT'
  | 'SHUTTING_DOWN'
  | 'TALKING'
  | 'UNCONFIGURED'
  | 'UPDATING_FIRMWARE'
  | 'UPDATING_MCU'
  | 'WAITING_FOR_RESPONSE'
  | 'WELCOME_TEXT'
  | 'WELCOME'
  | 'WIFI_RECONFIGURE';

export const SCREEN_NAME_TYPES = [
  'BE_RIGHT_THERE',
  'BLANK',
  'CONNECTING_WIFI',
  'DO_NOT_DISTURB',
  'DOOR_LOCKED',
  'DOOR_UNLOCKED',
  'FACTORY_RESETTING',
  'FINGERPRINT_ERROR_BIG',
  'FINGERPRINT_ERROR_MIDDLE',
  'FINGERPRINT_RECOGNIZED',
  'FINGERPRINT_SCAN_FINGER',
  'FINGERPRINT_SCANNING_FINGER',
  'INITIALIZING',
  'INSUFFICIENT_POWER',
  'LEAVE_PACKAGE_AT_DOOR',
  'MESSAGE',
  'NFC_ACCESS_GRANTED',
  'NFC_ACCESS_REJECTED',
  'NFC_CARD_NOT_SUPPORTED',
  'NFC_CARD_REJECTED',
  'NFC_CONFIRM_CARD',
  'NFC_CONFIRM_POCKET',
  'NFC_CONSOLE_OFFLINE',
  'NFC_PLACE_CARD',
  'NFC_POCKET_REJECTED',
  'NFC_REGISTER_ERROR',
  'NFC_REGISTERED_OTHER_SITE',
  'NFC_SCAN_CARD_AGAIN',
  'NO_CONNECTION_KNOCK',
  'NO_WIFI_IN_RANGE',
  'OFFLINE',
  'OPEN_MOBILE_APP',
  'PAIR_COMPLETE',
  'PAIR_FAILED',
  'PAIRING',
  'POOR_WIFI_SIGNAL',
  'RESET_HOLD',
  'RESTARTING',
  'SETUP_COMPLETE',
  'SHUTTING_DOWN_COUNT',
  'SHUTTING_DOWN',
  'TALKING',
  'UNCONFIGURED',
  'UPDATING_FIRMWARE',
  'UPDATING_MCU',
  'WAITING_FOR_RESPONSE',
  'WELCOME_TEXT',
  'WELCOME',
  'WIFI_RECONFIGURE',
];

export type GenericFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
  horizontal: 'left' | 'center' | 'right';
  vertical: 'top' | 'middle' | 'bottom';
};

export interface TextFrame extends GenericFrame {
  size: number;
  font_style?: string; // 'Black' is the only value seen so far
  letter_spacing?: number;
  strs: string[];
}

export interface ImageFrame extends GenericFrame {
  file: string;
  animation: 'slideshow' | 'static' | 'breathing';
  duration?: number;
  count?: number;
  animation_loop?: boolean;
}

export interface ScreenFrame {
  texts?: TextFrame[];
  images?: ImageFrame[];
  frame_config?: {
    duration: number;
    animation?: 'slideleft';
    animation_duration?: number;
  };
}
