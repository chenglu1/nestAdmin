import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 安全加固 - Helmet 设置安全 HTTP 头，禁用某些可能导致问题的安全头
  app.use(helmet({
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: false,
  }));
  
  // 启用 gzip 压缩
  app.use(compression());
  
  // 设置全局前缀
  app.setGlobalPrefix('api');
  
  // 启用全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // 注册全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 配置Cookie解析器，用于读取refresh token
  app.use(cookieParser());

  // 启用 CORS,允许前端访问
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://118.89.79.13'
    ],
    credentials: true,
  });

  // 配置 Swagger 文档
  const config = new DocumentBuilder()
    .setTitle('NestAdmin API')
    .setDescription('后台管理系统 API 文档')
    .setVersion('1.0')
    .addTag('auth', '认证相关')
    .addTag('user', '用户管理')
    .addTag('menu', '菜单管理')
    .addTag('role', '角色管理')
    .addTag('health', '健康检查')
    .addTag('performance', '性能监控')
    .addTag('chatanywhere', 'ChatAnywhere集成')
    .addTag('dashboard', '仪表板统计')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: '输入JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  const env = process.env.NODE_ENV || 'development';
  // 确保绑定到所有网络接口以允许外部访问
  const host = '0.0.0.0';
  const publicHost = process.env.PUBLIC_HOST || `http://${host}:${port}`;
  
  await app.listen(port, host);
  
  console.log(`\n🚀 Backend server is running`);
  console.log(`🔧 Environment: ${env.toUpperCase()}`);
  console.log(`🏠 Local address: http://${host}:${port}`);
  console.log(`🌐 Public address: ${publicHost}`);
  console.log(`📚 Swagger API docs: ${publicHost}/api-docs`);
  console.log(`🏥 Health check: ${publicHost}/api/health`);
  console.log(`💡 Base API path: ${publicHost}/api`);
  console.log('');
}

bootstrap();
