const rollbarInstance = vi.hoisted(() => ({
  critical: vi.fn(),
  error: vi.fn(),
  configure: vi.fn()
}));

//captured during module evaluation: the SDK options only reach the constructor
//when the service module is imported
const rollbarCtorOptions = vi.hoisted(() => ({ value: null }));

vi.mock('rollbar', () => ({
  default: vi.fn(function (options) {
    rollbarCtorOptions.value = options;

    return rollbarInstance;
  })
}));

const loadService = async (envOverrides = {}) => {
  vi.resetModules();
  vi.doMock('@/core/config/env', () => ({
    default: {
      isDev: false,
      rollbarAccessToken: 'test-token',
      ...envOverrides
    }
  }));

  return (await import('@/services/monitoring/rollbarService')).rollbarService;
};

const createAppStub = () => ({
  config: {}
});

describe('services/monitoring/rollbarService configuration', () => {
  it('builds the notifier disabled, so a local or test run can never report', async () => {
    await loadService();

    expect(rollbarCtorOptions.value.enabled).toBe(false);
    expect(rollbarCtorOptions.value.accessToken).toBe('test-token');
    expect(rollbarCtorOptions.value.captureUncaught).toBe(true);
    expect(rollbarCtorOptions.value.captureUnhandledRejections).toBe(true);
    expect(rollbarCtorOptions.value.captureIp).toBe(false);
    expect(rollbarCtorOptions.value.reportLevel).toBe('error');
    expect(rollbarCtorOptions.value.itemsPerMinute).toBe(1);
    expect(rollbarCtorOptions.value.timeout).toBe(3000);
    expect(rollbarCtorOptions.value.maxRetries).toBe(3);
  });

  it('names the environment after the build and the host that serves it', async () => {
    await loadService();

    expect(rollbarCtorOptions.value.payload.environment).toBe(`production - ${window.location.hostname}`);

    await loadService({
      isDev: true
    });

    expect(rollbarCtorOptions.value.payload.environment).toBe(`development - ${window.location.hostname}`);
  });
});

describe('services/monitoring/rollbarService ignoredMessages', () => {
  //replicates the SDK predicate: every entry becomes a case-insensitive RegExp
  //tested against the reported message
  const sdkDrops = (message) => rollbarCtorOptions.value.ignoredMessages.some((pattern) => {
    return new RegExp(pattern, 'gi').test(message);
  });

  it('keeps the suppression list in one place', async () => {
    await loadService();

    expect(rollbarCtorOptions.value.ignoredMessages).toEqual([
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Script error.'
    ]);
  });

  it('drops browser noise the app cannot act on', async () => {
    await loadService();

    expect(sdkDrops('ResizeObserver loop limit exceeded')).toBe(true);
    expect(sdkDrops('ResizeObserver loop completed with undelivered notifications')).toBe(true);
    expect(sdkDrops('Script error.')).toBe(true);
  });

  it('never drops a failure the app can act on', async () => {
    await loadService();

    expect(sdkDrops("TypeError: Cannot read properties of undefined (reading 'answer')")).toBe(false);
    expect(sdkDrops('Failed to fetch entries for project ec5-demo-project')).toBe(false);
    expect(sdkDrops('cache: persist page failed: QuotaExceededError')).toBe(false);
  });
});

describe('services/monitoring/rollbarService init', () => {
  let infoSpy = null;

  beforeEach(() => {
    vi.clearAllMocks();
    //the init log line is expected, and would otherwise clutter the suite output
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
  });

  it('reports nothing in development and leaves the Vue error handling alone', async () => {
    const service = await loadService({
      isDev: true
    });
    const app = createAppStub();

    expect(service.init(app)).toBe(false);
    expect(rollbarInstance.configure).not.toHaveBeenCalled();
    expect(app.config.errorHandler).toBeUndefined();
    expect(infoSpy).toHaveBeenCalledWith('Rollbar reporting disabled');
  });

  it('stays off in a build that did not get the token', async () => {
    const service = await loadService({
      rollbarAccessToken: ''
    });
    const app = createAppStub();

    expect(service.init(app)).toBe(false);
    expect(infoSpy).toHaveBeenCalledWith('Rollbar reporting disabled');
    expect(rollbarInstance.configure).not.toHaveBeenCalled();
    expect(app.config.errorHandler).toBeUndefined();
  });

  it('enables reporting and hooks Vue errors up in production', async () => {
    const service = await loadService();
    const app = createAppStub();

    expect(service.init(app)).toBe(true);
    expect(rollbarInstance.configure).toHaveBeenCalledWith({
      enabled: true
    });
    expect(typeof app.config.errorHandler).toBe('function');

    const error = new Error('render failed');

    app.config.errorHandler(error, null, 'render function');

    expect(rollbarInstance.error).toHaveBeenCalledWith(error, {
      info: 'render function'
    });
  });
});

