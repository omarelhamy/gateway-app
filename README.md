# Gateway Manager

A simple IoT gateway management system with React frontend and NestJS backend.

## Project Structure

```
gateway-app/
├── backend/          # NestJS Backend API
├── frontend-new/     # React Frontend
├── docker/           # Database configuration
└── docker-compose files
```

## Quick Start

### Local Development

1. **Backend Setup**
```bash
cd backend
npm install
npm run start:dev
```

2. **Frontend Setup**
```bash
cd frontend-new
npm install
npm run dev
```

3. **Database Setup**
```bash
# Create PostgreSQL database
createdb gateway_db

# Run migrations
cd backend
psql -d gateway_db -f ../docker/postgres/init-scripts/001_initial_schema.sql
psql -d gateway_db -f ../docker/postgres/init-scripts/002_test_data.sql
```

## Features

- **Gateway Management**: Create, read, update, delete gateways
- **Device Management**: Attach/detach devices to gateways
- **Business Rules**:
  - Maximum 10 devices per gateway
  - Globally unique device UIDs
  - Device orphaning on gateway deletion
  - Immutable gateway serial numbers

## API Endpoints

- `GET /api/gateways` - List all gateways
- `POST /api/gateways` - Create gateway
- `GET /api/gateways/:id` - Get gateway details
- `PATCH /api/gateways/:id` - Update gateway
- `DELETE /api/gateways/:id` - Delete gateway
- `POST /api/gateways/:id/devices` - Add device
- `DELETE /api/gateways/:id/devices/:deviceId` - Remove device

## Testing

```bash
cd backend
npm test
```

## Docker (Optional)

```bash
# Development
docker-compose -f docker-compose.dev.yml up -d

# Production
docker-compose up -d
```