import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '用户ID', nullable: true })
  userId: number;

  @Column({ length: 50, comment: '用户名', nullable: true })
  username: string;

  @Column({ length: 100, comment: '操作模块' })
  module: string;

  @Column({ length: 200, comment: '操作描述' })
  description: string;

  @Column({ length: 20, comment: '请求方法' })
  method: string;

  @Column({ length: 500, comment: '请求路径' })
  path: string;

  @Column({ type: 'text', comment: '请求参数', nullable: true })
  params: string;

  @Column({ length: 50, comment: 'IP地址', nullable: true })
  ip: string;

  @Column({ length: 200, comment: '用户代理', nullable: true })
  userAgent: string;

  @Column({ comment: '响应状态码' })
  statusCode: number;

  @Column({ type: 'text', comment: '响应数据', nullable: true })
  response: string;

  @Column({ comment: '执行时间(ms)' })
  duration: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;
}
