#!/bin/bash

# Load environment variables
source .env.production

# Function to check application health
check_health() {
    local response=$(curl -s http://localhost:5000/health)
    if [[ $response == *"healthy"* ]]; then
        echo "Application is healthy"
        return 0
    else
        echo "Application is unhealthy"
        return 1
    fi
}

# Function to check database connection
check_database() {
    pg_isready -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "Database is connected"
        return 0
    else
        echo "Database connection failed"
        return 1
    fi
}

# Function to check Redis connection
check_redis() {
    redis-cli -u $REDIS_URL ping > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "Redis is connected"
        return 0
    else
        echo "Redis connection failed"
        return 1
    fi
}

# Function to check system resources
check_resources() {
    echo "System Resources:"
    echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"
    echo "Memory Usage: $(free -m | grep Mem | awk '{print $3/$2 * 100.0}')%"
    echo "Disk Usage: $(df -h / | awk 'NR==2 {print $5}')"
}

# Main monitoring loop
while true; do
    echo "=== Monitoring Check $(date) ==="
    
    # Check application health
    check_health
    if [ $? -ne 0 ]; then
        echo "ALERT: Application health check failed"
    fi
    
    # Check database
    check_database
    if [ $? -ne 0 ]; then
        echo "ALERT: Database connection failed"
    fi
    
    # Check Redis
    check_redis
    if [ $? -ne 0 ]; then
        echo "ALERT: Redis connection failed"
    fi
    
    # Check system resources
    check_resources
    
    # Wait for 5 minutes before next check
    sleep 300
done 