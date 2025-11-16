import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('performance_metrics')
@Index(['path', 'createdAt'])
@Index(['method', 'createdAt'])
@Index(['statusCode', 'createdAt'])
export class PerformanceMetric {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: 'HTTP 方法' })
  method: string;

  @Column({ comment: '请求路径' })
  path: string;

  @Column({ comment: '状态码' })
  statusCode: number;

  @Column({ type: 'int', comment: '响应时间(ms)' })
  responseTime: number;

  @Column({ type: 'bigint', comment: '请求大小(bytes)', nullable: true })
  requestSize: number;

  @Column({ type: 'bigint', comment: '响应大小(bytes)', nullable: true })
  responseSize: number;

  @Column({ type: 'varchar', length: 45, comment: 'IP地址', nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, comment: 'User Agent', nullable: true })
  userAgent: string;

  @Column({ type: 'int', nullable: true, comment: '用户ID' })
  userId: number;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '用户名' })
  username: string;

  @Column({ type: 'float', comment: 'CPU使用率(%)', nullable: true })
  cpuUsage: number;

  @Column({ type: 'bigint', comment: '内存使用(bytes)', nullable: true })
  memoryUsage: number;

  @Column({ type: 'text', comment: '错误信息', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;
}
