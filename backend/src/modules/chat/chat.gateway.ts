import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { jwtConfig } from '../../config/jwt.config';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.query.token as string) ||
        client.handshake.auth?.token;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: jwtConfig.secret,
      });

      (client as any).userId = payload.sub;
      (client as any).userRole = payload.role;

      this.logger.log(`Клиент подключен: ${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Клиент отключен: ${(client as any).userId || 'unknown'}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { applicationId: string },
  ) {
    const room = `application_${data.applicationId}`;
    client.join(room);
    this.logger.log(`${(client as any).userId} присоединился к ${room}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      applicationId: string;
      text?: string;
      filePath?: string;
      fileName?: string;
    },
  ) {
    const userId = (client as any).userId;

    const message = await this.chatService.createMessage({
      applicationId: data.applicationId,
      senderId: userId,
      text: data.text,
      filePath: data.filePath,
      fileName: data.fileName,
    });

    const room = `application_${data.applicationId}`;
    this.server.to(room).emit('newMessage', message);
  }

  @SubscribeMessage('messagesRead')
  async handleMessagesRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { applicationId: string },
  ) {
    const userId = (client as any).userId;
    await this.chatService.markAsRead(data.applicationId, userId);

    const room = `application_${data.applicationId}`;
    this.server.to(room).emit('messagesRead', {
      applicationId: data.applicationId,
      readBy: userId,
    });
  }
}
