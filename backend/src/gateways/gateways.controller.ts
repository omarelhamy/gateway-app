import { Body, Controller, Delete, Get, Param, Patch, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { GatewaysService } from './gateways.service';
import { CreateGatewayDto } from './dto/create-gateway.dto';
import { UpdateGatewayDto } from './dto/update-gateway.dto';
import { CreateDeviceDto } from './dto/create-device.dto';

@Controller('api/gateways')
export class GatewaysController {
  constructor(private readonly svc: GatewaysService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateGatewayDto) {
    return this.svc.createGateway(dto);
  }

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGatewayDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }

  @Post(':id/devices')
  @HttpCode(HttpStatus.CREATED)
  attachDevice(@Param('id') id: string, @Body() dto: CreateDeviceDto) {
    return this.svc.attachDevice(id, dto);
  }

  @Delete(':id/devices/:deviceId')
  @HttpCode(HttpStatus.OK)
  detachDevice(@Param('id') id: string, @Param('deviceId') deviceId: string) {
    return this.svc.detachDevice(id, deviceId);
  }

  // New endpoints for business rule validation
  @Get(':id/device-count')
  getDeviceCount(@Param('id') id: string) {
    return this.svc.getDeviceCount(id);
  }

  @Get(':id/can-accept-device')
  canAcceptDevice(@Param('id') id: string) {
    return this.svc.canAcceptDevice(id);
  }

  @Get(':id/capacity-info')
  async getCapacityInfo(@Param('id') id: string) {
    const deviceCount = await this.svc.getDeviceCount(id);
    const canAccept = await this.svc.canAcceptDevice(id);
    const maxDevices = 10;
    
    return {
      gatewayId: id,
      currentDeviceCount: deviceCount,
      maxDevices,
      canAcceptMore: canAccept,
      remainingCapacity: maxDevices - deviceCount,
      isAtCapacity: deviceCount >= maxDevices
    };
  }
}
