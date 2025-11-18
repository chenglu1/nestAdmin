import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 设置全局前缀
  app.setGlobalPrefix('api');
  
  // 启用全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // 启用 CORS,允许前端访问
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://118.89.79.13'],
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
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: '输入JWT token',
        in: 'header',
      },
      'JWT-auth', // 这个名字要和 @ApiBearerAuth() 装饰器中的名字一致
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 保持授权状态
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend server is running on http://localhost:${port}`);
  console.log(`📚 Swagger API docs: http://localhost:${port}/api-docs`);
}

bootstrap();
