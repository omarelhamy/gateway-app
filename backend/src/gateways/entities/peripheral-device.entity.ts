import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { Gateway } from './gateway.entity';

export type DeviceStatus = 'online' | 'offline' | 'maintenance';

@Entity('peripheral_devices')
export class PeripheralDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'bigint' })
  uid: number;

  @Column()
  vendor: string;

  @Column({ type: 'varchar', default: 'offline' })
  status: DeviceStatus;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  last_seen_at?: Date;

  @ManyToOne(() => Gateway, (g) => g.devices, { onDelete: 'SET NULL', nullable: true })
  gateway: Gateway | null;

  @Column({ type: 'int', nullable: true })
  device_type_id?: number;
}
