import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('device_types')
export class DeviceType {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
