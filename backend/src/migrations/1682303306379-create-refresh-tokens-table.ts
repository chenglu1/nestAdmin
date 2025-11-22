import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateRefreshTokensTable1682303306379 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'refresh_tokens',
      columns: [
        {
          name: 'id',
          type: 'int',
          isPrimary: true,
          isGenerated: true,
          generationStrategy: 'increment',
        },
        {
          name: 'token',
          type: 'varchar',
          length: '255',
          isNullable: false,
        },
        {
          name: 'user_id',
          type: 'int',
          isNullable: false,
        },
        {
          name: 'expires_at',
          type: 'datetime',
          isNullable: false,
        },
        {
          name: 'is_revoked',
          type: 'tinyint',
          default: 0,
          isNullable: false,
        },
        {
          name: 'created_at',
          type: 'datetime',
          isNullable: false,
        },
        {
          name: 'updated_at',
          type: 'datetime',
          isNullable: false,
        },
      ],
    }));

    // 创建索引
    await queryRunner.createIndex('refresh_tokens', new TableIndex({
      name: 'idx_refresh_token_token',
      columnNames: ['token'],
    }));

    // 创建外键
    await queryRunner.createForeignKey('refresh_tokens', new TableForeignKey({
      columnNames: ['user_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'users',
      onDelete: 'CASCADE',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('refresh_tokens');
  }

}