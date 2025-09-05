import { IsString, IsIP, IsEnum, IsOptional, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { GatewayStatus } from '../entities/gateway.entity';

export class CreateGatewayDto {
  @IsString() 
  @IsNotEmpty({ message: 'Serial number is required' })
  @MinLength(3, { message: 'Serial number must be at least 3 characters long' })
  @MaxLength(100, { message: 'Serial number cannot exceed 100 characters' })
  serial_number: string;

  @IsString() 
  @IsNotEmpty({ message: 'Gateway name is required' })
  @MinLength(2, { message: 'Gateway name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Gateway name cannot exceed 100 characters' })
  name: string;

  @IsIP('4', { message: 'IPv4 address must be a valid IPv4 format' })
  ipv4_address: string;

  @IsEnum(['active','inactive','decommissioned'] as const, { 
    message: 'Status must be one of: active, inactive, decommissioned' 
  })
  status: GatewayStatus;

  @IsOptional() 
  @IsString()
  @MaxLength(200, { message: 'Location cannot exceed 200 characters' })
  location?: string;
}
