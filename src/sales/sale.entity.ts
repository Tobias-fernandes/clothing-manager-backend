import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { SaleItem } from './sale-item.entity';

export enum PaymentMethod {
  PIX = 'pix',
  DEBIT_CARD = 'debit_card',
  CREDIT_CARD_CASH = 'credit_card_cash',
  CREDIT_CARD_INSTALLMENT = 'credit_card_installment',
  CASH = 'cash',
}

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'employeeId' })
  employee!: User;

  @Column()
  employeeId!: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'int', nullable: true, default: null })
  installments!: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v),
    },
  })
  total!: number;

  @Column({ nullable: true })
  storeId!: string;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true })
  items!: SaleItem[];

  @CreateDateColumn()
  createdAt!: Date;
}
