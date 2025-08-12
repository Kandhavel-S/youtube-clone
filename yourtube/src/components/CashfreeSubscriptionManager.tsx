import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Check, Crown, Star, Diamond, CreditCard } from 'lucide-react';
import axiosInstance from '../lib/axiosinstance';
import { useUser } from '../lib/AuthContext';
import { toast } from 'sonner';

// Cashfree Web SDK
declare global {
  interface Window {
    Cashfree: any;
  }
}

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: number;
  watchTimeLimit: number;
  features: string[];
}

interface Subscription {
  plan: string;
  status: string;
  expiry: string;
  watchTimeLimit: number;
  monthlyWatchTime: number;
}

const CashfreeSubscriptionManager: React.FC = () => {
  const { user } = useUser();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    if (user) {
      fetchSubscriptionStatus();
    }
    
    // Load Cashfree SDK
    loadCashfreeSDK();
  }, [user]);

  const loadCashfreeSDK = () => {
    if (typeof window !== 'undefined' && !window.Cashfree) {
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      document.head.appendChild(script);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await axiosInstance.get('/cashfree-subscription/plans');
      setPlans(response.data.plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await axiosInstance.get('/cashfree-subscription/status');
      setSubscription(response.data.subscription);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      toast.error('Please login to subscribe');
      return;
    }

    setProcessingPlan(plan.id);

    try {
      // Create order with Cashfree
      const orderResponse = await axiosInstance.post('/cashfree-subscription/create-order', {
        plan: plan.id
      });

      const { order, subscriptionId } = orderResponse.data;
      console.log('Cashfree order created:', order);

      // Initialize Cashfree checkout
      if (typeof window !== 'undefined' && window.Cashfree) {
        const cashfree = new window.Cashfree({
          mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PROD' ? 'production' : 'sandbox'
        });

        const checkoutOptions = {
          paymentSessionId: order.payment_session_id,
          returnUrl: `${window.location.origin}/subscription/success?order_id=${order.order_id}&subscription_id=${subscriptionId}`,
          customer: {
            name: user.name,
            email: user.email,
            phone: user.mobile || '9999999999'
          },
          theme: {
            backgroundColor: '#ffffff',
            primaryColor: '#ff0000',
            primaryTextColor: '#ffffff'
          }
        };

        console.log('Opening Cashfree checkout with options:', checkoutOptions);
        
        cashfree.checkout(checkoutOptions).then((result: any) => {
          console.log('Cashfree checkout result:', result);
          
          if (result.error) {
            console.error('Cashfree checkout error:', result.error);
            toast.error('Payment failed: ' + result.error.message);
          } else if (result.redirect) {
            console.log('Payment completed, redirecting...');
            // Payment completed successfully
            handlePaymentSuccess(order.order_id);
          }
        }).catch((error: any) => {
          console.error('Cashfree checkout error:', error);
          toast.error('Payment initialization failed');
        });
      } else {
        toast.error('Payment system not loaded. Please refresh and try again.');
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.message || 'Failed to create subscription order');
    } finally {
      setProcessingPlan(null);
    }
  };

  const handlePaymentSuccess = async (orderId: string) => {
    try {
      // Verify payment with backend
      const verifyResponse = await axiosInstance.post('/cashfree-subscription/verify-payment', {
        order_id: orderId
      });

      if (verifyResponse.data.success) {
        toast.success('Subscription activated successfully!');
        fetchSubscriptionStatus(); // Refresh subscription status
      } else {
        toast.error('Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification failed:', error);
      toast.error('Payment verification failed');
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'bronze': return <Star className="w-6 h-6 text-orange-500" />;
      case 'silver': return <Crown className="w-6 h-6 text-gray-500" />;
      case 'gold': return <Diamond className="w-6 h-6 text-yellow-500" />;
      default: return null;
    }
  };

  const getCurrentPlanBadge = (planId: string) => {
    if (subscription?.plan === planId && subscription?.status === 'active') {
      return <Badge className="bg-green-500">Current Plan</Badge>;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Upgrade your experience with our premium subscription plans
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
          <CreditCard className="w-4 h-4" />
          <span>Powered by Cashfree - Save up to 25% on transaction fees</span>
        </div>
      </div>

      {/* Current Subscription Status */}
      {subscription && (
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">Current Subscription</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <span>Plan: <strong className="capitalize">{subscription.plan}</strong></span>
            <span>Status: <strong className="capitalize">{subscription.status}</strong></span>
            {subscription.expiry && (
              <span>Expires: <strong>{new Date(subscription.expiry).toLocaleDateString()}</strong></span>
            )}
          </div>
          {subscription.watchTimeLimit > 0 && (
            <div className="mt-2">
              <span className="text-sm">
                Watch time used: <strong>{subscription.monthlyWatchTime}/{subscription.watchTimeLimit} minutes</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Free Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Check className="w-6 h-6 text-green-500" />
                Free
              </CardTitle>
              {subscription?.plan === 'free' && <Badge>Current</Badge>}
            </div>
            <CardDescription>
              <span className="text-2xl font-bold">₹0</span>
              <span className="text-sm">/month</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                5 minutes per video
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Standard quality
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Premium Plans */}
        {plans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getPlanIcon(plan.id)}
                  {plan.name}
                </CardTitle>
                {getCurrentPlanBadge(plan.id)}
              </div>
              <CardDescription>
                <span className="text-2xl font-bold">₹{plan.price}</span>
                <span className="text-sm">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm mb-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={processingPlan === plan.id || subscription?.plan === plan.id}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {processingPlan === plan.id ? 'Processing...' : 
                 subscription?.plan === plan.id ? 'Active' : 'Subscribe with Cashfree'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>✅ Secure payments powered by Cashfree</p>
        <p>✅ Lower transaction fees - More value for your money</p>
        <p>✅ Instant activation & email invoice</p>
      </div>
    </div>
  );
};

export default CashfreeSubscriptionManager;
