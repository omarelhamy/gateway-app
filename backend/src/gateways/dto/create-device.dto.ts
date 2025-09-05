import { IsNumber, IsString, IsEnum, IsOptional, IsPositive, IsNotEmpty } from 'class-validator';
import { DeviceStatus } from '../entities/peripheral-device.entity';

export class CreateDeviceDto {
  @IsNumber()
  @IsPositive({ message: 'UID must be a positive number' })
  @IsNotEmpty({ message: 'UID is required' })
  uid: number;

  @IsString()
  @IsNotEmpty({ message: 'Vendor is required' })
  vendor: string;

  @IsEnum(['online','offline','maintenance'] as const)
  status: DeviceStatus;

  @IsOptional()
  last_seen_at?: Date;
}
