const opentelemetry = require('@opentelemetry/sdk-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { PgInstrumentation } = require('@opentelemetry/instrumentation-pg');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Configure the SDK
const sdk = new opentelemetry.NodeSDK({
  resource: opentelemetry.resources.resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: 'glasscode-backend',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter: new JaegerExporter({
    endpoint: 'http://localhost:14268/api/traces',
  }),
  metricExporter: new PrometheusExporter({
    port: 9464,
    endpoint: '/metrics',
  }),
  instrumentations: [
    new HttpInstrumentation({
      // Propagate correlation IDs through HTTP headers
      headersToSpanAttributes: {
        server: {
          requestHeaders: ['x-correlation-id'],
        },
      },
    }),
    new ExpressInstrumentation({
      // Include correlation ID in express spans
      requestHook: (span, info) => {
        const { req } = info;
        if (req.headers['x-correlation-id']) {
          span.setAttribute('correlation.id', req.headers['x-correlation-id']);
        }
      },
    }),
    new PgInstrumentation({
      // Enable enhanced database attributes
      enhancedDatabaseReporting: true,
    }),
  ],
});

module.exports = { sdk };