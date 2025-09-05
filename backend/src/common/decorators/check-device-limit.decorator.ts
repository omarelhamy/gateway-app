import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { GatewaysService } from '../../gateways/gateways.service';

export const CheckDeviceLimit = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const gatewayId = request.params.id;
    
    // Get the GatewaysService from the request
    const gatewaysService = request.gatewaysService as GatewaysService;
    
    if (!gatewaysService) {
      throw new BadRequestException('GatewaysService not available');
    }
    
    // Check if gateway can accept more devices
    const canAccept = await gatewaysService.canAcceptDevice(gatewayId);
    
    if (!canAccept) {
      const deviceCount = await gatewaysService.getDeviceCount(gatewayId);
      throw new BadRequestException(
        `Gateway cannot accept more devices. Current count: ${deviceCount}, Maximum: 10`
      );
    }
    
    return true;
  },
);
