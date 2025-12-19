import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import RenderRouter from '@/router';
import ErrorBoundary from '@/components/ErrorBoundary';

// 设置 dayjs 全局中文
dayjs.locale('zh-cn');

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ConfigProvider 
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 8,
            fontSize: 14,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
          components: {
            Card: {
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            },
            Button: {
              borderRadius: 8,
              fontWeight: 500,
            },
            Input: {
              borderRadius: 8,
            },
            Table: {
              borderRadius: 8,
            },
            Modal: {
              borderRadius: 12,
            },
          },
        }}
        componentSize="middle"
      >
        <AntdApp>
          <BrowserRouter>
            <RenderRouter />
          </BrowserRouter>
        </AntdApp>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;
