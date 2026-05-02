export type Role = 'ROLE_ADMIN' | 'ROLE_FOUNDER' | 'ROLE_INVESTOR';

export interface AuthResponse {
  userId: number;
  email: string;
  role: Role;
  token: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password?: string;
  refreshToken?: string;
}

export interface RegisterPayload {
  email: string;
  password?: string;
  role: Role;
  name?: string;
}

export type NotificationType = 'APPROVAL' | 'INVESTMENT' | 'SYSTEM' | 'MATCH';

export interface NotificationResponse {
  notificationId: number;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt?: string;
}

export interface UserResponse {
  userId: number;
  name: string;
  email: string;
  role: Role;
  companyName?: string;
  skills?: string;
  experience?: string;
  portfolioLinks?: string;
  bio?: string;
  location?: string;
}

export interface UserUpdateRequest {
  companyName?: string;
  skills?: string;
  experience?: string;
  portfolioLinks?: string;
  bio?: string;
  location?: string;
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type StartupStage = 'IDEA' | 'MVP' | 'EARLY_TRACTION' | 'SCALING';

export interface StartupResponse {
  startupId: number;
  founderId: number;
  startupName: string;
  description: string;
  industry?: string;
  problemStatement?: string;
  solution?: string;
  fundingGoal?: number;
  stage: StartupStage;
  location?: string;
  approvalStatus: ApprovalStatus;
  createdAt?: string;
}

export interface StartupCreateRequest {
  startupName: string;
  description: string;
  industry?: string;
  problemStatement?: string;
  solution?: string;
  fundingGoal?: number;
  stage: StartupStage;
  location?: string;
}

export interface StartupUpdateRequest {
  startupName?: string;
  description?: string;
  industry?: string;
  problemStatement?: string;
  solution?: string;
  fundingGoal?: number;
  stage?: StartupStage;
  location?: string;
}

export type InvestmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface InvestmentResponse {
  investmentId: number;
  startupId: number;
  investorId: number;
  amount: number;
  status: InvestmentStatus;
  createdAt?: string;
}

export interface InvestmentCreateRequest {
  startupId: number;
  amount: number;
}

export interface PageResponse<T> {
  listContent?: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type DisplayStatus = ApprovalStatus | InvestmentStatus | 'READ' | 'UNREAD';

export interface TableColumn<T> {
  key: Extract<keyof T, string>;
  label: string;
  type?: 'text' | 'currency' | 'status' | 'date';
}

export interface StatCard {
  label: string;
  value: string;
  change: string;
  tone: 'blue' | 'amber' | 'green' | 'purple';
}
