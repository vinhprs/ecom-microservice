# System Architecture Diagrams

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Web[Web Browser]
        Mobile[Mobile App]
        API_Client[API Client]
    end
    
    subgraph "Edge Layer"
        CloudFlare[CloudFlare CDN]
        WAF[AWS WAF]
    end
    
    subgraph "Load Balancer"
        ALB[AWS Application Load Balancer]
    end
    
    subgraph "Kubernetes Cluster - EKS"
        subgraph "API Gateway"
            Kong[Kong Gateway<br/>Rate Limiting<br/>Circuit Breaker]
        end
        
        subgraph "Microservices"
            Auth[Auth Service<br/>3-10 pods]
            Users[Users Service<br/>3-10 pods]
            Products[Products Service<br/>5-20 pods]
            Orders[Orders Service<br/>10-50 pods]
            Notifications[Notification Service<br/>3-15 pods]
        end
        
        subgraph "Monitoring"
            Prometheus[Prometheus]
            Grafana[Grafana]
            Jaeger[Jaeger Tracing]
        end
    end
    
    subgraph "Data Layer"
        subgraph "PostgreSQL Cluster"
            PG_Shard1[(Shard 1<br/>Master + 2 Replicas)]
            PG_Shard2[(Shard 2<br/>Master + 2 Replicas)]
            PG_Shard3[(Shard 3<br/>Master + 2 Replicas)]
            PG_Shard4[(Shard 4<br/>Master + 2 Replicas)]
        end
        
        subgraph "Cache Layer"
            Redis_Master1[(Redis Master 1)]
            Redis_Replica1[(Redis Replica 1)]
            Redis_Master2[(Redis Master 2)]
            Redis_Replica2[(Redis Replica 2)]
            Redis_Master3[(Redis Master 3)]
            Redis_Replica3[(Redis Replica 3)]
        end
        
        subgraph "Message Queue"
            RabbitMQ[RabbitMQ Cluster<br/>3 Nodes]
            Kafka[Kafka Cluster<br/>3 Brokers]
        end
        
        subgraph "Connection Pooling"
            PgBouncer[PgBouncer<br/>Connection Pool]
        end
    end
    
    Web --> CloudFlare
    Mobile --> CloudFlare
    API_Client --> CloudFlare
    CloudFlare --> WAF
    WAF --> ALB
    ALB --> Kong
    
    Kong --> Auth
    Kong --> Users
    Kong --> Products
    Kong --> Orders
    Kong --> Notifications
    
    Auth --> Redis_Master1
    Users --> PgBouncer
    Products --> PgBouncer
    Orders --> PgBouncer
    
    PgBouncer --> PG_Shard1
    PgBouncer --> PG_Shard2
    PgBouncer --> PG_Shard3
    PgBouncer --> PG_Shard4
    
    Products --> Redis_Master2
    Orders --> Redis_Master3
    
    Orders --> RabbitMQ
    Orders --> Kafka
    Notifications --> RabbitMQ
    
    Auth -.-> Prometheus
    Users -.-> Prometheus
    Products -.-> Prometheus
    Orders -.-> Prometheus
    Notifications -.-> Prometheus
    
    Prometheus --> Grafana
    
    Kong -.-> Jaeger
    Auth -.-> Jaeger
    Users -.-> Jaeger
    Products -.-> Jaeger
    Orders -.-> Jaeger
    
    style Orders fill:#ff6b6b
    style Redis_Master3 fill:#ffd93d
    style RabbitMQ fill:#95e1d3
    style Kafka fill:#a8e6cf
