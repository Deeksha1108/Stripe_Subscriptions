import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { logger } from 'src/logger/winston-logger';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const safeMessage =
      process.env.NODE_ENV === 'production' ? 'Something went wrong' : message;

    logger.error(`HTTP Exception: ${JSON.stringify(message)}`, {
      path: request.url,
      method: request.method,
      statusCode: status,
      timestamp: new Date().toISOString(),
    });

    response.status(status).json({
      success: false,
      statusCode: status,
      message: safeMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