describe('services/monitoring/rollbarService test report', () => {
  let infoSpy = null;
  let service = null;

  beforeEach(async () => {
    vi.clearAllMocks();
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
  });

  it('reads the flag from a query string, and only as its own parameter', async () => {
    service = await loadService();

    expect(service.isTestReportRequested('?rollbar_test=1')).toBe(true);
    expect(service.isTestReportRequested('?project=demo&rollbar_test')).toBe(true);
    expect(service.isTestReportRequested('?other=rollbar_test')).toBe(false);
    expect(service.isTestReportRequested('')).toBe(false);
  });

  it('sends one report through the app reporting path when it is enabled', async () => {
    service = await loadService();

    expect(service.sendTestReport()).toBe(true);
    expect(rollbarInstance.critical).toHaveBeenCalledTimes(1);

    const reported = rollbarInstance.critical.mock.calls[0][0];
    const custom = rollbarInstance.critical.mock.calls[0][1];

    expect(reported.message).toContain('rollbar: test report');
    expect(custom).toMatchObject({
      context: 'rollbar: test report'
    });
    expect(infoSpy).toHaveBeenCalledWith('Rollbar test report sent');
  });

  it('skips the report in development and in a build without the token', async () => {
    service = await loadService({
      isDev: true
    });

    expect(service.sendTestReport()).toBe(false);

    service = await loadService({
      rollbarAccessToken: ''
    });

    expect(service.sendTestReport()).toBe(false);
    expect(rollbarInstance.critical).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith('Rollbar test report skipped: reporting is disabled');
  });
});

describe('services/monitoring/rollbarService criticalWithContext', () => {
  let service = null;

  beforeEach(async () => {
    vi.clearAllMocks();
    service = await loadService();
  });

  it('prefixes the operation context and preserves the original stack', () => {
    const error = new Error('boom');

    service.criticalWithContext('entries load failed', error);

    const reported = rollbarInstance.critical.mock.calls[0][0];
    const custom = rollbarInstance.critical.mock.calls[0][1];

    expect(reported).toBeInstanceOf(Error);
    expect(reported.message).toBe('entries load failed: boom');
    expect(reported.stack).toBe(error.stack);
    expect(custom).toMatchObject({
      context: 'entries load failed'
    });
  });

  it('keeps the original error name and cause', () => {
    const cause = new Error('offline');
    const error = new Error('request failed');

    error.name = 'NetworkError';
    error.cause = cause;

    service.criticalWithContext('entries load failed', error);

    const reported = rollbarInstance.critical.mock.calls[0][0];

    expect(reported.name).toBe('NetworkError');
    expect(reported.cause).toBe(cause);
  });

  it('carries plain error objects and their diagnostics into the report', () => {
    service.criticalWithContext('upload failed', {
      code: 5,
      row: 12
    });

    const reported = rollbarInstance.critical.mock.calls[0][0];
    const custom = rollbarInstance.critical.mock.calls[0][1];

    expect(reported).toBeInstanceOf(Error);
    expect(reported.message).toBe('upload failed: {"code":5,"row":12}');
    expect(custom).toMatchObject({
      context: 'upload failed',
      code: 5,
      row: 12
    });
  });

  it('never throws on circular values, so reporting cannot hide the failure', () => {
    const circular = {
      code: 5
    };

    circular.self = circular;

    expect(() => service.criticalWithContext('upload failed', circular)).not.toThrow();

    const reported = rollbarInstance.critical.mock.calls[0][0];

    expect(reported).toBeInstanceOf(Error);
    expect(reported.message).toContain('upload failed: ');
  });

  it('never throws on BigInt or a throwing toJSON', () => {
    expect(() => service.criticalWithContext('upload failed', 10n)).not.toThrow();
    expect(() => service.criticalWithContext('upload failed', {
      toJSON() {
        throw new Error('nope');
      }
    })).not.toThrow();

    expect(rollbarInstance.critical.mock.calls[0][0].message).toBe('upload failed: 10');
  });

  it('reduces a function to a short tag instead of serializing its source', () => {
    function namedFn() {
      return true;
    }

    service.criticalWithContext('upload failed', namedFn);

    expect(rollbarInstance.critical.mock.calls[0][0].message).toBe('upload failed: [Function namedFn]');
  });

  it('never throws on symbols, undefined or an anonymous function', () => {
    expect(() => service.criticalWithContext('upload failed', Symbol('s'))).not.toThrow();
    expect(() => service.criticalWithContext('upload failed', undefined)).not.toThrow();
    expect(() => service.criticalWithContext('upload failed', () => {})).not.toThrow();

    expect(rollbarInstance.critical).toHaveBeenCalledTimes(3);
  });

  it('reports a bare message through critical()', () => {
    service.critical('plain failure');

    expect(rollbarInstance.critical.mock.calls[0][0].message).toBe('plain failure');
  });
});
