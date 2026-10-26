import Rollbar from 'rollbar';
import env from '@/core/config/env';

//browser noise the SDK drops before sending. Rollbar matches these
//case-insensitively as regexes against the error message, for every reporting
//path (the Vue error handler, captureUncaught and captureUnhandledRejections).
//Kept in one place on purpose: a new suppression must not mean touching every
//callsite. Keep the entries specific — a bare 'error' would swallow genuine
//failures too.
const IGNORED_MESSAGES = [
  //ag-grid and the Ionic overlays resize a container from inside a resize
  //callback: the browser recovers on its own and the report carries no app frame
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
  //a cross-origin script threw, so the browser withholds message and stack and
  //the report is never actionable
  'Script error.'
];

//the dataviewer has no release channel of its own: the host it is served from is
//what tells a staging deployment from production
const getEnvironment = () => {
  const mode = env.isDev ? 'development' : 'production';
  const hostname = typeof window === 'undefined' ? '' : window.location.hostname;

  return hostname ? `${mode} - ${hostname}` : mode;
};

//reporting is on in production builds only, and only when the build was given a
//token: local development and the test suite can never send anything
const isReportingEnabled = () => !env.isDev && Boolean(env.rollbarAccessToken);

const TEST_REPORT_PARAM = 'rollbar_test';

//built disabled: init() turns reporting on for production builds that carry the
//token, so local development and the test suite never send anything
const rollbar = new Rollbar({
  enabled: false,
  accessToken: env.rollbarAccessToken,
  captureUncaught: true,
  captureUnhandledRejections: true,
  reportLevel: 'error',
  //the viewer never asks for personal data, and errors can carry the URL and the
  //project slug already: an IP address adds nothing but liability
  captureIp: false,
  //a render or map loop can throw thousands of identical errors in a minute, and
  //the count is not what makes the item actionable
  itemsPerMinute: 1,
  timeout: 3000,
  maxRetries: 3,
  ignoredMessages: IGNORED_MESSAGES,
  payload: {
    environment: getEnvironment()
  }
});

//JSON.stringify throws on circular values, BigInt and a throwing toJSON, and
//reporting must never throw over the failure it reports. Functions are reduced to
//a short tag: String(fn) returns their source and can blow past the payload limit
const safeString = (value) => {
  if (typeof value === 'function') {
    return `[Function ${value.name || 'anonymous'}]`;
  }

  try {
    const result = JSON.stringify(value);

    return typeof result === 'string' ? result : String(value);
  } catch (ignored) {
    try {
      return String(value);
    } catch (ignoredToo) {
      return '[unserializable]';
    }
  }
};

//the context becomes the message prefix, so one failing operation groups as one
//item even when the thrown message varies
const buildReportableError = (context, error) => {
  if (error instanceof Error) {
    const reportableError = new Error(`${context}: ${error.message}`);

    //the original stack and class keep the report actionable
    reportableError.stack = error.stack;

    if (error.name && error.name !== 'Error') {
      reportableError.name = error.name;
    }

    if (error.cause !== undefined) {
      reportableError.cause = error.cause;
    }

    return reportableError;
  }

  return new Error(`${context}: ${safeString(error)}`);
};

//diagnostics of the original error ride in the custom payload, where Rollbar
//reads them: fields set on the wrapper itself would be ignored
const getContextFields = (context, error) => {
  const custom = {
    context
  };
  const errorKeys = ['message', 'stack', 'cause', 'name'];

  if (!error || (typeof error !== 'object' && typeof error !== 'function')) {
    return custom;
  }

  Object.keys(error).forEach((key) => {
    if (errorKeys.includes(key)) {
      return;
    }

    try {
      custom[key] = error[key];
    } catch (ignored) {
      custom[key] = '[unreadable]';
    }
  });

  return custom;
};

export const rollbarService = {
  //Vue reports errors thrown in render, in lifecycle hooks and in watchers to this
  //handler only: they never reach the window, so the SDK's own uncaught handling
  //would miss every component failure. The notifier is not a Vue plugin — it has
  //no install method to call — so the app has to be wired by hand.
  //Called only where reporting is on: in development Vue's own logging stays on
  //the component trace, which a plain console.error here would replace.
  install(app) {
    app.config.errorHandler = (error, instance, info) => {
      rollbar.error(error, {
        info
      });
    };
  },
  critical(error) {
    try {
      //a bare message is reported as written, anything else is made printable
      const reportableError = error instanceof Error
        ? error
        : new Error(typeof error === 'string' ? error : safeString(error));

      rollbar.critical(reportableError);
    } catch (ignored) {
      //reporting is fire and forget: it must never break the path it reports on
    }
  },
  criticalWithContext(context, error) {
    try {
      rollbar.critical(buildReportableError(context, error), getContextFields(context, error));
    } catch (ignored) {
      //reporting is fire and forget: it must never break the path it reports on
    }
  },
  init(app) {
    //a build without the token is a misconfiguration rather than a reason to fail
    if (!isReportingEnabled()) {
      console.info('Rollbar reporting disabled');

      return false;
    }

    rollbar.configure({
      enabled: true
    });
    rollbarService.install(app);

    console.info('Rollbar reporting enabled');

    return true;
  },
  //a deployed build is verified without a rebuild: any view opened with
  //?rollbar_test=1 sends one report while it renders, through the same wrapper the
  //app reports its own caught failures with, so the item proves the token, the
  //initialisation and the transport
  isTestReportRequested(search = '') {
    return new URLSearchParams(search).has(TEST_REPORT_PARAM);
  },
  sendTestReport() {
    //nothing to verify outside a production build with the token, and the flag
    //must not let a developer machine pollute the project
    if (!isReportingEnabled()) {
      console.info('Rollbar test report skipped: reporting is disabled');

      return false;
    }

    rollbarService.criticalWithContext('rollbar: test report', {
      trigger: `${TEST_REPORT_PARAM} flag`
    });
    console.info('Rollbar test report sent');

    return true;
  }
};
