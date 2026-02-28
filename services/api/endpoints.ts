export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register/details',
    SEND_OTP: '/auth/register/phone',
    VERIFY_OTP: '/auth/register/verify-otp',
    VERIFY_EMAIL: '/auth/verify-email',
    LOGOUT: '/auth/logout',
    PROFILE: '/user',
  },

  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/update',
  },

  // Added Profile Endpoints
  PROFILE: {
    GET: '/profile',
    UPDATE: '/profile/update',
    OTP_SEND: '/profile/otp/send',
    OTP_VERIFY: '/profile/otp/verify',
    PASSWORD: {
      SEND_OTP: '/profile/password/send-otp',
      VERIFY_OTP: '/profile/password/verify-otp',
      UPDATE: '/profile/password/update',
    },
  },

  // Notification Bell Icon / Quick Actions
  NOTIFICATIONS: {
    UNSEEN: '/notifications/unseen',
    MARK_READ: (id: number | string) => `/notifications/mark-read/${id}`,
  },

  // Full Notification Management (user/notifications prefix)
  USER_NOTIFICATIONS: {
    LIST: '/user/notifications',
    READ: '/user/notifications/read',
    READ_ALL: '/user/notifications/read-all',
    DELETE: '/user/notifications/delete',
    UNREAD_COUNT: '/user/notifications/unread-count',
  },

  MARKET: {
    STOCKS: '/market/stocks',
  },

  SERVICE_PLANS: {
    LIST: '/service-plans',
    DETAILS: (id: number | string) => `/service-plans/${id}`,
  },

  CUSTOMER_PROFILE: {
    GET_PROFILE: '/customer/profile',
  },

  NEWS: {
    LIST: '/news',
    CREATE: '/news',
    DETAILS: (id: number | string) => `/news/${id}`,
    CATEGORIES: {
      LIST: '/news/categories',
      CREATE: '/news/categories',
      DETAILS: (id: number | string) => `/news/categories/${id}`,
    },
  },

  BLOGS: {
    LIST: '/blogs',
    CREATE: '/blogs',
    DETAILS: (id: number | string) => `/blogs/${id}`,
  },

  // Announcements
  ANNOUNCEMENTS: {
    LIST: '/announcements',
    ACTIVE: '/announcements/active',
    DETAILS: (id: number | string) => `/announcements/${id}`,
  },

  // KYC Endpoints (auth:sanctum)
  KYC: {
    START: '/kyc/start',
    STATUS: '/kyc/status',
  },

  // Mobile Subscription & Razorpay (auth:sanctum)
  SUBSCRIPTION: {
    BASE: '/mobile/subscription',
    PLANS: '/mobile/subscription/plans',
    COUPONS: '/mobile/subscription/coupons',
    APPLY_COUPON: '/mobile/subscription/apply-coupon',
    RAZORPAY: {
      INITIATE: '/mobile/subscription/razorpay/initiate',
      VERIFY: '/mobile/subscription/razorpay/verify',
    },
    CURRENT: '/mobile/subscription/current',
    INVOICES: {
      LIST: '/mobile/subscription/invoices',
      DOWNLOAD: (id: number | string) => `/mobile/subscription/invoice/${id}/download`,
    },
  },

  // Tickets (auth:sanctum)
  TICKETS: {
    LIST: '/ticket/list',
    STORE: '/ticket/store',
    DETAILS: (id: number | string) => `/ticket/${id}`,
  },

  // User Chat Api (auth:sanctum)
  CHAT: {
    HISTORY: '/chat/history',
    SEND: '/chat/send',
    NOTIFICATIONS: {
      MARK_READ: (id: number | string) => `/chat/notifications/read/${id}`,
      READ_ALL: '/chat/notifications/read-all',
    },
  },
};