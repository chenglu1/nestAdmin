import React from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const token = localStorage.getItem('token');
  
  // 如果没有 token,重定向到登录页
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default PrivateRoute;
