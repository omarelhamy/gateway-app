import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gateway } from './entities/gateway.entity';
import { PeripheralDevice } from './entities/peripheral-device.entity';
import { CreateGatewayDto } from './dto/create-gateway.dto';
import { UpdateGatewayDto } from './dto/update-gateway.dto';
import { CreateDeviceDto } from './dto/create-device.dto';

@Injectable()
export class GatewaysService {
  private readonly MAX_DEVICES_PER_GATEWAY = 10;

  constructor(
    @InjectRepository(Gateway) private gwRepo: Repository<Gateway>,
    @InjectRepository(PeripheralDevice) private devRepo: Repository<PeripheralDevice>,
  ) {}


  async createGateway(dto: CreateGatewayDto) {
    // Check if serial number already exists
    const existingGateway = await this.gwRepo.findOne({ 
      where: { serial_number: dto.serial_number } 
    });
    if (existingGateway) {
      throw new ConflictException('Gateway with this serial number already exists');
    }

    // Check if IPv4 address already exists
    const existingIpGateway = await this.gwRepo.findOne({ 
      where: { ipv4_address: dto.ipv4_address } 
    });
    if (existingIpGateway) {
      throw new ConflictException('Gateway with this IPv4 address already exists');
    }

    const gw = this.gwRepo.create(dto);
    return await this.gwRepo.save(gw);
  }

  findAll() {
    return this.gwRepo.find({ relations: ['devices'] });
  }

  async findOne(id: string) {
    const gw = await this.gwRepo.findOne({ where: { id }, relations: ['devices'] });
    if (!gw) throw new NotFoundException('Gateway not found');
    return gw;
  }

  async update(id: string, dto: UpdateGatewayDto) {
    // Business Rule: serial_number cannot be updated
    // This is already enforced at the DTO level using OmitType
    // No need to check here as TypeScript will prevent it at compile time
    
    const gw = await this.findOne(id);

    // Check if IPv4 address is being changed and if it conflicts with existing gateways
    if (dto.ipv4_address && dto.ipv4_address !== gw.ipv4_address) {
      const existingIpGateway = await this.gwRepo.findOne({ 
        where: { ipv4_address: dto.ipv4_address } 
      });
      if (existingIpGateway && existingIpGateway.id !== id) {
        throw new ConflictException('Gateway with this IPv4 address already exists');
      }
    }

    // Explicitly exclude serial_number from updates
    const { serial_number, ...updateData } = dto as any;
    Object.assign(gw, updateData);
    return await this.gwRepo.save(gw);
  }

  async remove(id: string) {
    const gw = await this.findOne(id);
    
    // Business Rule: When deleting a gateway, set device.gateway_id = NULL (orphan devices)
    // This is handled by the entity configuration: onDelete: 'SET NULL'
    // But we can also explicitly handle it here for better control
    
    // Get all devices for this gateway
    const devices = await this.devRepo.find({ where: { gateway: { id } } });
    
    // Set gateway to null for all devices (orphan them)
    for (const device of devices) {
      device.gateway = null;
      await this.devRepo.save(device);
    }
    
    // Remove the gateway
    await this.gwRepo.remove(gw);
    
    return { 
      id, 
      removed: true, 
      orphanedDevices: devices.length,
      message: `Gateway deleted. ${devices.length} devices have been orphaned.`
    };
  }

  async attachDevice(gatewayId: string, dto: CreateDeviceDto) {
    const gw = await this.findOne(gatewayId);
    
    // Business Rule: A gateway can have at most 10 devices
    if ((gw.devices?.length || 0) >= this.MAX_DEVICES_PER_GATEWAY) {
      throw new BadRequestException(`Maximum ${this.MAX_DEVICES_PER_GATEWAY} devices allowed per gateway. Current count: ${gw.devices?.length || 0}`);
    }

    // Business Rule: A device uid must be globally unique
    const uidExists = await this.devRepo.findOne({ where: { uid: dto.uid } });
    if (uidExists) {
      throw new ConflictException(`Device UID ${dto.uid} must be globally unique. UID already exists.`);
    }

    const dev = this.devRepo.create({ ...dto, gateway: gw });
    return await this.devRepo.save(dev);
  }

  async detachDevice(gatewayId: string, deviceId: string) {
    const dev = await this.devRepo.findOne({ 
      where: { id: deviceId }, 
      relations: ['gateway'] 
    });
    
    if (!dev) {
      throw new NotFoundException('Device not found');
    }
    
    if (!dev.gateway || dev.gateway.id !== gatewayId) {
      throw new NotFoundException('Device not found on this gateway');
    }
    
    // Set gateway to null (orphan the device)
    dev.gateway = null;
    return await this.devRepo.save(dev);
  }

  // Additional method to get device count for a gateway
  async getDeviceCount(gatewayId: string): Promise<number> {
    const count = await this.devRepo.count({ 
      where: { gateway: { id: gatewayId } } 
    });
    return count;
  }

  // Method to check if gateway can accept more devices
  async canAcceptDevice(gatewayId: string): Promise<boolean> {
    const count = await this.getDeviceCount(gatewayId);
    return count < this.MAX_DEVICES_PER_GATEWAY;
  }
}
