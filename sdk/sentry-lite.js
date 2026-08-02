(function () {
  let DSN = null;
  let ENDPOINT = 'http://localhost:8000/api/events/';

  function init(config) {
    DSN = config.dsn;
    if (config.endpoint) ENDPOINT = config.endpoint;

    // Catch uncaught runtime errors
    window.onerror = function (message, source, lineno, colno, error) {
      captureException(error || new Error(message), {
        source,
        lineno,
        colno,
      });
    };

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', function (event) {
      captureException(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      );
    });
  }

  function captureException(error, extra) {
    if (!DSN) {
      console.warn('SentryLite: not initialized, call init({ dsn }) first');
      return;
    }

    const payload = {
      message: error?.message || String(error),
      stack_trace: error?.stack ? error.stack.split('\n').map(line => line.trim()) : [],
    };

    fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': DSN,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(function (err) {
      console.warn('SentryLite: failed to send event', err);
    });
  }

  window.SentryLite = { init, captureException };
})();