import { IUser } from './user';
import { IApplication } from './application';

export interface IChild {
  id: string;
  parentId: string;
  firstName: string;
  lastName: string;
  patronymic?: string;
  birthDate: string;
  medicalNotes?: string;
  createdAt: string;
}

export interface IClient extends IUser {
  children: IChild[];
  applications?: IApplication[];
}

export interface ICreateChildRequest {
  firstName: string;
  lastName: string;
  patronymic?: string;
  birthDate: string;
  medicalNotes?: string;
}

export interface IUpdateClientRequest {
  firstName?: string;
  lastName?: string;
  patronymic?: string;
  email?: string;
  phone?: string;
}
