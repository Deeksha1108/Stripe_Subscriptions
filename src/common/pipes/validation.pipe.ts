import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  ValidationPipe as BaseValidationPipe,
} from '@nestjs/common';
import { logger } from 'src/logger/winston-logger';

@Injectable()
export class ValidationPipe
  extends BaseValidationPipe
  implements PipeTransform
{
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
  }

  override transform(value: any, metadata: ArgumentMetadata) {
    try {
      return super.transform(value, metadata);
    } catch (error: any) {
      logger.warn('Validation Failed', {
        message: error.message,
        data: value,
        type: metadata.type,
        metatype: metadata.metatype?.name,
        timestamp: new Date().toISOString(),
      });
      throw new BadRequestException(error.message);
    }
  }
}
