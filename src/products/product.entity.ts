import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProductCategory {
  SHIRT = 'shirt',
  PANTS = 'pants',
  DRESS = 'dress',
  SHOE = 'shoe',
  ACCESSORY = 'accessory',
  OTHER = 'other',
}

const decimalTransformer = {
  from: (value: string) => parseFloat(value),
  to: (value: number) => value,
};

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true, length: 50 })
  code!: string;

  @Column({
    type: 'enum',
    enum: ProductCategory,
    default: ProductCategory.OTHER,
  })
  category!: ProductCategory;

  @Column({ length: 50 })
  size!: string;

  @Column({ length: 50 })
  color!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  costPrice!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  salePrice!: number;

  @Column({ default: 0 })
  quantity!: number;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ nullable: true })
  storeId!: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
