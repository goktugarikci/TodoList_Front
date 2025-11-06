// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/types/api.ts
// ===================================================================
// 1. ENUM'LAR (Prisma Enum'larının TypeScript Karşılığı)
// ===================================================================

export type BoardRole = 'ADMIN' | 'EDITOR' | 'MEMBER' | 'COMMENTER' | 'VIEWER';
export type UserRole = 'USER' | 'ADMIN';
export type TaskApprovalStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type ActivityActionType =
  | 'CREATE_BOARD' | 'UPDATE_BOARD_NAME' | 'ADD_BOARD_MEMBER' | 'REMOVE_BOARD_MEMBER' | 'DELETE_BOARD' | 'UPDATE_MEMBER_ROLE' | 'TRANSFER_OWNERSHIP'
  | 'CREATE_LIST' | 'UPDATE_LIST_NAME' | 'DELETE_LIST' | 'REORDER_LISTS'
  | 'CREATE_TASK' | 'UPDATE_TASK_DETAILS' | 'UPDATE_TASK_STATUS' | 'MOVE_TASK' | 'ASSIGN_TASK' | 'UNASSIGN_TASK' | 'ADD_TASK_TAG' | 'REMOVE_TASK_TAG' | 'ADD_TASK_DEPENDENCY' | 'REMOVE_TASK_DEPENDENCY' | 'DELETE_TASK' | 'REORDER_TASKS'
  | 'CREATE_CHECKLIST_ITEM' | 'UPDATE_CHECKLIST_ITEM' | 'TOGGLE_CHECKLIST_ITEM' | 'ASSIGN_CHECKLIST_ITEM' | 'UNASSIGN_CHECKLIST_ITEM' | 'ADD_CHECKLIST_IMAGE' | 'DELETE_CHECKLIST_IMAGE' | 'DELETE_CHECKLIST_ITEM'
  | 'ADD_TASK_COMMENT' | 'DELETE_TASK_COMMENT'
  | 'ADD_TASK_ATTACHMENT' | 'DELETE_TASK_ATTACHMENT'
  | 'CREATE_TAG' | 'DELETE_TAG'
  | 'CHANGE_USER_ROLE' | 'SET_USER_STATUS' | 'DELETE_USER'
  | 'ADMIN_DELETE_BOARD'
  | 'ADMIN_DELETE_COMMENT' | 'ADMIN_DELETE_ATTACHMENT'
  | 'ASSIGN_SUPPORT_TICKET' | 'DELETE_SUPPORT_TICKET';


// ===================================================================
// 2. TEMEL VE PAYLAŞILAN TİPLER
// ===================================================================

// API'den gelen genel hata yanıtı
export interface ApiErrorResponse {
  msg: string;
}

// Temel kullanıcı bilgisi (hassas veri olmadan)
export interface UserPublicInfo {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string; // null yerine undefined (?:)
  role: UserRole;
  username?: string; // null yerine undefined (?:)
}

// Görev atamaları veya yorumlar için daha kısa kullanıcı bilgisi
export interface UserAssigneeDto {
  id: string;
  name: string;
  avatarUrl?: string; // null yerine undefined (?:)
  username?: string; // Hata veren eksik alan eklendi
}

// Etiket objesi
export interface Tag {
  id: string;
  name: string;
  color: string;
  boardId: string;
}

// Görevlerdeki _count objesi
export interface TaskCounts {
  checklistItems: number; 
  comments: number;
  attachments: number;
}

export interface ReactionSummary {
  emoji: string;
  userId: string;
  user: { // Reaksiyonu verenin temel bilgisi
    id: string;
    name: string;
  };
}

// ===================================================================
// 3. AUTH ENDPOINT TİPLERİ (`/api/auth`)
// ===================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  role: UserRole;
}

export interface SetPasswordRequest {
  password: string;
}

// ===================================================================
// 4. USER ENDPOINT TİPLERİ (`/api/user`)
// ===================================================================
// GET /api/user/me yanıtı UserPublicInfo kullanır

