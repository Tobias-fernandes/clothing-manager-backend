import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum EntryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum EntryCategory {
  SALE = 'sale',
  SUPPLIER = 'supplier',
  MAINTENANCE = 'maintenance',
  SALARY = 'salary',
  OTHER = 'other',
}

@Entity('finance_entries')
export class FinanceEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: EntryType })
  type!: EntryType;

  @Column({ type: 'enum', enum: EntryCategory })
  category!: EntryCategory;

  @Column({ length: 200 })
  description!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v),
    },
  })
  amount!: number;

  @Column({ type: 'varchar', nullable: true, default: null })
  saleId!: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'responsibleId' })
  responsible!: User;

  @Column()
  responsibleId!: string;

  @Column({ nullable: true })
  storeId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
