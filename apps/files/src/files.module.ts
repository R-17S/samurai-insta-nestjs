import { Module } from '@nestjs/common';
import { FileServiceController } from './file-service.controller';

@Module({
  imports: [],
  controllers: [FileServiceController],
  providers: [],
})
export class FilesModule {}
