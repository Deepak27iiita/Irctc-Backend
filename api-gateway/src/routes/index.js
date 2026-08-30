const express = require('express');
const { requireAuth } = require('../middlewares/auth.middleware');
const { createProxy, getCircuitBreakerStatus } = require('../services/proxy');
const {
     endpointRateLimit,
     combinedRateLimit
} = require('../middlewares/rateLimiting.middleware');
const { config } = require('../config');

const router = express.Router();

// ===========================
// Service Proxy Routes
// ===========================

/**
 * USER SERVICE ROUTES
 * Gateway Path: /api/users/auth/login
 * Service Path: /auth/login
 */

const userServiceProxy = createProxy(
     'userService',
     config.SERVICES.USER_SERVICE_URL
);

// ===========================
// USER SERVICE - Public Routes
// ===========================

router.post(
     '/users/auth/send-otp',
     endpointRateLimit(5, 3600000),
     userServiceProxy
);

router.post(
     '/users/auth/verify-otp',
     endpointRateLimit(10, 3600000),
     userServiceProxy
);

router.post(
     '/users/auth/login',
     endpointRateLimit(100, 900000),
     userServiceProxy
);

router.post(
     '/users/auth/google-auth',
     endpointRateLimit(10, 900000),
     userServiceProxy
);

router.post(
     '/users/auth/refresh',
     endpointRateLimit(20, 900000),
     userServiceProxy
);

// ===========================
// USER SERVICE - Private Routes
// ===========================

router.get(
     '/users/user/profile',
     requireAuth,
     combinedRateLimit(),
     userServiceProxy
);

router.put(
     '/users/user/profile',
     requireAuth,
     combinedRateLimit(),
     userServiceProxy
);

router.delete(
     '/users/user/profile',
     requireAuth,
     combinedRateLimit(),
     userServiceProxy
);

// ===========================
// ADMIN SERVICE ROUTES
// ===========================

const adminServiceProxy = createProxy(
     'adminService',
     config.SERVICES.ADMIN_SERVICE_URL
);

router.post(
     '/admins/stations/station',
     requireAuth,
     combinedRateLimit(),
     adminServiceProxy
);

router.get(
     '/admins/stations/station',
     requireAuth,
     combinedRateLimit(),
     adminServiceProxy
);

router.post(
     '/admins/trains/train',
     requireAuth,
     combinedRateLimit(),
     adminServiceProxy
);

router.get(
     '/admins/trains/train/:trainId',
     requireAuth,
     combinedRateLimit(),
     adminServiceProxy
);

router.post(
     '/admins/trains/route',
     requireAuth,
     combinedRateLimit(),
     adminServiceProxy
);

router.post(
     '/admins/schedules/schedule',
     requireAuth,
     combinedRateLimit(),
     adminServiceProxy
);

router.put(
     '/admins/schedules/schedule/:scheduleId',
     requireAuth,
     combinedRateLimit(),
     adminServiceProxy
);

// ===========================
// SEARCH SERVICE ROUTES
// Public - No Auth Required
// ===========================

const searchServiceProxy = createProxy(
     'searchService',
     config.SERVICES.SEARCH_SERVICE_URL
);

router.get(
     '/search/trains',
     endpointRateLimit(60, 60000),
     searchServiceProxy
);

router.get(
     '/search/autocomplete',
     endpointRateLimit(120, 60000),
     searchServiceProxy
);

// ===========================
// INVENTORY SERVICE ROUTES
// ===========================

const inventoryServiceProxy = createProxy(
     'inventoryService',
     config.SERVICES.INVENTORY_SERVICE_URL
);

// Public: Aggregate availability
router.get(
     '/inventory/schedules/:scheduleId/availability',
     endpointRateLimit(120, 60000),
     inventoryServiceProxy
);

// Authenticated: Individual seat statuses
router.get(
     '/inventory/schedules/:scheduleId/seats',
     requireAuth,
     combinedRateLimit(),
     inventoryServiceProxy
);

// Note: lock/unlock/confirm/cancel-booking are internal-only
// and are called directly by booking-service.

// ===========================
// BOOKING SERVICE ROUTES
// ===========================

const bookingServiceProxy = createProxy(
     'bookingService',
     config.SERVICES.BOOKING_SERVICE_URL
);

router.post(
     '/bookings/bookings',
     requireAuth,
     endpointRateLimit(5, 60000),
     bookingServiceProxy
);

router.get(
     '/bookings/bookings',
     requireAuth,
     combinedRateLimit(),
     bookingServiceProxy
);

router.get(
     '/bookings/bookings/:bookingId',
     requireAuth,
     combinedRateLimit(),
     bookingServiceProxy
);

router.post(
     '/bookings/bookings/:bookingId/verify-payment',
     requireAuth,
     combinedRateLimit(),
     bookingServiceProxy
);

router.post(
     '/bookings/bookings/:bookingId/cancel',
     requireAuth,
     combinedRateLimit(),
     bookingServiceProxy
);

// ===========================
// PAYMENT SERVICE ROUTES
// ===========================

const paymentServiceProxy = createProxy(
     'paymentService',
     config.SERVICES.PAYMENT_SERVICE_URL
);

// Razorpay webhook
// Public route - signature is verified by payment-service
router.post(
     '/payments/webhooks/razorpay',
     paymentServiceProxy
);

// ===========================
// GATEWAY HEALTH ROUTES
// ===========================

router.get('/gateway/health', (req, res) => {
     res.status(200).json({
          success: true,
          message: 'API Gateway is healthy',
          timestamp: new Date().toISOString()
     });
});

router.get('/gateway/circuit-breakers', (req, res) => {
     const status = getCircuitBreakerStatus();

     res.status(200).json({
          success: true,
          circuitBreakers: status
     });
});

module.exports = router;
