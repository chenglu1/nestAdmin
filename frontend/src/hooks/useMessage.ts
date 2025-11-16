import { App } from 'antd';

/**
 * 使用 Ant Design App 组件的静态方法显示提示
 * 这个 hook 必须在 <App> 组件内部使用
 */
export const useMessage = () => {
  const { message } = App.useApp();
  
  return {
    success: (content: string) => {
      message.success({
        content,
        duration: 3,
      });
    },
    error: (content: string) => {
      message.error({
        content,
        duration: 3,
      });
    },
    warning: (content: string) => {
      message.warning({
        content,
        duration: 3,
      });
    },
    info: (content: string) => {
      message.info({
        content,
        duration: 3,
      });
    },
  };
};
