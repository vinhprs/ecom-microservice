# 1. Create Auth Service (Public - No JWT required)

curl --location 'http://localhost:8001/services' \
--header 'Content-Type: application/json' \
--data '{
"name": "auth-service",
"url": "http://host.docker.internal:3001"
}'

# Create Auth Route (PUBLIC)

curl --location 'http://localhost:8001/services/auth-service/routes' \
--header 'Content-Type: application/json' \
--data '{
"paths": [
"/api/v1/auth"
],
"name": "auth-route",
"strip_path": false
}'

# 2. Create Users Service (Protected)

curl --location 'http://localhost:8001/services' \
--header 'Content-Type: application/json' \
--data '{
"name": "users-service",
"url": "http://host.docker.internal:3002"
}'

# Create Users Route (Protected)

curl --location 'http://localhost:8001/services/users-service/routes' \
--header 'Content-Type: application/json' \
--data '{
"paths": [
"/api/v1/users"
],
"name": "users-route",
"strip_path": false
}'

# 3. Create Products Service (Protected)

curl --location 'http://localhost:8001/services' \
--header 'Content-Type: application/json' \
--data '{
"name": "products-service",
"url": "http://host.docker.internal:3003"
}'

# Create Users Route (Protected)

curl --location 'http://localhost:8001/services/products-service/routes' \
--header 'Content-Type: application/json' \
--data '{
"paths": [
"/api/v1/products"
],
"name": "products-route",
"strip_path": false
}'

# 4. Create Orders Service (Protected)

curl --location 'http://localhost:8001/services' \
--header 'Content-Type: application/json' \
--data '{
"name": "orders-service",
"url": "http://host.docker.internal:3004"
}'

# Create Users Route (Protected)

curl --location 'http://localhost:8001/services/orders-service/routes' \
--header 'Content-Type: application/json' \
--data '{
"paths": [
"/api/v1/orders"
],
"name": "orders-route",
"strip_path": false
}'

# 5. Create Notifications Service (Protected)

curl --location 'http://localhost:8001/services' \
--header 'Content-Type: application/json' \
--data '{
"name": "notifications-service",
"url": "http://host.docker.internal:3005"
}'

# Create Users Route (Protected)

curl --location 'http://localhost:8001/services/notifications-service/routes' \
--header 'Content-Type: application/json' \
--data '{
"paths": [
"/api/v1/notifications"
],
"name": "notifications-route",
"strip_path": false
}'

# 6. Enable CORS Plugin (Global)

curl --location 'http://localhost:8001/plugins' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'name=cors' \
--data-urlencode 'config.origins=\*' \
--data-urlencode 'config.methods=GET' \
--data-urlencode 'config.methods=POST' \
--data-urlencode 'config.methods=PUT' \
--data-urlencode 'config.methods=DELETE' \
--data-urlencode 'config.methods=PATCH' \
--data-urlencode 'config.methods=OPTIONS' \
--data-urlencode 'config.headers=Accept' \
--data-urlencode 'config.headers=Accept-Version' \
--data-urlencode 'config.headers=Content-Length' \
--data-urlencode 'config.headers=Content-MD5' \
--data-urlencode 'config.headers=Content-Type' \
--data-urlencode 'config.headers=Date' \
--data-urlencode 'config.headers=Authorization' \
--data-urlencode 'config.exposed_headers=X-Auth-Token' \
--data-urlencode 'config.credentials=true' \
--data-urlencode 'config.max_age=3600'

# 7. Enable Request ID Plugin (Global)

curl --location 'http://localhost:8001/plugins' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'name=correlation-id' \
--data-urlencode 'config.header_name=X-Request-Id' \
--data-urlencode 'config.generator=uuid' \
--data-urlencode 'config.echo_downstream=true'

# 8. Enable Rate Limiting Plugin (Global)

curl -s -X POST http://localhost:8001/plugins \
 --data "name=rate-limiting" \
 --data "config.second=100" \
 --data "config.minute=1000" \
 --data "config.hour=10000" \
 --data "config.policy=local"

# 9. Enable Prometheus Plugin (Global)

curl --location 'http://localhost:8001/plugins' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'name=prometheus'

# 10. Jwt Plugin