```

## Flash Sale Order Flow

```mermaid
sequenceDiagram
    participant Client
    participant ALB as Load Balancer
    participant Gateway as API Gateway
    participant Order as Order Service
    participant Redis as Redis Cache
    participant Queue as RabbitMQ
    participant DB as PostgreSQL
    participant Notif as Notification Service
    participant Kafka
    
    Client->>ALB: POST /orders/flash-sale/:productId
    ALB->>Gateway: Forward request
    
    Note over Gateway: Rate Limiting<br/>Max 10 req/min/user
    
    Gateway->>Order: Create flash sale order
    
    Note over Order: Check idempotency key
    Order->>Redis: GET idempotency_key
    
    alt Order exists
        Redis-->>Order: Order ID found
        Order-->>Client: 200 OK (existing order)
    else New order
        Note over Order: Atomic inventory check
        Order->>Redis: DECR inventory:productId
        
        alt Inventory available
            Redis-->>Order: Remaining: 99
            
            Note over Order: Create order async
            Order->>Queue: Publish OrderCreated event
            Queue-->>Order: ACK
            
            Order->>Redis: SET idempotency_key
            Order-->>Client: 201 Created<br/>{orderId, status: pending}
            
            Note over Queue: Background processing
            Queue->>Order: Consume OrderCreated
            
            par Process order
                Order->>DB: INSERT order
                DB-->>Order: Order saved
                
                Order->>Notif: Send order confirmation
                Notif-->>Order: Notification sent
                
                Order->>Kafka: Publish OrderCompleted event
                Kafka-->>Order: Event stored
            end
            
            Order->>DB: UPDATE order status=completed
            
        else Out of stock
            Redis-->>Order: Remaining: -1
            Order->>Redis: INCR inventory:productId (rollback)
            Order-->>Client: 409 Conflict<br/>{error: "Out of stock"}
        end
    end
```

## Database Sharding Strategy

```mermaid
graph TB
    subgraph "Application Layer"
        App[Order Service]
    end
    
    subgraph "Sharding Logic"
        Hash[Hash Function<br/>MD5 or MurmurHash]
        Modulo[Modulo Operation<br/>hash % 4]
    end
    
    subgraph "Shard Routing"
        Router[Shard Router]
    end
    
    subgraph "Database Shards"
        Shard0[(Shard 0<br/>user_id % 4 = 0<br/>25% users)]
        Shard1[(Shard 1<br/>user_id % 4 = 1<br/>25% users)]
        Shard2[(Shard 2<br/>user_id % 4 = 2<br/>25% users)]
        Shard3[(Shard 3<br/>user_id % 4 = 3<br/>25% users)]
    end
    
    App -->|user_id: abc-123| Hash
    Hash -->|hash: 3f4a5b...| Modulo
    Modulo -->|shard_id: 2| Router
    Router -->|Route to Shard 2| Shard2
    
    App -.->|Different users| Shard0
    App -.->|Different users| Shard1
    App -.->|Different users| Shard3
    
    style Shard2 fill:#95e1d3
```

## Auto-Scaling Flow

```mermaid
stateDiagram-v2
    [*] --> Normal: 10 pods
    
    Normal --> ScalingUp: CPU > 70%<br/>or<br/>Queue depth > 1000
    
    ScalingUp --> HighLoad: 50 pods
    
    HighLoad --> ScalingDown: CPU < 50%<br/>and<br/>Queue depth < 100<br/>(for 5 min)
    
    ScalingDown --> Normal: 10 pods
    
    Normal --> FlashSale: Flash sale starts
    
    FlashSale --> HighLoad: Pre-scale to 40 pods
    
    note right of Normal
        Normal load
        1k orders/sec
        50k users
    end note
    
    note right of HighLoad
        Peak load
        10k orders/sec
        200k users
    end note
```

## Read/Write Splitting

```mermaid
graph LR
    subgraph "Application"
        Service[Order Service]
    end
    
    subgraph "Connection Pool"
        PgBouncer[PgBouncer]
    end
    
    subgraph "PostgreSQL Cluster"
        Master[(Master<br/>Write Operations)]
        Replica1[(Replica 1<br/>Read Operations)]
        Replica2[(Replica 2<br/>Read Operations)]
    end
    
    Service -->|Write<br/>INSERT/UPDATE/DELETE| PgBouncer
    PgBouncer -->|Write| Master
    
    Service -->|Read<br/>SELECT| PgBouncer
    PgBouncer -->|Load balance| Replica1
    PgBouncer -->|Load balance| Replica2
    
    Master -.->|Replication| Replica1
    Master -.->|Replication| Replica2
    
    style Master fill:#ff6b6b
    style Replica1 fill:#95e1d3
    style Replica2 fill:#95e1d3
```

## Cache Strategy

```mermaid
graph TB
    subgraph "Request Flow"
        Client[Client Request]
        Service[Product Service]
    end
    
    subgraph "Cache Layer"
        Redis[(Redis Cache)]
    end
    
    subgraph "Database"
        DB[(PostgreSQL)]
    end
    
    Client -->|1. GET /products/:id| Service
    Service -->|2. Check cache| Redis
    
    Redis -->|3a. Cache HIT| Service
    Service -->|4a. Return data| Client
    
    Redis -.->|3b. Cache MISS| Service
    Service -.->|4b. Query DB| DB
    DB -.->|5b. Return data| Service
    Service -.->|6b. Update cache<br/>TTL=1h| Redis
    Service -.->|7b. Return data| Client
    
    style Redis fill:#ffd93d
