import express from 'express';
import { requireAuth } from '@clerk/express';
import {
  getPricingPlans,
  getUserSubscription,
  createCheckoutSession,
  cancelSubscription,
  checkPlanLimits,
  handleStripeWebhook
} from '../controllers/pricingController.js';

const router = express.Router();

// Public route - get all pricing plans
router.get('/plans', getPricingPlans);

// Protected routes - require authentication
router.get('/subscription', requireAuth(), getUserSubscription);
router.post('/checkout', requireAuth(), createCheckoutSession);
router.post('/cancel', requireAuth(), cancelSubscription);
router.get('/check-limit/:resource', requireAuth(), checkPlanLimits);

// Stripe webhook - needs raw body, so should be configured separately in server.js
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;