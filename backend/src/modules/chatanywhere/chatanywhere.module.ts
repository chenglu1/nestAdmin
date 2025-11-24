import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatanywhereService } from './chatanywhere.service';
import { ChatanywhereController } from './chatanywhere.controller';

@Module({
  imports: [HttpModule],
  providers: [ChatanywhereService],
  controllers: [ChatanywhereController],
})
export class ChatanywhereModule {}
