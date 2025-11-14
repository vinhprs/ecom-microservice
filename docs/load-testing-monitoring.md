# Load Testing & Monitoring Configuration

## 1. k6 Load Testing Scripts

### flash-sale-test.js
```javascript
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const orderDuration = new Trend('order_duration');
const successfulOrders = new Counter('successful_orders');
const failedOrders = new Counter('failed_orders');

// Test configuration
export const options = {
  scenarios: {
    // Scenario 1: Normal load
    normal_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10000 },  // Ramp up to 10k users
        { duration: '5m', target: 10000 },  // Stay at 10k users
        { duration: '2m', target: 0 },      // Ramp down
      ],
      gracefulRampDown: '30s',
    },
    
    // Scenario 2: Flash sale spike
    flash_sale_spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50000 },   // Quick ramp to 50k
        { duration: '3m', target: 200000 },  // Spike to 200k users
        { duration: '5m', target: 200000 },  // Sustain peak
        { duration: '2m', target: 50000 },   // Ramp down
        { duration: '1m', target: 0 },       // Cool down
      ],
      startTime: '10m', // Start after normal load
    },
  },
  
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.01'], // Error rate < 1%
    'errors': ['rate<0.01'],
    'order_duration': ['p(95)<500'],
  },
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://api.yourapp.com';
const FLASH_SALE_PRODUCT_ID = __ENV.FLASH_SALE_PRODUCT_ID || 'flash-product-123';

// Generate unique user IDs
const generateUserId = () => {
  return `user_${__VU}_${__ITER}`;
};

// Login and get auth token
function login(userId) {
  const payload = JSON.stringify({
    email: `${userId}@test.com`,
    password: 'Test123!',
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const res = http.post(`${BASE_URL}/auth/login`, payload, params);
  
  check(res, {
    'login successful': (r) => r.status === 200,
  });
  
  return res.json('token');
}

// Main test function
export default function () {
  const userId = generateUserId();
  
  // Login
  const token = login(userId);
  
  if (!token) {
    errorRate.add(1);
    return;
  }
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };
  
  // Test different endpoints
  group('Product Browsing', () => {
    // Get flash sale products
    const productsRes = http.get(`${BASE_URL}/products/flash-sale`, params);
    
    check(productsRes, {
      'products loaded': (r) => r.status === 200,
      'response time < 200ms': (r) => r.timings.duration < 200,
    });
    
    sleep(1);
  });
  
  group('Flash Sale Order', () => {
    const startTime = Date.now();
    
    // Create flash sale order
    const orderPayload = JSON.stringify({
      productId: FLASH_SALE_PRODUCT_ID,
      quantity: 1,
    });
    
    const orderRes = http.post(
      `${BASE_URL}/orders/flash-sale/${FLASH_SALE_PRODUCT_ID}`,
      orderPayload,
      params
    );
    
    const duration = Date.now() - startTime;
    orderDuration.add(duration);
    
    const success = check(orderRes, {
      'order created': (r) => r.status === 201,
      'order response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    if (success) {
      successfulOrders.add(1);
    } else {
      failedOrders.add(1);
      errorRate.add(1);
    }
    
    // Check order status
    if (orderRes.status === 201) {
      const orderId = orderRes.json('id');
      
      sleep(2); // Wait for async processing
      
      const statusRes = http.get(`${BASE_URL}/orders/${orderId}`, params);
      
      check(statusRes, {
        'order status retrieved': (r) => r.status === 200,
      });
    }
  });
  
  sleep(1);
}

// Setup function (runs once per VU)
export function setup() {
  console.log('Starting flash sale load test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Flash Sale Product: ${FLASH_SALE_PRODUCT_ID}`);
}

// Teardown function (runs once after test)
export function teardown(data) {
  console.log('Load test completed');
}
```

### stress-test.js
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50000 },   // Ramp up
    { duration: '5m', target: 100000 },  // Increase load
    { duration: '2m', target: 150000 },  // Push to limits
    { duration: '5m', target: 200000 },  // Breaking point
    { duration: '2m', target: 100000 },  // Recover
    { duration: '2m', target: 0 },       // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000'],
    'http_req_failed': ['rate<0.05'], // Allow 5% errors in stress test
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://api.yourapp.com';

export default function () {
  const responses = http.batch([
    ['GET', `${BASE_URL}/products/flash-sale`],
    ['GET', `${BASE_URL}/products?category=electronics`],
    ['GET', `${BASE_URL}/users/profile`],
  ]);
  
  responses.forEach((res) => {
    check(res, {
      'status is 200': (r) => r.status === 200,
    });
  });
  
  sleep(1);
}
```

