import { IUser } from './user';

export interface IMessage {
  id: string;
  applicationId: string;
  senderId: string;
  sender: IUser;
  text?: string;
  filePath?: string;
  fileName?: string;
  isRead: boolean;
  createdAt: string;
}

export interface IMessagesResponse {
  data: {
    items: IMessage[];
    total: number;
    page: number;
    limit: number;
  };
}
