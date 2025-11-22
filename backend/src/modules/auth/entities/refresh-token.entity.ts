import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_refresh_token_token')
  @Column({ nullable: false })
  token: string;

  @Column({ nullable: false, name: 'user_id' })
  userId: number;

  @Column({ nullable: false, name: 'expires_at', default: () => 'NOW() + INTERVAL 30 DAY' })
  expiresAt: Date;

  @Column({ nullable: false, default: false, name: 'is_revoked' })
  isRevoked: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}