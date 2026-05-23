/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Comment {
  id: string;
  authorName: string;
  avatar?: string;
  text: string;
  timestamp: string;
}

export interface Posting {
  id: string;
  title: string;
  architecture: string;
  description: string;
  type: 'supply' | 'demand'; // 货源 vs 需求
  status: '现货' | '期货' | '在途';
  qty: string;
  location: string;
  vram?: string;
  network?: string;
  tags: string[];
  cpu?: string;
  memory?: string;
  storage?: string;
  networkArchitecture?: string;
  requiresContract: boolean;
  supportsGuaranty: boolean;
  attachmentName?: string;
  attachmentData?: string;
  estArrival?: string;
  moq?: string;
  timestamp: string;
  authorName?: string;
  userId?: string;
  comments?: Comment[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'operator';
  text: string;
  timestamp: string;
}

export interface ChatThread {
  id: string; // 'guidui' or 'thread-xxx'
  name: string;
  avatar: string;
  avatarAlt: string;
  lastMessage: string;
  unreadCount: number;
  statusText: string;
  messages: ChatMessage[];
}

export interface SystemLog {
  id: string;
  logName: string;
  category: 'system' | 'network' | 'security';
  title: string;
  description: string;
  timestamp: string;
  status: 'critical' | 'alert' | 'success';
}

export type TabType = 'lobby' | 'publish' | 'messages' | 'terminal';

export interface UserProfile {
  nickname: string;
  phone: string;
  email: string;
  location: string;
  password?: string;
  avatar?: string; // base64 / data URL representing custom avatar
}
