import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Create Prometheus exporter
const prometheusExporter = new PrometheusExporter({
  port: 9464, // Default port for Prometheus scraping
  endpoint: '/metrics', // Endpoint where metrics will be exposed
});

// Create and start the OpenTelemetry SDK
const sdk = new NodeSDK({
  resource: {
    [SemanticResourceAttributes.SERVICE_NAME]: 'glasscode-backend',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'glasscode',
    [SemanticResourceAttributes.SERVICE_INSTANCE_ID]: `glasscode-backend-${process.pid}`,
  },
  traceExporter: undefined, // Disable tracing for now to focus on metrics
  metricReader: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable fs instrumentation to reduce noise
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
  ],
});

// Start the SDK
export async function startOpenTelemetry(): Promise<void> {
  try {
    await sdk.start();
    console.log('OpenTelemetry started successfully');
    console.log('Metrics available at http://localhost:9464/metrics');
  } catch (error) {
    console.error('Failed to start OpenTelemetry:', error);
  }
}

// Gracefully shutdown OpenTelemetry
export async function shutdownOpenTelemetry(): Promise<void> {
  try {
    await sdk.shutdown();
    console.log('OpenTelemetry shutdown successfully');
  } catch (error) {
    console.error('Error shutting down OpenTelemetry:', error);
  }
}
