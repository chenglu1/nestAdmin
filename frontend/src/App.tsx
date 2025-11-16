import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import RenderRouter from '@/router';
import ErrorBoundary from '@/components/ErrorBoundary';
import './App.less';

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