export interface UpdateUsernameRequest {
  username: string;
}
export interface UpdateUsernameResponse {
  msg: string;
  user: UserPublicInfo; // Güncellenmiş kullanıcı bilgisi
}
export interface UpdateNameRequest {
  name: string;
}
// GET /api/user/me/tasks yanıtı
export interface MyTaskSummary {
  id: string;
  title: string;
  dueDate?: string | null;
  priority: TaskPriority;
  approvalStatus: TaskApprovalStatus;
  taskList: {
    id: string;
    title: string;
    boardId: string;
  };
  tags: Tag[];
  _count: TaskCounts;
}

// ===================================================================
// 5. BOARD ENDPOINT TİPLERİ (`/api/boards`)
// ===================================================================

export interface CreateBoardRequest {
  name: string;
  type?: 'INDIVIDUAL' | 'GROUP';
}
export interface UpdateBoardRequest {
  name: string;
}
export interface AddMemberRequest {
  email: string;
}

export interface RemoveMemberRequest {
  userIdToRemove: string;
}

export interface ChangeRoleRequest {
  role: BoardRole;
}

export interface ReorderListItemRequest {
  listId: string;
  order: number;
}

// GET /api/boards/myboards yanıtı
export interface BoardSummary {
  membership: any;
  id: string;
  name: string;
  type: 'INDIVIDUAL' | 'GROUP';
  createdAt: string; // ISO 8601 string
  _count: {
    members: number;
  };
}

// Pano üyelik bilgisi (BoardDetailed içinde kullanılır)
export interface BoardMembership {
  id: string;
  role: BoardRole;
  user: UserPublicInfo; // Üye bilgileri
}

// GET /api/boards/:boardId yanıtı (Tüm Detaylar)
export interface BoardDetailed {
  description: string;
  id: string;
  name: string;
  type: 'INDIVIDUAL' | 'GROUP';
  createdBy?: UserPublicInfo | null;
  members: BoardMembership[];
  tags: Tag[];
  lists: TaskList[];
}

export interface TaskList {
  id: string;
  title: string;
  order: number;
  tasks: TaskDetailed[];
  boardId: string; 
}

export interface TaskDetailed {
  id: string;
  title: string;
  description?: string | null;
  approvalStatus: TaskApprovalStatus;
  priority: TaskPriority;
  startDate?: string | null;
  dueDate?: string | null;
  order: number;
  createdBy?: UserAssigneeDto | null;
  assignees: UserAssigneeDto[];
  tags: Tag[];
  checklistItems: ChecklistItemDetailed[];
  attachments: TaskAttachment[]; // GÜNCELLENDİ: Ekler buraya eklendi
  _count: TaskCounts;
  // DÜZELTME: API'den gelen yanıta boardId eklenmesi
  taskListId: string;
  taskList: {
    boardId: string;
  };
}

export interface ChecklistItemDetailed {
  id: string;
  text: string;
  isCompleted: boolean;
  dueDate?: string | null;
  assignees: UserAssigneeDto[];
  images: ChecklistImage[];
}

export interface ChecklistImage {
  id: string;
  url: string;
  createdAt: string;
}

// ===================================================================
// 6. TASK ENDPOINT TİPLERİ (`/api/tasks`)
// ===================================================================

export interface CreateTaskRequest {
  title: string;
  taskListId: string;
  description?: string;
  priority?: TaskPriority;
  startDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  tagIds?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  startDate?: string | null;
  dueDate?: string | null;
  tagIds?: string[];
  approvalStatus?: TaskApprovalStatus;
}

export interface MoveTaskRequest {
  newTaskListId: string;
  newOrder?: number;
}

export interface AssignRequest {
  assignUserId: string;
}

export interface UnassignRequest {
  unassignUserId: string;
}

export interface DependencyRequest {
  dependencyTaskId: string;
  type: 'blocking' | 'waiting_on';
}

export interface DependencyResponse {
  blockingTasks: { id: string; title: string }[];
  dependentTasks: { id: string; title: string }[];
}

// ===================================================================
// 7. CHECKLIST ENDPOINT TİPLERİ (`/api/checklist`)
// ===================================================================

export interface CreateChecklistItemRequest {
  text: string;
  dueDate?: string; // YYYY-MM-DD
}

export interface UpdateChecklistItemRequest {
  text?: string;
  dueDate?: string | null;
}

// ===================================================================
// 8. COMMENT & REACTION ENDPOINT TİPLERİ
// ===================================================================

export interface CreateCommentRequest {
  text: string;
}

