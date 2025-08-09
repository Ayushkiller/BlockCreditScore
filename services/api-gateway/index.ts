// API Gateway Service - Main exports
// Implements Requirements 9.1, 9.2, 9.3, 9.4: Complete API gateway system

export { GatewayService } from './gateway-service';
export { IntegrationAPI } from './integration-api';

export type {
  GatewayConfig,
  EndpointMetrics,
  GatewayHealth
} from './gateway-service';

export type {
  APIConfig,
  RateLimitInfo,
  APIMetrics
} from './integration-api';