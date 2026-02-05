export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  email: string;
  password?: string; // In real app, this would be hashed
  role: UserRole;
  balance: number;
  totalEarned: number;
  isBlocked: boolean;
  affiliateImages: string[];
  // Game Fields
  coins: number;
  sessionTaps: number;
  cooldownUntil: number | null; // Timestamp in ms
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  upiId: string;
  status: WithdrawalStatus;
  date: string;
}

export interface SystemConfig {
  minWithdrawalAmount: number;
  globalAffiliateLink: string;
  globalAffiliateMessage: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  isAdmin: boolean; // True if sent by admin
  targetEmail?: string; // If present, only visible to this email. If undefined, visible to all.
}

export interface ChatMessage {
  sender: 'user' | 'admin';
  text: string;
  timestamp: number;
}

export interface SupportChat {
  userId: string;
  userEmail: string;
  messages: ChatMessage[];
  lastUpdated: number;
  lastSender: 'user' | 'admin';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}