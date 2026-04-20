import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Child } from './entities/child.entity';
import { Application } from '../applications/entities/application.entity';
import { ClientsController, ChildrenController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Child, Application])],
  controllers: [ClientsController, ChildrenController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
