import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gateway } from './entities/gateway.entity';
import { PeripheralDevice } from './entities/peripheral-device.entity';
import { DeviceType } from './entities/device-type.entity';
import { GatewaysController } from './gateways.controller';
import { GatewaysService } from './gateways.service';

@Module({
  imports: [TypeOrmModule.forFeature([Gateway, PeripheralDevice, DeviceType])],
  controllers: [GatewaysController],
  providers: [GatewaysService],
})
export class GatewaysModule {}
