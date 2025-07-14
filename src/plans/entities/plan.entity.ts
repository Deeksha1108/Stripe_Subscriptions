import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('plans')
@Unique(['stripeProductId', 'stripePriceId'])
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  stripeProductId: string;

  @Column({ unique: true })
  stripePriceId: string;

  @Column()
  name: string;

  @Column()
  amount: number;

  @Column()
  currency: string;

  @Column()
  interval: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
