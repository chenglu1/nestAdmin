const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    multipleStatements: true
  });

  try {
    console.log('开始初始化数据...');
    
    const sqlFile = path.join(__dirname, 'sql', 'init_data.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    await connection.query(sql);
    
    console.log('✅ 数据初始化成功!');
    console.log('- 已创建角色: 超级管理员(admin), 普通用户(user)');
    console.log('- 已创建菜单: 个人中心, 用户管理, 菜单管理, 角色管理');
    console.log('- 已为admin用户分配超级管理员角色');
    console.log('- 已为角色分配菜单权限');
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
  } finally {
    await connection.end();
  }
}

initData();
