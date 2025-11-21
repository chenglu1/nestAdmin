import { Suspense } from 'react';
import type { ReactElement } from 'react';
import { useRoutes } from 'react-router-dom';
import type { RouteObject as ReactRouterRouteObject } from 'react-router-dom';
import { Spin } from 'antd';
import PrivateRoute from '@/components/PrivateRoute';
import { routes } from './routes';
import type { RouteConfig } from './routes';

// 全局加载组件
const PageLoading = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#f0f2f5',
    }}
  >
    <Spin size="large" tip="页面加载中..." />
  </div>
);

// 处理路由配置,添加权限验证
const processRoutes = (routeConfigs: RouteConfig[]): ReactRouterRouteObject[] => {
  return routeConfigs.map((route) => {
    const { meta, children, element, ...routeProps } = route;
    
    const processedRoute: ReactRouterRouteObject = { 
      ...routeProps,
      element: element as ReactElement
    };

    // 包裹 Suspense 和权限验证
    let processedElement = element;
    
    // 如果需要认证,包裹 PrivateRoute
    if (meta?.requiresAuth) {
      processedElement = <PrivateRoute>{processedElement}</PrivateRoute>;
    }
    
    // 所有路由都包裹 Suspense(懒加载需要)
    processedRoute.element = (
      <Suspense fallback={<PageLoading />}>
        {processedElement}
      </Suspense>
    );

    // 递归处理子路由
    if (children) {
      processedRoute.children = processRoutes(children) as ReactRouterRouteObject[];
    }

    return processedRoute;
  });
};

// 路由渲染器
const RenderRouter = () => {
  const processedRoutes = processRoutes(routes);
  return useRoutes(processedRoutes);
};

export default RenderRouter;
