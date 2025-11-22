import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ length: 255 })
  password: string;

  @Column({ nullable: true, length: 100 })
  email: string;

  @Column({ nullable: true, length: 50 })
  nickname: string;

  @Column({ default: 1, comment: '1-正常 0-禁用' })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 刷新令牌关联将通过RefreshToken实体的ManyToOne关系处理
  // refreshTokens: any[];
}
