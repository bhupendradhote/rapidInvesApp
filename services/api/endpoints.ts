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

  // KYC Endpoints (auth:sanctum)
  KYC: {
    START: '/kyc/start',
    STATUS: '/kyc/status',
  },

  // Mobile Subscription & Razorpay (auth:sanctum)
  SUBSCRIPTION: {
    BASE: '/mobile/subscription',

    PLANS: '/mobile/subscription/plans',

    RAZORPAY: {
      INITIATE: '/mobile/subscription/razorpay/initiate',
      VERIFY: '/mobile/subscription/razorpay/verify',
    },

    CURRENT: '/mobile/subscription/current',

    INVOICES: {
      LIST: '/mobile/subscription/invoices',
      DOWNLOAD: (id: number | string) =>
        `/mobile/subscription/invoice/${id}/download`,
    },
  },
};