```

## Monitoring & Alerting

```mermaid
graph TB
    subgraph "Services"
        Auth[Auth Service]
        Users[Users Service]
        Products[Products Service]
        Orders[Orders Service]
        Notif[Notification Service]
    end
    
    subgraph "Metrics Collection"
        Prometheus[Prometheus<br/>Metrics Server]
    end
    
    subgraph "Visualization"
        Grafana[Grafana Dashboards]
    end
    
    subgraph "Alerting"
        AlertManager[Alert Manager]
        Slack[Slack]
        PagerDuty[PagerDuty]
    end
    
    subgraph "Distributed Tracing"
        Jaeger[Jaeger]
    end
    
    subgraph "Log Aggregation"
        ELK[ELK Stack<br/>Elasticsearch<br/>Logstash<br/>Kibana]
    end
    
    Auth -.->|Expose metrics| Prometheus
    Users -.->|Expose metrics| Prometheus
    Products -.->|Expose metrics| Prometheus
    Orders -.->|Expose metrics| Prometheus
    Notif -.->|Expose metrics| Prometheus
    
    Auth -.->|Send traces| Jaeger
    Users -.->|Send traces| Jaeger
    Products -.->|Send traces| Jaeger
    Orders -.->|Send traces| Jaeger
    Notif -.->|Send traces| Jaeger
    
    Auth -.->|Send logs| ELK
    Users -.->|Send logs| ELK
    Products -.->|Send logs| ELK
    Orders -.->|Send logs| ELK
    Notif -.->|Send logs| ELK
    
    Prometheus -->|Query metrics| Grafana
    Prometheus -->|Trigger alerts| AlertManager
    AlertManager -->|Notify| Slack
    AlertManager -->|Notify| PagerDuty
```

## Event-Driven Architecture (Kafka)

```mermaid
graph LR
    subgraph "Producers"
        Order[Order Service]
        User[User Service]
        Product[Product Service]
    end
    
    subgraph "Kafka Cluster"
        Topic1[order-events<br/>12 partitions]
        Topic2[user-events<br/>8 partitions]
        Topic3[product-events<br/>8 partitions]
    end
    
    subgraph "Consumers"
        Analytics[Analytics Service]
        Notification[Notification Service]
        Inventory[Inventory Service]
        Reporting[Reporting Service]
    end
    
    Order -->|OrderCreated<br/>OrderUpdated<br/>OrderCancelled| Topic1
    User -->|UserRegistered<br/>UserUpdated| Topic2
    Product -->|ProductCreated<br/>PriceChanged| Topic3
    
    Topic1 --> Analytics
    Topic1 --> Notification
    Topic1 --> Inventory
    
    Topic2 --> Analytics
    Topic2 --> Reporting
    
    Topic3 --> Analytics
    Topic3 --> Inventory
    
    style Topic1 fill:#a8e6cf
    style Topic2 fill:#a8e6cf
    style Topic3 fill:#a8e6cf
```

## Deployment Pipeline

```mermaid
graph LR
    subgraph "Development"
        Dev[Developer]
        Git[GitHub]
    end
    
    subgraph "CI Pipeline"
        Build[Build & Test]
        Docker[Build Docker Image]
        Push[Push to ECR]
    end
    
    subgraph "CD Pipeline"
        Deploy[Deploy to K8s]
        Test[Smoke Tests]
        Rollout[Rolling Update]
    end
    
    subgraph "Kubernetes"
        Staging[Staging Environment]
        Production[Production Environment]
    end
    
    subgraph "Monitoring"
        Monitor[Health Checks]
        Rollback[Auto Rollback]
    end
    
    Dev -->|Push code| Git
    Git -->|Trigger webhook| Build
    Build -->|Tests passed| Docker
    Docker -->|Push image| Push
    Push -->|Deploy manifest| Deploy
    Deploy -->|Deploy to| Staging
    Staging -->|Run tests| Test
    Test -->|Tests passed| Rollout
    Rollout -->|Rolling update| Production
    Production -->|Monitor health| Monitor
    Monitor -.->|Health check failed| Rollback
    Rollback -.->|Revert to previous| Production
    
    style Production fill:#95e1d3
```
