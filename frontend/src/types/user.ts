export enum UserRole {
  MANAGER = 'manager',
  PARENT = 'parent',
}

export interface IUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  patronymic?: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  patronymic?: string;
  phone?: string;
}

export interface IAuthResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user: IUser;
  };
}
