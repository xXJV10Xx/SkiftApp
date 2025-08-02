import { supabase, Database } from './supabase';
import { 
  createPaymentIntent, 
  createSubscription, 
  updateSubscription, 
  cancelSubscription,
  getPaymentMethods,
  savePaymentMethod,
  deletePaymentMethod,
  formatCurrency,
  SUBSCRIPTION_PLANS,
  type PaymentMethodType,
  type SubscriptionPlan,
  type PaymentMethod
} from './stripe';

// Types for payment service
export interface PaymentData {
  id: string;
  companyId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  paymentMethod: PaymentMethodType;
  description?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionData {
  id: string;
  companyId: string;
  stripeSubscriptionId?: string;
  planName: string;
  planPrice: number;
  billingPeriod: 'monthly' | 'yearly';
  employeeLimit: number;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceData {
  id: string;
  companyId: string;
  subscriptionId?: string;
  stripeInvoiceId?: string;
  invoiceNumber: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate?: string;
  paidAt?: string;
  invoicePdf?: string;
  hostedInvoiceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

class PaymentService {
  // Get company's current subscription
  async getCompanySubscription(companyId: string): Promise<SubscriptionData | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      companyId: data.company_id!,
      stripeSubscriptionId: data.stripe_subscription_id || undefined,
      planName: data.plan_name,
      planPrice: data.plan_price,
      billingPeriod: data.billing_period as 'monthly' | 'yearly',
      employeeLimit: data.employee_limit,
      status: data.status as any,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // Create new subscription
  async createCompanySubscription(
    companyId: string, 
    planId: string, 
    paymentMethodId: string
  ): Promise<SubscriptionData> {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    try {
      // Create subscription with Stripe
      const stripeSubscription = await createSubscription({
        companyId,
        planId,
        paymentMethodId,
      });

      // Calculate period dates (assuming monthly for now)
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      // Save subscription to Supabase
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          company_id: companyId,
          stripe_subscription_id: stripeSubscription.subscriptionId,
          plan_name: plan.name,
          plan_price: plan.price,
          billing_period: plan.billingPeriod,
          employee_limit: plan.employeeLimit,
          status: stripeSubscription.status as any,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save subscription: ${error.message}`);
      }

      return {
        id: data.id,
        companyId: data.company_id!,
        stripeSubscriptionId: data.stripe_subscription_id || undefined,
        planName: data.plan_name,
        planPrice: data.plan_price,
        billingPeriod: data.billing_period as 'monthly' | 'yearly',
        employeeLimit: data.employee_limit,
        status: data.status as any,
        currentPeriodStart: data.current_period_start,
        currentPeriodEnd: data.current_period_end,
        cancelAtPeriodEnd: data.cancel_at_period_end,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error}`);
    }
  }

  // Update subscription plan
  async updateCompanySubscription(
    subscriptionId: string, 
    planId?: string, 
    cancelAtPeriodEnd?: boolean
  ): Promise<SubscriptionData> {
    try {
      // Get current subscription
      const { data: currentSub, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch subscription: ${fetchError.message}`);
      }

      // Update with Stripe
      await updateSubscription({
        subscriptionId: currentSub.stripe_subscription_id!,
        planId,
        cancelAtPeriodEnd,
      });

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (planId) {
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
        if (plan) {
          updateData.plan_name = plan.name;
          updateData.plan_price = plan.price;
          updateData.billing_period = plan.billingPeriod;
          updateData.employee_limit = plan.employeeLimit;
        }
      }

      if (cancelAtPeriodEnd !== undefined) {
        updateData.cancel_at_period_end = cancelAtPeriodEnd;
      }

      // Update in Supabase
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update subscription: ${error.message}`);
      }

      return {
        id: data.id,
        companyId: data.company_id!,
        stripeSubscriptionId: data.stripe_subscription_id || undefined,
        planName: data.plan_name,
        planPrice: data.plan_price,
        billingPeriod: data.billing_period as 'monthly' | 'yearly',
        employeeLimit: data.employee_limit,
        status: data.status as any,
        currentPeriodStart: data.current_period_start,
        currentPeriodEnd: data.current_period_end,
        cancelAtPeriodEnd: data.cancel_at_period_end,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      throw new Error(`Failed to update subscription: ${error}`);
    }
  }

  // Cancel subscription
  async cancelCompanySubscription(subscriptionId: string): Promise<void> {
    try {
      const { data: subscription, error: fetchError } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('id', subscriptionId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch subscription: ${fetchError.message}`);
      }

      // Cancel with Stripe
      await cancelSubscription(subscription.stripe_subscription_id!);

      // Update in Supabase
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) {
        throw new Error(`Failed to update subscription status: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error}`);
    }
  }

  // Process payment
  async processPayment(
    companyId: string,
    amount: number,
    currency: string,
    paymentMethod: PaymentMethodType,
    description?: string,
    subscriptionId?: string
  ): Promise<PaymentData> {
    try {
      // Create payment intent
      const paymentIntent = await createPaymentIntent({
        amount,
        currency,
        companyId,
        subscriptionId,
        description,
        paymentMethodTypes: [paymentMethod],
      });

      // Save payment to Supabase
      const { data, error } = await supabase
        .from('payments')
        .insert({
          company_id: companyId,
          subscription_id: subscriptionId,
          stripe_payment_intent_id: paymentIntent.paymentIntentId,
          amount,
          currency,
          status: 'pending',
          payment_method: paymentMethod,
          description,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save payment: ${error.message}`);
      }

      return {
        id: data.id,
        companyId: data.company_id!,
        subscriptionId: data.subscription_id || undefined,
        amount: data.amount,
        currency: data.currency,
        status: data.status as any,
        paymentMethod: data.payment_method as PaymentMethodType,
        description: data.description || undefined,
        receiptUrl: data.receipt_url || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      throw new Error(`Failed to process payment: ${error}`);
    }
  }

  // Update payment status
  async updatePaymentStatus(
    paymentId: string, 
    status: 'succeeded' | 'failed' | 'canceled',
    receiptUrl?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .update({
        status,
        receipt_url: receiptUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    if (error) {
      throw new Error(`Failed to update payment status: ${error.message}`);
    }
  }

  // Get company payments
  async getCompanyPayments(companyId: string, limit: number = 50): Promise<PaymentData[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch payments: ${error.message}`);
    }

    return data.map(payment => ({
      id: payment.id,
      companyId: payment.company_id!,
      subscriptionId: payment.subscription_id || undefined,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status as any,
      paymentMethod: payment.payment_method as PaymentMethodType,
      description: payment.description || undefined,
      receiptUrl: payment.receipt_url || undefined,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
    }));
  }

  // Get company invoices
  async getCompanyInvoices(companyId: string, limit: number = 50): Promise<InvoiceData[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }

    return data.map(invoice => ({
      id: invoice.id,
      companyId: invoice.company_id!,
      subscriptionId: invoice.subscription_id || undefined,
      stripeInvoiceId: invoice.stripe_invoice_id || undefined,
      invoiceNumber: invoice.invoice_number,
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status as any,
      dueDate: invoice.due_date || undefined,
      paidAt: invoice.paid_at || undefined,
      invoicePdf: invoice.invoice_pdf || undefined,
      hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at,
    }));
  }

  // Save payment method
  async saveCompanyPaymentMethod(
    companyId: string,
    stripePaymentMethodId: string,
    type: PaymentMethodType,
    cardDetails?: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    },
    isDefault: boolean = false
  ): Promise<void> {
    try {
      // Save to Stripe
      await savePaymentMethod(stripePaymentMethodId, companyId);

      // Save to Supabase
      const { error } = await supabase
        .from('payment_methods')
        .insert({
          company_id: companyId,
          stripe_payment_method_id: stripePaymentMethodId,
          type,
          card_brand: cardDetails?.brand,
          card_last4: cardDetails?.last4,
          card_exp_month: cardDetails?.expMonth,
          card_exp_year: cardDetails?.expYear,
          is_default: isDefault,
        });

      if (error) {
        throw new Error(`Failed to save payment method: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`Failed to save payment method: ${error}`);
    }
  }

  // Get company payment methods
  async getCompanyPaymentMethods(companyId: string): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch payment methods: ${error.message}`);
    }

    return data.map(pm => ({
      id: pm.id,
      type: pm.type as PaymentMethodType,
      card: pm.card_brand ? {
        brand: pm.card_brand,
        last4: pm.card_last4!,
        expMonth: pm.card_exp_month!,
        expYear: pm.card_exp_year!,
      } : undefined,
      isDefault: pm.is_default,
    }));
  }

  // Delete payment method
  async deleteCompanyPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      // Get the Stripe payment method ID
      const { data: paymentMethod, error: fetchError } = await supabase
        .from('payment_methods')
        .select('stripe_payment_method_id')
        .eq('id', paymentMethodId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch payment method: ${fetchError.message}`);
      }

      // Delete from Stripe
      if (paymentMethod.stripe_payment_method_id) {
        await deletePaymentMethod(paymentMethod.stripe_payment_method_id);
      }

      // Delete from Supabase
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodId);

      if (error) {
        throw new Error(`Failed to delete payment method: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`Failed to delete payment method: ${error}`);
    }
  }

  // Get payment statistics
  async getPaymentStatistics(companyId: string): Promise<{
    totalRevenue: number;
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    averagePayment: number;
  }> {
    const { data, error } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('company_id', companyId);

    if (error) {
      throw new Error(`Failed to fetch payment statistics: ${error.message}`);
    }

    const totalPayments = data.length;
    const successfulPayments = data.filter(p => p.status === 'succeeded').length;
    const failedPayments = data.filter(p => p.status === 'failed').length;
    const totalRevenue = data
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amount, 0);
    const averagePayment = successfulPayments > 0 ? totalRevenue / successfulPayments : 0;

    return {
      totalRevenue,
      totalPayments,
      successfulPayments,
      failedPayments,
      averagePayment,
    };
  }

  // Export payment data
  async exportPaymentData(
    companyId: string,
    format: 'csv' | 'json' | 'pdf',
    dateFrom?: string,
    dateTo?: string
  ): Promise<string> {
    let query = supabase
      .from('payments')
      .select(`
        *,
        subscriptions(plan_name)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch payment data for export: ${error.message}`);
    }

    // Format the data based on requested format
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      const headers = [
        'ID', 'Amount', 'Currency', 'Status', 'Payment Method', 
        'Description', 'Plan', 'Created At'
      ];
      
      const csvRows = [
        headers.join(','),
        ...data.map(payment => [
          payment.id,
          formatCurrency(payment.amount, payment.currency),
          payment.currency,
          payment.status,
          payment.payment_method,
          payment.description || '',
          payment.subscriptions?.plan_name || '',
          new Date(payment.created_at).toLocaleDateString('sv-SE')
        ].join(','))
      ];
      
      return csvRows.join('\n');
    } else {
      // For PDF, return HTML that can be converted to PDF
      const htmlContent = `
        <html>
          <head>
            <title>Payment Report - ${new Date().toLocaleDateString('sv-SE')}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 30px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Payment Report</h1>
              <p>Generated on ${new Date().toLocaleDateString('sv-SE')}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment Method</th>
                  <th>Description</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                ${data.map(payment => `
                  <tr>
                    <td>${payment.id}</td>
                    <td>${formatCurrency(payment.amount, payment.currency)}</td>
                    <td>${payment.status}</td>
                    <td>${payment.payment_method}</td>
                    <td>${payment.description || ''}</td>
                    <td>${new Date(payment.created_at).toLocaleDateString('sv-SE')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      return htmlContent;
    }
  }
}

export const paymentService = new PaymentService();