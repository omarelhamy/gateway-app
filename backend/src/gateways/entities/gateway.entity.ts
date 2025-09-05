import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { PeripheralDevice } from './peripheral-device.entity';

export type GatewayStatus = 'active' | 'inactive' | 'decommissioned';

@Entity('gateways')
export class Gateway {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  serial_number: string;

  @Column()
  name: string;

  @Index({ unique: true })
  @Column()
  ipv4_address: string;

  @Column({ type: 'varchar', default: 'active' })
  status: GatewayStatus;

  @Column({ nullable: true })
  location?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => PeripheralDevice, (peripheralDevice) => peripheralDevice.gateway, { cascade: false })
  devices: PeripheralDevice[];
}
