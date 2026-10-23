import PARAMETERS from '@/core/config/parameters';
import helpers from '@/utils/helpers';

const DOWNLOAD_NAVIGATION_DELAY = 3000;

export const startDownload = ({ endpoint, requestTimestamp, onSettled }) => {
  const requestCookie = PARAMETERS.COOKIES.DOWNLOAD_ENTRIES;
  const expectedTimestamp = String(requestTimestamp);
  const intervalId = window.setInterval(() => {
    if (helpers.getCookieValue(requestCookie) !== expectedTimestamp) {
      return;
    }

    window.clearInterval(intervalId);
    helpers.removeCookie(requestCookie);

    if (onSettled) {
      onSettled();
    }
  }, PARAMETERS.DELAY.SHORT);

  const timeoutId = window.setTimeout(() => {
    window.location.href = endpoint;
  }, DOWNLOAD_NAVIGATION_DELAY);

  return () => {
    window.clearInterval(intervalId);
    window.clearTimeout(timeoutId);
  };
};
