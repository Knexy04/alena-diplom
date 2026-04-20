import { IUser } from './user';
import { IChild } from './client';

export enum ApplicationStatus {
  REVIEW = 'review',
  PROCESSING = 'processing',
  AWAITING_PAYMENT = 'awaiting_payment',
  PAID = 'paid',
  COMPLETED = 'completed',
}

export const statusLabels: Record<ApplicationStatus, string> = {
  [ApplicationStatus.REVIEW]: 'На рассмотрении',
  [ApplicationStatus.PROCESSING]: 'В обработке',
  [ApplicationStatus.AWAITING_PAYMENT]: 'Ожидает предоплаты',
  [ApplicationStatus.PAID]: 'Оплачено',
  [ApplicationStatus.COMPLETED]: 'Завершено',
};

export const statusColors: Record<ApplicationStatus, string> = {
  [ApplicationStatus.REVIEW]: 'default',
  [ApplicationStatus.PROCESSING]: 'blue',
  [ApplicationStatus.AWAITING_PAYMENT]: 'orange',
  [ApplicationStatus.PAID]: 'green',
  [ApplicationStatus.COMPLETED]: 'purple',
};

export interface ISession {
  id: string;
  title: string;
  country: string;
  startDate: string;
  endDate: string;
  capacity: number;
  price: number;
  isActive: boolean;
}

export interface IApplication {
  id: string;
  applicationNumber: string;
  parentId: string;
  parent: IUser;
  childId: string;
  child: IChild;
  sessionId: string;
  session: ISession;
  status: ApplicationStatus;
  notes?: string;
  assignedManagerId?: string;
  assignedManager?: IUser;
  createdAt: string;
  updatedAt: string;
}

export interface IApplicationsResponse {
  data: {
    items: IApplication[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ICreateApplicationRequest {
  childId: string;
  sessionId: string;
  notes?: string;
}

export interface IUpdateApplicationRequest {
  status?: ApplicationStatus;
  notes?: string;
  assignedManagerId?: string;
}
