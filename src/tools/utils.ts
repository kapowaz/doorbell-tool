import colors from 'colors';

export const logError = (errorMessage: string) => {
  console.error(`${colors.red('✗')} ${errorMessage}`);
};

export const logWarning = (warnMessage: string) => {
  console.warn(`${colors.yellow('!')} ${warnMessage}`);
};

export const logSuccess = (successMessage: string) => {
  console.log(`${colors.green('✓')} ${successMessage}`);
};
