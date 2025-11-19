module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复bug
        'docs',     // 文档更新
        'style',    // 代码格式
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试
        'build',    // 构建系统
        'ci',       // CI配置
        'chore',    // 其他修改
        'revert',   // 回滚
      ],
    ],
    'subject-case': [0],
  },
};
