// ============================================
// BOOKING SYSTEM - TYPE DEFINITIONS
// ============================================

/**
 * Booking status enum
 */
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

/**
 * Room availability status
 */
export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

/**
 * Room type enum
 */
export enum RoomType {
  COMPUTER_LAB = 'computer_lab',
  LECTURE_ROOM = 'lecture_room',
  MEETING_ROOM = 'meeting_room',
  STUDY_ROOM = 'study_room',
  LABORATORY = 'laboratory',
}

/**
 * Time slot interface
 */
export interface TimeSlot {
  start: string; // HH:mm format
  end: string;   // HH:mm format
  available: boolean;
}

/**
 * Room facility interface
 */
export interface RoomFacility {
  id: string;
  name: string;
  icon: string;
  available: boolean;
}

/**
 * Room interface
 */
export interface Room {
  id: string;
  name: string;
  description?: string;
  type: RoomType;
  capacity: number;
  floor: number;
  building: string;
  location: string;
  imageUrl?: string;
  status: RoomStatus;
  facilities: RoomFacility[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Booking form data interface
 */
export interface BookingFormData {
  roomId?: string;
  title: string;
  date: string;
  timeSlot: string;
  participants: number;
  additionalNotes: string;
  needProjector: boolean;
}

/**
 * Booking interface (database model)
 */
export interface Booking {
  id: string;
  bookingNumber: string;
  roomId: string;
  userId: string;
  title: string;
  date: string;
  timeSlot: string;
  participants: number;
  additionalNotes?: string;
  needProjector: boolean;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  cancelReason?: string;
}

/**
 * Booking with room details (for display)
 */
export interface BookingWithRoom extends Booking {
  room: Room;
}

/**
 * User interface (simplified)
 */
export interface User {
  id: string;
  email: string;
  name: string;
  studentId?: string;
  department?: string;
  role: 'student' | 'teacher' | 'staff' | 'admin';
  createdAt: Date;
}

/**
 * Booking request body
 */
export interface CreateBookingRequest {
  roomId: string;
  title: string;
  date: string;
  timeSlot: string;
  participants: number;
  additionalNotes?: string;
  needProjector?: boolean;
}

/**
 * Booking response
 */
export interface BookingResponse {
  success: boolean;
  message: string;
  data?: Booking;
  errors?: ValidationErrors;
}

/**
 * List bookings response
 */
export interface BookingsListResponse {
  success: boolean;
  data: BookingWithRoom[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Validation errors
 */
export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Form field error
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Room availability query params
 */
export interface RoomAvailabilityQuery {
  roomId: string;
  date: string;
  duration?: number; // hours
}

/**
 * Room availability response
 */
export interface RoomAvailabilityResponse {
  available: boolean;
  timeSlots: TimeSlot[];
  bookings: {
    timeSlot: string;
    title: string;
    participants: number;
  }[];
}

/**
 * Booking statistics
 */
export interface BookingStatistics {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  popularRooms: {
    roomId: string;
    roomName: string;
    bookingCount: number;
  }[];
  peakHours: {
    hour: number;
    bookingCount: number;
  }[];
}

/**
 * Notification interface
 */
export interface BookingNotification {
  id: string;
  userId: string;
  bookingId: string;
  type: 'created' | 'confirmed' | 'reminder' | 'cancelled';
  message: string;
  read: boolean;
  createdAt: Date;
}

/**
 * Booking filters
 */
export interface BookingFilters {
  status?: BookingStatus;
  roomType?: RoomType;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

/**
 * Dashboard summary
 */
export interface DashboardSummary {
  user: User;
  upcomingBookings: BookingWithRoom[];
  statistics: BookingStatistics;
  notifications: BookingNotification[];
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Partial booking for updates
 */
export type BookingUpdate = Partial<Omit<Booking, 'id' | 'bookingNumber' | 'userId' | 'createdAt'>>;

/**
 * Room search query
 */
export interface RoomSearchQuery {
  query?: string;
  type?: RoomType;
  minCapacity?: number;
  building?: string;
  floor?: number;
  available?: boolean;
  facilities?: string[];
}

/**
 * Pagination params
 */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Sort params
 */
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Time slots available for booking (8 AM - 8 PM)
 */
export const AVAILABLE_TIME_SLOTS: string[] = [
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
  '18:00 - 19:00',
  '19:00 - 20:00',
];

/**
 * Maximum participants per room
 */
export const MAX_PARTICIPANTS = 42;

/**
 * Minimum participants required
 */
export const MIN_PARTICIPANTS = 1;

/**
 * Maximum booking advance period (days)
 */
export const MAX_BOOKING_ADVANCE_DAYS = 90;

/**
 * Minimum cancellation notice (hours)
 */
export const MIN_CANCELLATION_NOTICE_HOURS = 24;

/**
 * Booking status colors
 */
export const STATUS_COLORS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: '#F59E0B',     // Amber
  [BookingStatus.CONFIRMED]: '#10B981',   // Green
  [BookingStatus.CANCELLED]: '#EF4444',   // Red
  [BookingStatus.COMPLETED]: '#6B7280',   // Gray
  [BookingStatus.NO_SHOW]: '#8B5CF6',     // Purple
};

/**
 * Room type labels (Thai)
 */
export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  [RoomType.COMPUTER_LAB]: 'ห้องปฏิบัติการคอมพิวเตอร์',
  [RoomType.LECTURE_ROOM]: 'ห้องบรรยาย',
  [RoomType.MEETING_ROOM]: 'ห้องประชุม',
  [RoomType.STUDY_ROOM]: 'ห้องศึกษาค้นคว้า',
  [RoomType.LABORATORY]: 'ห้องปฏิบัติการ',
};

/**
 * Booking status labels (Thai)
 */
export const STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'รอยืนยัน',
  [BookingStatus.CONFIRMED]: 'ยืนยันแล้ว',
  [BookingStatus.CANCELLED]: 'ยกเลิกแล้ว',
  [BookingStatus.COMPLETED]: 'เสร็จสิ้น',
  [BookingStatus.NO_SHOW]: 'ไม่มาใช้บริการ',
};