import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let errorResponse: any;

    // Handle validation errors specifically
    if (exceptionResponse instanceof Array && exceptionResponse.length > 0) {
      // This is a validation error from class-validator
      const validationErrors = exceptionResponse as ValidationError[];
      const messages = this.extractValidationMessages(validationErrors);
      
      errorResponse = {
        message: messages,
        error: 'Validation Failed',
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      // This is a custom exception response
      errorResponse = {
        message: (exceptionResponse as any).message || exception.message,
        error: (exceptionResponse as any).error || 'Bad Request',
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    } else {
      // This is a standard HTTP exception
      errorResponse = {
        message: exception.message,
        error: 'Bad Request',
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    response.status(status).json(errorResponse);
  }

  private extractValidationMessages(errors: ValidationError[]): string[] {
    const messages: string[] = [];
    
    for (const error of errors) {
      if (error.constraints) {
        messages.push(...Object.values(error.constraints));
      }
      
      if (error.children && error.children.length > 0) {
        messages.push(...this.extractValidationMessages(error.children));
      }
    }
    
    return messages;
  }
}
