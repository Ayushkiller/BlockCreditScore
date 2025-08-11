// API endpoint for production environment health status
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // In a real implementation, this would connect to the production environment manager
    // For now, we'll simulate the response based on environment variables
    
    const environmentHealth = {
      isHealthy: true,
      lastHealthCheck: Date.now(),
      healthCheckDuration: 1250,
      errors: [],
      warnings: [],
      degradedServices: [],
      totalServices: 8,
      healthyServices: 7,
      services: {
        rpcProviders: {
          alchemy: {
            isHealthy: !!process.env.ALCHEMY_API_KEY,
            hasCredentials: !!process.env.ALCHEMY_API_KEY,
            lastValidated: Date.now() - 30000,
            averageResponseTime: 245,
            errorMessage: !process.env.ALCHEMY_API_KEY ? 'API key not configured' : undefined
          },
          infura: {
            isHealthy: !!process.env.INFURA_API_KEY,
            hasCredentials: !!process.env.INFURA_API_KEY,
            lastValidated: Date.now() - 45000,
            averageResponseTime: 312,
            errorMessage: !process.env.INFURA_API_KEY ? 'API key not configured' : undefined
          },
          ankr: {
            isHealthy: !!process.env.ANKR_API_KEY,
            hasCredentials: !!process.env.ANKR_API_KEY,
            lastValidated: Date.now() - 60000,
            averageResponseTime: 456,
            errorMessage: !process.env.ANKR_API_KEY ? 'API key not configured' : undefined
          }
        },
        marketData: {
          coingecko: {
            isHealthy: !!process.env.COINGECKO_API_KEY,
            hasCredentials: !!process.env.COINGECKO_API_KEY,
            lastValidated: Date.now() - 120000,
            averageResponseTime: 678,
            rateLimitRemaining: 45,
            rateLimitReset: Date.now() + 3600000,
            errorMessage: !process.env.COINGECKO_API_KEY ? 'API key not configured' : undefined
          },
          defillama: {
            isHealthy: true,
            hasCredentials: true,
            lastValidated: Date.now() - 90000,
            averageResponseTime: 892,
            errorMessage: undefined
          },
          fearGreedIndex: {
            isHealthy: true,
            hasCredentials: true,
            lastValidated: Date.now() - 180000,
            averageResponseTime: 534,
            errorMessage: undefined
          }
        },
        monitoring: {
          isHealthy: !!process.env.MONITORING_ENDPOINT && !!process.env.MONITORING_API_KEY,
          hasCredentials: !!process.env.MONITORING_ENDPOINT && !!process.env.MONITORING_API_KEY,
          lastValidated: Date.now() - 30000,
          averageResponseTime: 123,
          errorMessage: (!process.env.MONITORING_ENDPOINT || !process.env.MONITORING_API_KEY) ? 'Monitoring not configured' : undefined
        }
      }
    };

    // Calculate overall health
    const allServices = [
      ...Object.values(environmentHealth.services.rpcProviders),
      ...Object.values(environmentHealth.services.marketData),
      environmentHealth.services.monitoring
    ];

    const healthyCount = allServices.filter(service => service.isHealthy).length;
    const degradedServices = allServices
      .filter(service => !service.isHealthy)
      .map((_, index) => `Service${index}`);

    environmentHealth.healthyServices = healthyCount;
    environmentHealth.isHealthy = healthyCount === allServices.length;
    environmentHealth.degradedServices = degradedServices;

    if (!environmentHealth.isHealthy) {
      environmentHealth.warnings.push(`${degradedServices.length} services are degraded`);
    }

    res.status(200).json(environmentHealth);
  } catch (error) {
    console.error('Error fetching environment health:', error);
    res.status(500).json({ 
      error: 'Failed to fetch environment health',
      details: error.message 
    });
  }
}