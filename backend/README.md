# Gateway Manager Backend

NestJS backend for IoT gateway management.

## Features

- Gateway CRUD operations
- Device management
- Business rules enforcement
- RESTful API with validation

## Installation

```bash
npm install
```

## Database Setup

```bash
# Create database
createdb gateway_db

# Run migrations
psql -d gateway_db -f ../docker/postgres/init-scripts/001_initial_schema.sql
psql -d gateway_db -f ../docker/postgres/init-scripts/002_test_data.sql
```

## Development

```bash
npm run start:dev
```

## Testing

```bash
npm test
```

## Environment Variables

Create `.env` file:

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=gateway_db
PORT=3000
```