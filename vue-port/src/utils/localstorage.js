const STORAGE_KEY = 'epicollect5-restore';

const localstorage = {
  save(params) {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
      }
    } catch (error) {
      console.log(error);
    }
  },

  getRestoreParams() {
    try {
      if (typeof window === 'undefined') {
        return false;
      }

      return JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      console.log(error);
      return false;
    }
  },

  clear() {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.log(error);
    }
  }
};

export default localstorage;
