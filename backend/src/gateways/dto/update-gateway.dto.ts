import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateGatewayDto } from './create-gateway.dto';

export class UpdateGatewayDto extends OmitType(PartialType(CreateGatewayDto), ['serial_number'] as const) {}
