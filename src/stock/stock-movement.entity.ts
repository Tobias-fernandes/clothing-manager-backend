import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';

export enum MovementType {
  ENTRY = 'entry',
  EXIT = 'exit',
  ADJUSTMENT = 'adjustment',
  LOSS = 'loss',
  SALE = 'sale',
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column()
  productId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'responsibleId' })
  responsible!: User;

  @Column()
  responsibleId!: string;

  @Column({ type: 'enum', enum: MovementType })
  type!: MovementType;

  @Column()
  quantity!: number;

  @Column({ nullable: true })
  storeId!: string;

  @Column({ type: 'text', nullable: true })
  observation!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
