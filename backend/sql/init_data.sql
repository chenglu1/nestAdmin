-- 插入默认角色
INSERT INTO `roles` (`name`, `code`, `description`, `status`) VALUES
('超级管理员', 'admin', '拥有所有权限', 1),
('普通用户', 'user', '只能查看基本信息', 1)
ON DUPLICATE KEY UPDATE name=name;

-- 插入默认菜单
INSERT INTO `menus` (`id`, `name`, `path`, `component`, `icon`, `parent_id`, `sort`, `type`, `status`) VALUES
(1, '个人中心', '/home', 'Dashboard', 'HomeOutlined', NULL, 1, 1, 1),
(2, '用户管理', '/home/users', 'UserManagement', 'TeamOutlined', NULL, 2, 1, 1),
(3, '菜单管理', '/home/menus', 'MenuManagement', 'MenuOutlined', NULL, 3, 1, 1),
(4, '角色管理', '/home/roles', 'RoleManagement', 'SafetyOutlined', NULL, 4, 1, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 给admin用户(ID=1)分配超级管理员角色(ID=1)
INSERT IGNORE INTO `user_roles` (`user_id`, `role_id`) VALUES (1, 1);

-- 给超级管理员角色分配所有菜单权限
INSERT IGNORE INTO `role_menus` (`role_id`, `menu_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4);

-- 给普通用户角色只分配个人中心菜单
INSERT IGNORE INTO `role_menus` (`role_id`, `menu_id`) VALUES (2, 1);
