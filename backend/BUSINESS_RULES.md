# Business Rules Implementation

This document outlines all the business rules implemented in the Gateway Manager backend application.

## 🏗️ Core Business Rules

### 1. Gateway Device Limit
**Rule**: A gateway can have at most 10 devices.

**Implementation**:
- Enforced in `GatewaysService.attachDevice()` method
- Validates device count before allowing new device attachment
- Returns clear error message with current device count
- Configurable via `MAX_DEVICES_PER_GATEWAY` constant

**Error Response**:
```json
{
  "message": "Maximum 10 devices allowed per gateway. Current count: 10",
  "error": "Bad Request",
  "statusCode": 400
}
```

**API Endpoints**:
- `GET /api/gateways/:id/device-count` - Get current device count
- `GET /api/gateways/:id/can-accept-device` - Check if gateway can accept more devices
- `GET /api/gateways/:id/capacity-info` - Get comprehensive capacity information

### 2. Global Device UID Uniqueness
**Rule**: A device UID must be globally unique across all gateways.

**Implementation**:
- Enforced in `GatewaysService.attachDevice()` method
- Database-level unique constraint on `peripheral_devices.uid` column
- Service-level validation before device creation
- Returns detailed error message with conflicting UID

**Error Response**:
```json
{
  "message": "Device UID 12345 must be globally unique. UID already exists.",
  "error": "Conflict",
  "statusCode": 409
}
```

**Database Constraint**:
```sql
CREATE UNIQUE INDEX ON peripheral_devices (uid);
```

### 3. Gateway Deletion - Device Orphaning
**Rule**: When deleting a gateway, set `device.gateway_id = NULL` (orphan devices).

**Implementation**:
- Enforced in `GatewaysService.remove()` method
- Explicitly sets `gateway = null` for all attached devices
- Entity configuration: `onDelete: 'SET NULL'` as backup
- Returns count of orphaned devices
- Logs deletion action with orphaned device count

**Response**:
```json
{
  "id": "gateway-uuid",
  "removed": true,
  "orphanedDevices": 3,
  "message": "Gateway deleted. 3 devices have been orphaned."
}
```

**Entity Configuration**:
```typescript
@ManyToOne(() => Gateway, (g) => g.devices, { 
  onDelete: 'SET NULL', 
  nullable: true 
})
gateway: Gateway | null;
```

### 4. Serial Number Immutability
**Rule**: On gateway updates, `serial_number` cannot change.

**Implementation**:
- Enforced at DTO level using `OmitType` to exclude `serial_number`
- Service-level validation as backup
- Clear error message when attempting to update serial number

**Error Response**:
```json
{
  "message": "serial_number cannot be updated",
  "error": "Bad Request",
  "statusCode": 400
}
```

**DTO Implementation**:
```typescript
export class UpdateGatewayDto extends OmitType(
  PartialType(CreateGatewayDto), 
  ['serial_number'] as const
) {}
```

## 🔒 Additional Business Rules

### 5. Gateway Uniqueness Constraints
**Rule**: Gateway serial numbers and IPv4 addresses must be unique.

**Implementation**:
- Database-level unique indexes
- Service-level validation before creation
- Conflict resolution with clear error messages

**Database Constraints**:
```sql
CREATE UNIQUE INDEX ON gateways (serial_number);
CREATE UNIQUE INDEX ON gateways (ipv4_address);
```

### 6. Device Validation Rules
**Rule**: Device UIDs must be positive numbers, vendor names are required.

**Implementation**:
- DTO-level validation using class-validator decorators
- Service-level validation as backup
- Clear error messages for validation failures

**Validation Decorators**:
```typescript
@IsNumber()
@IsPositive({ message: 'UID must be a positive number' })
@IsNotEmpty({ message: 'UID is required' })
uid: number;

@IsString()
@IsNotEmpty({ message: 'Vendor is required' })
vendor: string;
```

## 🧪 Testing Business Rules

### Running Tests
```bash
# Run all tests
npm run test

# Run business rules tests specifically
npm run test:e2e business-rules.test.ts

# Run with coverage
npm run test:cov
```

### Test Coverage
The business rules are covered by comprehensive e2e tests that verify:
- Gateway uniqueness constraints
- Device limit enforcement
- UID uniqueness validation
- Serial number immutability
- Device orphaning on gateway deletion
- Capacity information endpoints

## 📊 API Endpoints for Business Rules

### Gateway Management
- `POST /api/gateways` - Create gateway (enforces uniqueness)
- `PATCH /api/gateways/:id` - Update gateway (prevents serial number changes)
- `DELETE /api/gateways/:id` - Delete gateway (orphans devices)

### Device Management
- `POST /api/gateways/:id/devices` - Attach device (enforces limits and UID uniqueness)
- `DELETE /api/gateways/:id/devices/:deviceId` - Detach device

### Capacity Information
- `GET /api/gateways/:id/device-count` - Get current device count
- `GET /api/gateways/:id/can-accept-device` - Check if gateway can accept more devices
- `GET /api/gateways/:id/capacity-info` - Get comprehensive capacity information

## 🚨 Error Handling

### Validation Errors
All business rule violations return consistent error responses with:
- Clear error messages
- Appropriate HTTP status codes
- Structured response format
- Timestamp and request path information

### Error Response Format
```json
{
  "message": ["Detailed error message"],
  "error": "Error Type",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/gateways"
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=gateway_db

# Application configuration
NODE_ENV=development
```

### Database Synchronization
- **Development**: `synchronize: true` for quick setup
- **Production**: `synchronize: false` with proper migrations

## 📝 Logging

All business rule operations are logged with:
- Action type (CREATED, UPDATED, DELETED, DEVICE_ATTACHED, DEVICE_REMOVED)
- Gateway ID
- Relevant details (device count, orphaned devices, etc.)
- Timestamp

## 🔄 Future Enhancements

### Planned Improvements
1. **Cascade Delete Option**: Allow configuration between orphaning and cascade deletion
2. **Device Reassignment**: Allow orphaned devices to be reassigned to other gateways
3. **Bulk Operations**: Support for bulk device attachment/detachment
4. **Audit Trail**: Enhanced logging for compliance requirements
5. **Rate Limiting**: Prevent abuse of API endpoints

### Configuration Options
- Configurable device limits per gateway type
- Flexible deletion strategies (orphan vs. cascade)
- Custom validation rules per environment