### soak-test.js
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

// Soak test - run at sustained load for extended period
export const options = {
  stages: [
    { duration: '2m', target: 50000 },  // Ramp up
    { duration: '2h', target: 50000 },  // Stay at load for 2 hours
    { duration: '2m', target: 0 },      // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'http_req_failed': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://api.yourapp.com';

export default function () {
  const res = http.get(`${BASE_URL}/products/flash-sale`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

---

## 2. Prometheus Configuration

### prometheus.yml
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'ecommerce-production'
    environment: 'production'

# Alerting configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

# Load rules
rule_files:
  - /etc/prometheus/alerts/*.yml

# Scrape configurations
scrape_configs:
  # Kubernetes service discovery
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_pod_name]
        action: replace
        target_label: kubernetes_pod_name

  # Auth Service
  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:3000']
        labels:
          service: 'auth'

  # Users Service
  - job_name: 'users-service'
    static_configs:
      - targets: ['users-service:3000']
        labels:
          service: 'users'

  # Products Service
  - job_name: 'products-service'
    static_configs:
      - targets: ['products-service:3000']
        labels:
          service: 'products'

  # Orders Service
  - job_name: 'orders-service'
    static_configs:
      - targets: ['orders-service:3000']
        labels:
          service: 'orders'

  # Notifications Service
  - job_name: 'notifications-service'
    static_configs:
      - targets: ['notifications-service:3000']
        labels:
          service: 'notifications'

  # PostgreSQL Exporter
  - job_name: 'postgresql'
    static_configs:
      - targets:
          - 'postgres-exporter-shard1:9187'
          - 'postgres-exporter-shard2:9187'
          - 'postgres-exporter-shard3:9187'
          - 'postgres-exporter-shard4:9187'

  # Redis Exporter
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # RabbitMQ Exporter
  - job_name: 'rabbitmq'
    static_configs:
      - targets: ['rabbitmq-exporter:9419']

  # Node Exporter (system metrics)
  - job_name: 'node'
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - source_labels: [__address__]
        regex: '(.*):10250'
        replacement: '${1}:9100'
        target_label: __address__
```

### alerts/service-alerts.yml
```yaml
groups:
  - name: service_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
            /
            sum(rate(http_requests_total[5m])) by (service)
          ) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.service }}"
          description: "Error rate is {{ $value | humanizePercentage }} on {{ $labels.service }}"

      # High response time
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
          ) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time on {{ $labels.service }}"
          description: "P95 response time is {{ $value }}s on {{ $labels.service }}"

      # Service down
      - alert: ServiceDown
        expr: up{job=~".*-service"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.job }} has been down for more than 1 minute"

      # High CPU usage
      - alert: HighCPUUsage
        expr: |
          (
            sum(rate(container_cpu_usage_seconds_total[5m])) by (pod)
            /
            sum(container_spec_cpu_quota/container_spec_cpu_period) by (pod)
          ) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.pod }}"
          description: "CPU usage is {{ $value | humanizePercentage }} on {{ $labels.pod }}"

      # High memory usage
      - alert: HighMemoryUsage
        expr: |
          (
            sum(container_memory_working_set_bytes) by (pod)
            /
            sum(container_spec_memory_limit_bytes) by (pod)
          ) > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.pod }}"
          description: "Memory usage is {{ $value | humanizePercentage }} on {{ $labels.pod }}"

      # High queue depth (RabbitMQ)
      - alert: HighQueueDepth
        expr: rabbitmq_queue_messages_ready > 10000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High queue depth on {{ $labels.queue }}"
          description: "Queue {{ $labels.queue }} has {{ $value }} messages ready"

      # Database connection pool exhausted
      - alert: DBConnectionPoolExhausted
        expr: |
          (
            sum(pg_stat_database_numbackends) by (instance)
            /
            sum(pg_settings_max_connections) by (instance)
          ) > 0.9
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "Connection pool usage is {{ $value | humanizePercentage }} on {{ $labels.instance }}"

      # Low cache hit rate
      - alert: LowCacheHitRate
        expr: |
          (
            sum(rate(cache_hits_total[5m])) by (service)
            /
            sum(rate(cache_requests_total[5m])) by (service)
          ) < 0.8
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Low cache hit rate on {{ $labels.service }}"
          description: "Cache hit rate is {{ $value | humanizePercentage }} on {{ $labels.service }}"
```

### alerts/business-alerts.yml
```yaml
groups:
  - name: business_alerts
    interval: 30s
    rules:
      # Low order success rate
      - alert: LowOrderSuccessRate
        expr: |
          (
            sum(rate(orders_successful_total[5m]))
            /
            sum(rate(orders_total[5m]))
          ) < 0.95
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low order success rate"
          description: "Order success rate is {{ $value | humanizePercentage }}"

      # Inventory low
      - alert: InventoryLow
        expr: inventory_available{product_type="flash_sale"} < 100
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Flash sale inventory low for {{ $labels.product_id }}"
          description: "Only {{ $value }} units remaining"

      # Flash sale sold out
      - alert: FlashSaleSoldOut
        expr: inventory_available{product_type="flash_sale"} == 0
        labels:
          severity: info
        annotations:
          summary: "Flash sale product {{ $labels.product_id }} sold out"

      # High order volume spike
      - alert: OrderVolumeSpike
        expr: |
          (
            rate(orders_total[1m])
            /
            rate(orders_total[1m] offset 10m)
          ) > 5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Order volume spike detected"
          description: "Order rate increased by {{ $value }}x in the last minute"
```

---

## 3. Grafana Dashboards

### dashboard-system-overview.json
```json
{
  "dashboard": {
    "title": "System Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (service)",
            "legendFormat": "{{service}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Response Time (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))",
            "legendFormat": "{{service}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service)",
            "legendFormat": "{{service}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Active Pods",
        "targets": [
          {
            "expr": "count(kube_pod_status_phase{phase=\"Running\"}) by (namespace)",
            "legendFormat": "{{namespace}}"
          }
        ],
        "type": "stat"
      },
      {
        "title": "CPU Usage",
        "targets": [
          {
            "expr": "sum(rate(container_cpu_usage_seconds_total[5m])) by (pod)",
            "legendFormat": "{{pod}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Memory Usage",
        "targets": [
          {
            "expr": "sum(container_memory_working_set_bytes) by (pod) / 1024 / 1024 / 1024",
            "legendFormat": "{{pod}}"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

### dashboard-orders-service.json
```json
{
  "dashboard": {
    "title": "Orders Service Dashboard",
    "panels": [
      {
        "title": "Orders per Second",
        "targets": [
          {
            "expr": "sum(rate(orders_total[1m]))",
            "legendFormat": "Total Orders/sec"
          },
          {
            "expr": "sum(rate(orders_total{type=\"flash_sale\"}[1m]))",
            "legendFormat": "Flash Sale Orders/sec"
          }
        ],
        "type": "graph",
        "yaxes": [
          {
            "label": "Orders/sec",
            "format": "short"
          }
        ]
      },
      {
        "title": "Order Success Rate",
        "targets": [
          {
            "expr": "sum(rate(orders_successful_total[5m])) / sum(rate(orders_total[5m]))",
            "legendFormat": "Success Rate"
          }
        ],
        "type": "gauge",
        "thresholds": {
          "mode": "absolute",
          "steps": [
            { "value": 0, "color": "red" },
            { "value": 0.95, "color": "yellow" },
            { "value": 0.99, "color": "green" }
          ]
        }
      },
      {
        "title": "Order Processing Duration",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, sum(rate(order_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P50"
          },
          {
            "expr": "histogram_quantile(0.95, sum(rate(order_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P95"
          },
          {
            "expr": "histogram_quantile(0.99, sum(rate(order_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P99"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Queue Depth",
        "targets": [
          {
            "expr": "rabbitmq_queue_messages_ready{queue=\"orders\"}",
            "legendFormat": "Ready Messages"
          },
          {
            "expr": "rabbitmq_queue_messages_unacknowledged{queue=\"orders\"}",
            "legendFormat": "Processing"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Inventory Status",
        "targets": [
          {
            "expr": "inventory_available",
            "legendFormat": "{{product_id}}"
          }
        ],
        "type": "stat"
      }
    ]
  }
}
```

### dashboard-database.json
```json
{
  "dashboard": {
    "title": "Database Performance",
    "panels": [
      {
        "title": "Query Latency (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(pg_stat_statements_seconds_bucket[5m])) by (le, datname))",
            "legendFormat": "{{datname}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Active Connections",
        "targets": [
          {
            "expr": "sum(pg_stat_database_numbackends) by (instance)",
            "legendFormat": "{{instance}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Connection Pool Usage",
        "targets": [
          {
            "expr": "sum(pg_stat_database_numbackends) by (instance) / sum(pg_settings_max_connections) by (instance)",
            "legendFormat": "{{instance}}"
          }
        ],
        "type": "gauge"
      },
      {
        "title": "Cache Hit Rate",
        "targets": [
          {
            "expr": "sum(rate(cache_hits_total[5m])) / sum(rate(cache_requests_total[5m]))",
            "legendFormat": "Cache Hit Rate"
          }
        ],
        "type": "gauge"
      },
      {
        "title": "Replication Lag",
        "targets": [
          {
            "expr": "pg_replication_lag_seconds",
            "legendFormat": "{{instance}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Transaction Rate",
        "targets": [
          {
            "expr": "sum(rate(pg_stat_database_xact_commit[5m])) by (datname)",
            "legendFormat": "Commits - {{datname}}"
          },
          {
            "expr": "sum(rate(pg_stat_database_xact_rollback[5m])) by (datname)",
            "legendFormat": "Rollbacks - {{datname}}"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

---

## 4. Run Load Tests

### test-commands.sh
```bash
#!/bin/bash

# Set environment variables
export BASE_URL="https://api.yourapp.com"
export FLASH_SALE_PRODUCT_ID="flash-product-123"

# Run flash sale test
echo "Running flash sale load test..."
k6 run \
  --out influxdb=http://localhost:8086/k6 \
  flash-sale-test.js

# Run stress test
echo "Running stress test..."
k6 run \
  --out influxdb=http://localhost:8086/k6 \
  stress-test.js

# Run soak test (long-running)
echo "Running soak test (2 hours)..."
k6 run \
  --out influxdb=http://localhost:8086/k6 \
  soak-test.js
```

---

## 5. Expected Results

### Target Metrics (Flash Sale - 10k orders/sec)

```
Load Test Results:
├── Virtual Users: 200,000
├── Duration: 5 minutes (peak)
├── Orders Created: 3,000,000
├── Success Rate: 99.5%
├── Response Time:
│   ├── P50: 120ms
│   ├── P95: 450ms
│   └── P99: 800ms
├── Throughput: 10,000 orders/sec
├── Error Rate: 0.5%
└── HTTP Errors: 0.1%

System Resources:
├── Order Service Pods: 50
├── CPU Usage: 75% (average)
├── Memory Usage: 80% (average)
├── Database:
│   ├── Query Latency (P95): 45ms
│   ├── Connection Pool: 85% utilized
│   └── Replication Lag: <2 seconds
├── Redis:
│   ├── Cache Hit Rate: 92%
│   ├── Ops/sec: 50,000
│   └── Memory Usage: 60%
└── RabbitMQ:
    ├── Queue Depth: 5,000 (peak)
    ├── Consumers: 100
    └── Processing Rate: 10,000 msg/sec
```

---

## Summary

This configuration provides:

1. **Comprehensive load testing** with k6 (normal, stress, soak tests)
2. **Prometheus monitoring** with service discovery
3. **Alerting rules** for system and business metrics
4. **Grafana dashboards** for visualization
5. **Target metrics** to validate system performance

Deploy this setup to prove your system can handle:
- ✅ 10,000 orders/second
- ✅ 200,000 concurrent users
- ✅ Sub-500ms response time (P95)
- ✅ 99.5% success rate

Good luck! 🚀
