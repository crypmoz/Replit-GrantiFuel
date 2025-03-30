import { Router } from 'express';
import { db } from './db';
import { redis } from './middleware/cache';
import { logger } from './middleware/logger';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.execute('SELECT 1');

    // Check Redis connection
    await redis.ping();

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Return health status
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: uptime,
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
      },
      services: {
        database: 'connected',
        redis: 'connected',
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    
    // Determine which service failed
    const services = {
      database: 'unknown',
      redis: 'unknown'
    };

    try {
      await db.execute('SELECT 1');
      services.database = 'connected';
    } catch {
      services.database = 'disconnected';
    }

    try {
      await redis.ping();
      services.redis = 'connected';
    } catch {
      services.redis = 'disconnected';
    }

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Detailed health check for internal use
router.get('/health/details', async (req, res) => {
  try {
    // Get system metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const loadAvg = process.loadavg();
    const uptime = process.uptime();

    // Get database metrics
    const dbMetrics = await db.execute(`
      SELECT 
        count(*) as total_connections,
        count(*) filter (where state = 'active') as active_connections
      FROM pg_stat_activity
    `);

    // Get Redis metrics
    const redisInfo = await redis.info();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      system: {
        uptime,
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
          external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB',
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
          loadAvg: loadAvg,
        }
      },
      services: {
        database: {
          status: 'connected',
          metrics: dbMetrics.rows[0],
        },
        redis: {
          status: 'connected',
          info: redisInfo,
        }
      }
    });
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 