export interface TaskComment {
  id: string;
  text: string;
  createdAt: string;
  author?: UserAssigneeDto | null;
  reactions: ReactionSummary[]; // Artık 'ReactionSummary' tanımlı
}

export interface ReactionRequest {
  emoji: string;
}

export interface ReactionGroupResponse {
  message: string;
  reactions: {
    emoji: string;
    count: number;
  }[];
}

// ===================================================================
// 9. ATTACHMENT (Dosya Eki) TİPLERİ
// ===================================================================

export interface TaskAttachment {
  id: string;
  url: string;
  fileName: string;
  fileType?: string | null;
  uploadedAt: string;
  uploadedBy?: UserAssigneeDto | null;
}

// ===================================================================
// 10. TIME ENTRY (Zaman Takibi) TİPLERİ
// ===================================================================

export interface CreateManualTimeEntryRequest {
  durationInMinutes: number;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface StopTimeEntryRequest {
  notes?: string;
}

export interface TimeEntry {
  id: string;
  startTime: string;
  endTime?: string | null;
  duration?: number | null; // dakika
  notes?: string | null;
  taskId: string;
  userId: string;
}

export interface TimeEntryWithUser extends TimeEntry {
  user: UserAssigneeDto;
}

export interface TimeEntryWithTask extends TimeEntry {
  task: {
    id: string;
    title: string;
  };
}

export interface PaginatedTimeEntries {
  entries: TimeEntryWithTask[] | TimeEntryWithUser[];
  totalEntries: number;
  currentPage: number;
  totalPages: number;
}

// ===================================================================
// 11. CHAT (Sohbet) TİPLERİ (`/api/messages` & `/api/dm`)
// ===================================================================

// Grup Sohbeti
export interface MessageWithAuthor {
  id: string;
  text: string;
  createdAt: string;
  author?: UserAssigneeDto | null;
  boardId: string;
}

// Özel Mesaj (DM)
export interface ConversationSummary {
  conversationId: string;
  otherUser: UserPublicInfo;
  lastMessage?: {
    text: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
    receiverId: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface DirectMessageWithSender {
  id: string;
  text: string;
  createdAt: string;
  isRead: boolean;
  senderId: string;
  receiverId: string;
  conversationId: string;
  sender: UserAssigneeDto;
}

export interface PaginatedDirectMessages {
  messages: DirectMessageWithSender[];
  totalMessages: number;
  currentPage: number;
  totalPages: number;
}

// ===================================================================
// 12. NOTIFICATION TİPLERİ (`/api/notifications`)
// ===================================================================

export interface NotificationDetailed {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
  boardId?: string | null;
  taskId?: string | null;
  commentId?: string | null;
  // İlişkili nesne detayları
  task?: { id: string; title: string };
  board?: { id: string; name: string };
  comment?: { id: string };
}

export interface PaginatedNotifications {
  notifications: NotificationDetailed[];
  totalNotifications: number;
  currentPage: number;
  totalPages: number;
}

// ===================================================================
// 13. SUPPORT TICKET TİPLERİ (`/api/support`)
// (Eksik kısımlar eklendi)
// ===================================================================

export interface SupportTicketImage {
  id: string;
  url: string;
  createdAt: string;
}
export interface SupportTicketComment {
  id: string;
  text: string;
  createdAt: string;
  author?: UserAssigneeDto | null;
}
export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  submittedByName: string;
  submittedByEmail: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  submittedBy?: UserPublicInfo | null;
  assignedAdmin?: UserAssigneeDto | null;
}
// GET /api/support/tickets/:ticketId yanıtı
export interface SupportTicketDetailed extends SupportTicket {
  images: SupportTicketImage[];
  comments: SupportTicketComment[];
}
// GET /api/support/tickets yanıtı
export interface SupportTicketSummary extends SupportTicket {
  _count: {
    images: number;
    comments: number;
  };
}
export interface AssignTicketRequest {
  assignAdminId: string;
}

// ===================================================================
// 14. ADMIN ENDPOINT TİPLERİ (`/api/admin`)
// (Eksik kısımlar eklendi)
// ===================================================================

// GET /api/admin/users yanıtı
export interface AdminUserSummary extends UserPublicInfo {
  _count: {
    boards: number;
    submittedTickets: number;
  };
}
// GET /api/admin/users/:userId yanıtı
export interface AdminUserDetailed extends UserPublicInfo {
  boards: {
    role: BoardRole;
    joinedAt: string;
    board: { id: string; name: string; };
  }[];
  submittedTickets: {
    id: string;
    subject: string;
    status: TicketStatus;
    createdAt: string;
  }[];
}
// GET /api/admin/boards yanıtı
export interface AdminBoardSummary {
  id: string;
  name: string;
  createdAt: string;
  _count: {
    members: number;
    lists: number;
  };
  createdBy?: { id: string; name: string; email: string; } | null;
}
export interface SystemStats {
  userCount: number;
  activeUserCount: number;
  boardCount: number;
  taskCount: number;
}
export interface ActivityLogDetailed {
  id: string;
  actionType: ActivityActionType;
  details?: string | null;
  timestamp: string;
  user?: UserAssigneeDto | null;
  board: { id: string; name: string; };
  task?: { id: string; title: string; } | null;
}
export interface PaginatedActivityLogs {
  activities: ActivityLogDetailed[];
  totalActivities: number;
  currentPage: number;
  totalPages: number;
}
export interface BulkMessageRequest {
  message: string;
  target: 'all' | string[]; // 'all' veya boardId dizisi
}

// ===================================================================
// 15. VIEW & REPORT ENDPOINT TİPLERİ
// (Tamamlanmış hali)
// ===================================================================

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  allDay: boolean;
  resource: {
    type: 'task' | 'checklistitem';
    priority?: TaskPriority;
    isCompleted?: boolean;
    boardName?: string;
    boardId?: string;
    taskId?: string;
    taskTitle?: string;
  };
}

export interface GanttTask {
  id: string;
  text: string;
  start_date?: string | null; // ISO 8601
  end_date?: string | null; // ISO 8601
  progress: number; // 0-1
  priority?: TaskPriority;
  assignees?: string[];
}

export interface GanttLink {
  id: string;
  source: string; // Engelleyen görev ID'si
  target: string; // Engellenen görev ID'si
  type: string; // "0" (Finish to Start)
}

export interface GanttData {
  data: GanttTask[];
  links: GanttLink[];
}

export interface BoardReportData {
  reportType: string;
  data: any; // Rapor tipine göre değişir (örn: { overdueCount: 10 } veya [{ status: 'APPROVED', count: 5 }])
}

export interface UserReportData {
  userId: string;
  timeEntries: {
    totalMinutes: number;
    entryCount: number;
  };
  completedTasks: number;
}
// ===================================================================
// 16. WEBHOOK TİPLERİ (`/api/webhooks`)
// (YENİ EKLENDİ)
// ===================================================================

// POST /api/webhooks
export interface CreateWebhookRequest {
  targetUrl: string;
  eventTypes: ActivityActionType[]; // Dinlenecek olay türleri
  boardId: string; // Hangi panoyla ilişkili olduğu
}

// GET /api/boards/:boardId/webhooks yanıtı
export interface Webhook {
  id: string;
  targetUrl: string;
  eventTypes: ActivityActionType[];
  isActive: boolean;
  boardId: string;
  createdById?: string | null;
  createdAt: string;
}


export interface FriendInfo {
  id: string;
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
  isOnline: boolean; // Aktiflik durumu
}

// GET /api/friends/requests yanıtında dönen istek bilgisi
export interface FriendRequestInfo {
  id: string; // İsteğin ID'si
  status: 'PENDING';
  createdAt: string;
  // İsteği gönderen (veya alan) kişi bilgisi
  requester?: UserAssigneeDto; // 'received' listesi için
  receiver?: UserAssigneeDto;  // 'sent' listesi için
}

// GET /api/friends/requests yanıtının tam yapısı
export interface FriendRequestResponse {
  received: FriendRequestInfo[];
  sent: FriendRequestInfo[];
}

// POST /api/friends/request body'si
export interface SendFriendRequest {
  identifier: string; // E-posta veya kullanıcı adı
}

// PUT /api/friends/requests/:requestId body'si
export interface RespondFriendRequest {
  response: 'ACCEPT' | 'DECLINE';
}
export interface FriendRequest {
  id: string;
  requesterId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED';
  createdAt: string;
}

export interface CreateTaskListRequest {
  title: string;
  boardId: string;
}