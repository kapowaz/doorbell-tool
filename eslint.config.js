import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([tseslint.configs.recommended]);
