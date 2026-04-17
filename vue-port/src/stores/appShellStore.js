import { defineStore } from 'pinia';
import PARAMETERS from '@/config/parameters';

export const useAppShellStore = defineStore('appShell', {
  state: () => ({
    appName: PARAMETERS.APP_NAME
  })
});
