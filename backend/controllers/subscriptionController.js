// Subscription Controller
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class SubscriptionController {
  // Get user subscription status
  static async getSubscription(req, res) {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', req.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        return res.status(500).json({
          error: 'Failed to get subscription',
          code: 'DATABASE_ERROR',
          details: error.message
        });
      }

      // If no subscription exists, create a free one
      if (!subscription) {
        const { data: newSubscription, error: createError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: req.user.id,
            plan: 'free',
            status: 'active'
          })
          .select()
          .single();

        if (createError) {
          return res.status(500).json({
            error: 'Failed to create subscription',
            code: 'DATABASE_ERROR',
            details: createError.message
          });
        }

        return res.json({
          subscription: newSubscription,
          features: getFeaturesByPlan('free')
        });
      }

      res.json({
        subscription,
        features: getFeaturesByPlan(subscription.plan)
      });

    } catch (error) {
      console.error('Get subscription error:', error);
      res.status(500).json({
        error: 'Failed to get subscription',
        code: 'DATABASE_ERROR'
      });
    }
  }

  // Create checkout session for subscription upgrade
  static async createCheckoutSession(req, res) {
    try {
      const { plan, success_url, cancel_url } = req.body;

      if (!['basic', 'premium'].includes(plan)) {
        return res.status(400).json({
          error: 'Invalid plan. Must be basic or premium',
          code: 'INVALID_PLAN'
        });
      }

      // Get current subscription
      const { data: currentSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', req.user.id)
        .single();

      if (currentSubscription?.plan === plan) {
        return res.status(400).json({
          error: 'Already subscribed to this plan',
          code: 'ALREADY_SUBSCRIBED'
        });
      }

      // In a real implementation, you would create a Stripe checkout session here
      // For now, we'll simulate the process
      const sessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}`;

      // Store pending subscription upgrade
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: req.user.id,
          plan: currentSubscription?.plan || 'free',
          status: 'pending_upgrade',
          stripe_subscription_id: sessionId,
          updated_at: new Date().toISOString()
        });

      res.json({
        checkout_url: checkoutUrl,
        session_id: sessionId,
        plan,
        amount: plan === 'basic' ? 3900 : 9900, // in öre (Swedish cents)
        currency: 'SEK'
      });

    } catch (error) {
      console.error('Create checkout session error:', error);
      res.status(500).json({
        error: 'Failed to create checkout session',
        code: 'PAYMENT_ERROR'
      });
    }
  }

  // Handle successful payment (webhook endpoint)
  static async handlePaymentSuccess(req, res) {
    try {
      const { session_id, plan } = req.body;

      if (!session_id || !plan) {
        return res.status(400).json({
          error: 'Missing session_id or plan',
          code: 'INVALID_INPUT'
        });
      }

      // Find subscription by session ID
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', session_id)
        .single();

      if (!subscription) {
        return res.status(404).json({
          error: 'Subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        });
      }

      // Update subscription to active
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const { data: updatedSubscription, error } = await supabase
        .from('subscriptions')
        .update({
          plan,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', subscription.id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          error: 'Failed to update subscription',
          code: 'DATABASE_ERROR',
          details: error.message
        });
      }

      res.json({
        message: 'Subscription activated successfully',
        subscription: updatedSubscription,
        features: getFeaturesByPlan(plan)
      });

    } catch (error) {
      console.error('Handle payment success error:', error);
      res.status(500).json({
        error: 'Failed to process payment',
        code: 'PAYMENT_ERROR'
      });
    }
  }

  // Cancel subscription
  static async cancelSubscription(req, res) {
    try {
      const { immediate = false } = req.body;

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', req.user.id)
        .single();

      if (!subscription) {
        return res.status(404).json({
          error: 'No subscription found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        });
      }

      if (subscription.plan === 'free') {
        return res.status(400).json({
          error: 'Cannot cancel free plan',
          code: 'INVALID_OPERATION'
        });
      }

      const updateData = immediate ? {
        plan: 'free',
        status: 'canceled',
        current_period_end: new Date().toISOString(),
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      } : {
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      };

      const { data: updatedSubscription, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscription.id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          error: 'Failed to cancel subscription',
          code: 'DATABASE_ERROR',
          details: error.message
        });
      }

      res.json({
        message: immediate ? 'Subscription canceled immediately' : 'Subscription will cancel at period end',
        subscription: updatedSubscription,
        features: getFeaturesByPlan(immediate ? 'free' : subscription.plan)
      });

    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({
        error: 'Failed to cancel subscription',
        code: 'DATABASE_ERROR'
      });
    }
  }

  // Get subscription plans and pricing
  static async getPlans(req, res) {
    try {
      const plans = {
        free: {
          name: 'Free',
          price: 0,
          currency: 'SEK',
          interval: 'month',
          features: getFeaturesByPlan('free'),
          limits: {
            teams_viewable: 1,
            chat_messages_per_day: 0,
            calendar_export: false,
            advanced_statistics: false
          }
        },
        basic: {
          name: 'Basic',
          price: 39,
          currency: 'SEK',
          interval: 'month',
          features: getFeaturesByPlan('basic'),
          limits: {
            teams_viewable: 5,
            chat_messages_per_day: 100,
            calendar_export: true,
            advanced_statistics: true
          }
        },
        premium: {
          name: 'Premium',
          price: 99,
          currency: 'SEK',
          interval: 'month',
          features: getFeaturesByPlan('premium'),
          limits: {
            teams_viewable: 'unlimited',
            chat_messages_per_day: 'unlimited',
            calendar_export: true,
            advanced_statistics: true,
            calendar_sync: true,
            push_notifications: true,
            priority_support: true
          }
        }
      };

      res.json({ plans });

    } catch (error) {
      console.error('Get plans error:', error);
      res.status(500).json({
        error: 'Failed to get plans',
        code: 'DATABASE_ERROR'
      });
    }
  }

  // Check feature access
  static async checkFeatureAccess(req, res) {
    try {
      const { feature } = req.params;

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', req.user.id)
        .single();

      const plan = subscription?.plan || 'free';
      const features = getFeaturesByPlan(plan);
      const hasAccess = features.includes(feature);

      res.json({
        feature,
        plan,
        has_access: hasAccess,
        subscription_status: subscription?.status || 'inactive'
      });

    } catch (error) {
      console.error('Check feature access error:', error);
      res.status(500).json({
        error: 'Failed to check feature access',
        code: 'DATABASE_ERROR'
      });
    }
  }
}

// Helper function to get features by plan
function getFeaturesByPlan(plan) {
  const features = {
    free: [
      'basic_schedule',
      'own_team_view',
      'basic_statistics'
    ],
    basic: [
      'basic_schedule',
      'own_team_view',
      'basic_statistics',
      'all_teams_view',
      'team_chat',
      'csv_export',
      'advanced_statistics'
    ],
    premium: [
      'basic_schedule',
      'own_team_view',
      'basic_statistics',
      'all_teams_view',
      'team_chat',
      'csv_export',
      'advanced_statistics',
      'calendar_sync',
      'push_notifications',
      'priority_support',
      'custom_notifications',
      'data_insights',
      'shift_trading'
    ]
  };

  return features[plan] || features.free;
}

module.exports = SubscriptionController;