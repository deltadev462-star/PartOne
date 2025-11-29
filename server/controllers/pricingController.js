import prisma from '../configs/prisma.js';
import stripe from '../configs/stripe.js';
import { requireAuth } from '@clerk/express';

// Get all active pricing plans
export const getPricingPlans = async (req, res) => {
  try {
    const plans = await prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });
    
    res.status(200).json(plans);
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    res.status(500).json({ error: 'Failed to fetch pricing plans' });
  }
};

// Get user's current subscription
export const getUserSubscription = async (req, res) => {
  try {
    const { userId } = req.auth();
    
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE'
      },
      include: {
        plan: true
      }
    });
    
    res.status(200).json(subscription);
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
};

// Create Stripe checkout session
export const createCheckoutSession = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { planId, successUrl, cancelUrl } = req.body;
    
    // Get the plan details
    const plan = await prisma.pricingPlan.findUnique({
      where: { id: planId }
    });
    
    if (!plan || !plan.stripePriceId) {
      return res.status(400).json({ error: 'Invalid pricing plan' });
    }
    
    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE'
      }
    });
    
    if (existingSubscription) {
      return res.status(400).json({ error: 'User already has an active subscription' });
    }
    
    // Get or create Stripe customer
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    let stripeCustomerId;
    const existingCustomer = await prisma.subscription.findFirst({
      where: {
        userId,
        stripeCustomerId: { not: null }
      }
    });
    
    if (existingCustomer?.stripeCustomerId) {
      stripeCustomerId = existingCustomer.stripeCustomerId;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: userId
        }
      });
      stripeCustomerId = customer.id;
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.CLIENT_URL}/dashboard?success=true`,
      cancel_url: cancelUrl || `${process.env.CLIENT_URL}/pricing?cancelled=true`,
      metadata: {
        userId,
        planId
      }
    });
    
    res.status(200).json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const { userId } = req.auth();
    
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE'
      }
    });
    
    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }
    
    // Cancel subscription in Stripe
    const cancelledSubscription = await stripe.subscriptions.cancel(
      subscription.stripeSubscriptionId
    );
    
    // Update subscription in database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    });
    
    res.status(200).json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

// Check user's plan limits
export const checkPlanLimits = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { resource } = req.params; // 'projects', 'workspaces', or 'teamMembers'
    
    // Get user's current subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE'
      },
      include: {
        plan: true
      }
    });
    
    // If no subscription, use free plan
    let plan;
    if (!subscription) {
      plan = await prisma.pricingPlan.findUnique({
        where: { type: 'FREE' }
      });
    } else {
      plan = subscription.plan;
    }
    
    if (!plan) {
      return res.status(500).json({ error: 'No pricing plan found' });
    }
    
    // Count current usage
    let currentCount = 0;
    let maxLimit = 0;
    
    switch (resource) {
      case 'projects':
        const workspaces = await prisma.workspace.findMany({
          where: {
            members: {
              some: {
                userId,
                role: 'ADMIN'
              }
            }
          }
        });
        const workspaceIds = workspaces.map(w => w.id);
        currentCount = await prisma.project.count({
          where: {
            workspaceId: { in: workspaceIds }
          }
        });
        maxLimit = plan.maxProjects;
        break;
        
      case 'workspaces':
        currentCount = await prisma.workspace.count({
          where: { ownerId: userId }
        });
        maxLimit = plan.maxWorkspaces;
        break;
        
      case 'teamMembers':
        // Count team members across all user's workspaces
        const userWorkspaces = await prisma.workspace.findMany({
          where: { ownerId: userId },
          include: {
            members: true
          }
        });
        currentCount = userWorkspaces.reduce((total, workspace) => 
          total + workspace.members.length, 0
        );
        maxLimit = plan.maxTeamMembers;
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid resource type' });
    }
    
    const hasReachedLimit = currentCount >= maxLimit;
    
    res.status(200).json({
      resource,
      currentCount,
      maxLimit,
      hasReachedLimit,
      plan: {
        name: plan.name,
        type: plan.type
      }
    });
  } catch (error) {
    console.error('Error checking plan limits:', error);
    res.status(500).json({ error: 'Failed to check plan limits' });
  }
};

// Webhook handler for Stripe events
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // Create subscription in database
      await prisma.subscription.create({
        data: {
          userId: session.metadata.userId,
          planId: session.metadata.planId,
          stripeSubscriptionId: session.subscription,
          stripeCustomerId: session.customer,
          status: 'ACTIVE'
        }
      });
      break;
      
    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object;
      
      await prisma.subscription.updateMany({
        where: {
          stripeSubscriptionId: updatedSubscription.id
        },
        data: {
          status: updatedSubscription.status === 'active' ? 'ACTIVE' : 
                  updatedSubscription.status === 'canceled' ? 'CANCELLED' : 
                  'EXPIRED'
        }
      });
      break;
      
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      
      await prisma.subscription.updateMany({
        where: {
          stripeSubscriptionId: deletedSubscription.id
        },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          endDate: new Date()
        }
      });
      break;
  }

  res.status(200).json({ received: true });
};