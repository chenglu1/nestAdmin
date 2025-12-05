/**
 * pnpm hooks - 用于自定义依赖解析和安装行为
 */

function readPackage(pkg, context) {
  // 可以在这里修改依赖版本或添加缺失的peer dependencies
  
  // 示例: 统一某些依赖的版本
  // if (pkg.dependencies?.typescript) {
  //   pkg.dependencies.typescript = '~5.9.3';
  // }
  
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
