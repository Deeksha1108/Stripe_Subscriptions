import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import { Plan } from 'src/plans/entities/plan.entity';
import { Refund } from 'src/refunds/entities/refund.entity';
import { logger } from 'src/logger/winston-logger';

export const typeOrmConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  const options: TypeOrmModuleOptions = {
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    entities: [Subscription, Plan, Refund],
    synchronize: false,
    logging: false,
  };

  logger.verbose('Database config loaded', {
    database: options.database,
    host: options.host,
    port: options.port,
  });

  return options;
};
