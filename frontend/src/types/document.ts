import { IUser } from './user';

export enum DocumentType {
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  PASSPORT_SCAN = 'passport_scan',
  MEDICAL_CERTIFICATE = 'medical_certificate',
  OTHER = 'other',
}

export const documentTypeLabels: Record<DocumentType, string> = {
  [DocumentType.CONTRACT]: 'Договор',
  [DocumentType.INVOICE]: 'Счёт',
  [DocumentType.PASSPORT_SCAN]: 'Скан паспорта',
  [DocumentType.MEDICAL_CERTIFICATE]: 'Мед. справка',
  [DocumentType.OTHER]: 'Другое',
};

export interface IDocument {
  id: string;
  applicationId: string;
  uploadedById: string;
  uploadedBy?: IUser;
  type: DocumentType;
  originalName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}
