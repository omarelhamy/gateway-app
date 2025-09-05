import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewaysModule } from './gateways/gateways.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Repository } from 'typeorm';
import { Gateway } from './gateways/entities/gateway.entity';
import { PeripheralDevice } from './gateways/entities/peripheral-device.entity';
import { DeviceType } from './gateways/entities/device-type.entity';
import * as request from 'supertest';

describe('Business Rules (e2e)', () => {
  let app: INestApplication;
  let gatewayRepo: Repository<Gateway>;
  let deviceRepo: Repository<PeripheralDevice>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Gateway, PeripheralDevice, DeviceType],
          synchronize: true,
          dropSchema: true,
          logging: false, // Disable logging for tests
        }),
        GatewaysModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    
    await app.init();
    
    gatewayRepo = moduleFixture.get('GatewayRepository');
    deviceRepo = moduleFixture.get('PeripheralDeviceRepository');
  }, 30000); // 30 second timeout

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 10000); // 10 second timeout

  beforeEach(async () => {
    await deviceRepo.clear();
    await gatewayRepo.clear();
  });

  describe('Gateway Business Rules', () => {
    it('should enforce unique serial numbers', async () => {
      const gateway1 = {
        serial_number: 'GW001',
        name: 'Gateway 1',
        ipv4_address: '192.168.1.1',
        status: 'active'
      };

      const gateway2 = {
        serial_number: 'GW001', // Same serial number
        name: 'Gateway 2',
        ipv4_address: '192.168.1.2',
        status: 'active'
      };

      // Create first gateway
      await request(app.getHttpServer())
        .post('/api/gateways')
        .send(gateway1)
        .expect(201);

      // Try to create second gateway with same serial number
      await request(app.getHttpServer())
        .post('/api/gateways')
        .send(gateway2)
        .expect(409); // Conflict
    });

    it('should enforce unique IPv4 addresses', async () => {
      const gateway1 = {
        serial_number: 'GW001',
        name: 'Gateway 1',
        ipv4_address: '192.168.1.1',
        status: 'active'
      };

      const gateway2 = {
        serial_number: 'GW002',
        name: 'Gateway 2',
        ipv4_address: '192.168.1.1', // Same IP address
        status: 'active'
      };

      // Create first gateway
      await request(app.getHttpServer())
        .post('/api/gateways')
        .send(gateway1)
        .expect(201);

      // Try to create second gateway with same IP
      await request(app.getHttpServer())
        .post('/api/gateways')
        .send(gateway2)
        .expect(409); // Conflict
    });

    it('should prevent serial number updates', async () => {
      // Create gateway
      const createResponse = await request(app.getHttpServer())
        .post('/api/gateways')
        .send({
          serial_number: 'GW001',
          name: 'Gateway 1',
          ipv4_address: '192.168.1.1',
          status: 'active'
        })
        .expect(201);

      const gatewayId = createResponse.body.id;

      // Try to update serial number (should be ignored by DTO)
      const updateResponse = await request(app.getHttpServer())
        .patch(`/api/gateways/${gatewayId}`)
        .send({ serial_number: 'GW002' })
        .expect(200); // OK - serial_number is ignored by DTO

      // Verify that serial_number was not actually updated
      const getResponse = await request(app.getHttpServer())
        .get(`/api/gateways/${gatewayId}`)
        .expect(200);
      
      expect(getResponse.body.serial_number).toBe('GW001'); // Should remain unchanged
    });
  });

  describe('Device Business Rules', () => {
    it('should enforce global unique UIDs', async () => {
      // Create gateway
      const createResponse = await request(app.getHttpServer())
        .post('/api/gateways')
        .send({
          serial_number: 'GW001',
          name: 'Gateway 1',
          ipv4_address: '192.168.1.1',
          status: 'active'
        })
        .expect(201);

      const gatewayId = createResponse.body.id;

      // Create first device
      await request(app.getHttpServer())
        .post(`/api/gateways/${gatewayId}/devices`)
        .send({
          uid: 12345,
          vendor: 'Vendor 1',
          status: 'online'
        })
        .expect(201);

      // Try to create second device with same UID
      await request(app.getHttpServer())
        .post(`/api/gateways/${gatewayId}/devices`)
        .send({
          uid: 12345, // Same UID
          vendor: 'Vendor 2',
          status: 'online'
        })
        .expect(409); // Conflict
    });

    it('should enforce maximum 10 devices per gateway', async () => {
      // Create gateway
      const createResponse = await request(app.getHttpServer())
        .post('/api/gateways')
        .send({
          serial_number: 'GW001',
          name: 'Gateway 1',
          ipv4_address: '192.168.1.1',
          status: 'active'
        })
        .expect(201);

      const gatewayId = createResponse.body.id;

      // Add 10 devices
      for (let i = 1; i <= 10; i++) {
        await request(app.getHttpServer())
          .post(`/api/gateways/${gatewayId}/devices`)
          .send({
            uid: 10000 + i,
            vendor: `Vendor ${i}`,
            status: 'online'
          })
          .expect(201);
      }

      // Try to add 11th device
      await request(app.getHttpServer())
        .post(`/api/gateways/${gatewayId}/devices`)
        .send({
          uid: 20000,
          vendor: 'Vendor 11',
          status: 'online'
        })
        .expect(400); // Bad Request - Max devices reached
    });
  });

  describe('Gateway Deletion Business Rules', () => {
    it('should orphan devices when gateway is deleted', async () => {
      // Create gateway
      const createResponse = await request(app.getHttpServer())
        .post('/api/gateways')
        .send({
          serial_number: 'GW001',
          name: 'Gateway 1',
          ipv4_address: '192.168.1.1',
          status: 'active'
        })
        .expect(201);

      const gatewayId = createResponse.body.id;

      // Add a device
      await request(app.getHttpServer())
        .post(`/api/gateways/${gatewayId}/devices`)
        .send({
          uid: 12345,
          vendor: 'Vendor 1',
          status: 'online'
        })
        .expect(201);

      // Delete gateway
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/gateways/${gatewayId}`)
        .expect(200);

      expect(deleteResponse.body.orphanedDevices).toBe(1);
      expect(deleteResponse.body.message).toContain('1 devices have been orphaned');
    });
  });

  describe('Capacity Information Endpoints', () => {
    it('should provide accurate device count information', async () => {
      // Create gateway
      const createResponse = await request(app.getHttpServer())
        .post('/api/gateways')
        .send({
          serial_number: 'GW001',
          name: 'Gateway 1',
          ipv4_address: '192.168.1.1',
          status: 'active'
        })
        .expect(201);

      const gatewayId = createResponse.body.id;

      // Check initial capacity
      const capacityResponse = await request(app.getHttpServer())
        .get(`/api/gateways/${gatewayId}/capacity-info`)
        .expect(200);

      expect(capacityResponse.body.currentDeviceCount).toBe(0);
      expect(capacityResponse.body.canAcceptMore).toBe(true);
      expect(capacityResponse.body.remainingCapacity).toBe(10);

      // Add a device
      await request(app.getHttpServer())
        .post(`/api/gateways/${gatewayId}/devices`)
        .send({
          uid: 12345,
          vendor: 'Vendor 1',
          status: 'online'
        })
        .expect(201);

      // Check updated capacity
      const updatedCapacityResponse = await request(app.getHttpServer())
        .get(`/api/gateways/${gatewayId}/capacity-info`)
        .expect(200);

      expect(updatedCapacityResponse.body.currentDeviceCount).toBe(1);
      expect(updatedCapacityResponse.body.canAcceptMore).toBe(true);
      expect(updatedCapacityResponse.body.remainingCapacity).toBe(9);
    });
  });
});
