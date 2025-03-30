import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { SubscriptionPlan } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/layout/Header';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ planId }: { planId: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: window.location.origin + '/dashboard?subscription=success',
        },
      });
      
      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Create a subscription in our database
        try {
          const response = await apiRequest("POST", "/api/record-subscription-payment", { 
            paymentIntentId: paymentIntent.id,
            planId: planId
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error("Error recording subscription:", errorData);
            // Still show success to user since payment worked
          }
          
          toast({
            title: "Payment Successful",
            description: "Thank you for your subscription!",
          });
          
          setLocation('/dashboard?subscription=success');
        } catch (err) {
          console.error("Error recording subscription:", err);
          // Still redirect to success since the payment worked
          setLocation('/dashboard?subscription=success');
        }
      } else {
        // This shouldn't happen with redirect: 'if_required'
        setLocation('/dashboard?subscription=success');
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Complete Subscription'
        )}
      </Button>
    </form>
  );
};

function Success() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="rounded-full bg-green-100 p-3 mb-4">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Subscription Successful!</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6 text-center max-w-md">
        Thank you for subscribing. Your account has been upgraded and you now have access to all the premium features.
      </p>
      <Button onClick={() => setLocation('/dashboard')}>
        Go to Dashboard
      </Button>
    </div>
  );
}

function CheckoutContainer() {
  const { planName } = useParams<{ planName: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  
  // Query to get plans
  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
  });
  
  const plan = plans?.find(p => p.tier === planName || 
    p.name.toLowerCase() === planName || 
    (planName === 'pro' && p.tier === 'basic') || 
    (planName === 'teams' && p.tier === 'premium'));
  
  useEffect(() => {
    // If we have plans data but couldn't find a matching plan
    if (plans && !plan) {
      toast({
        title: "Plan Not Found",
        description: "The subscription plan you selected does not exist.",
        variant: "destructive",
      });
      setLocation('/pricing');
    }
  }, [plan, plans, setLocation, toast]);
  
  // If payment success query param is present, show success
  if (new URLSearchParams(window.location.search).get('subscription') === 'success') {
    return <Success />;
  }
  
  if (plansLoading || !plan) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const handleCreateSubscription = async () => {
    try {
      setPaymentStatus('processing');
      
      // First create a customer if needed
      const customerResponse = await apiRequest("POST", "/api/create-customer");
      if (!customerResponse.ok) {
        const errorData = await customerResponse.json();
        throw new Error(errorData.error || "Failed to create customer");
      }
      
      // Then create the subscription payment intent
      const subscriptionResponse = await apiRequest("POST", "/api/create-subscription", { 
        planId: plan.id
      });
      
      const data = await subscriptionResponse.json();
      if (!subscriptionResponse.ok) {
        throw new Error(data.error || "Failed to create subscription payment");
      }
      
      if (!data.clientSecret) {
        throw new Error("No client secret returned from server");
      }
      
      console.log("Payment intent created successfully:", {
        planName: data.planName,
        planPrice: data.planPrice
      });
      
      setClientSecret(data.clientSecret);
      setPaymentStatus('success');
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error Setting Up Payment",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setPaymentStatus('error');
    }
  };
  
  return (
    <div className="max-w-md mx-auto my-12">
      <Button 
        variant="ghost" 
        className="mb-8"
        onClick={() => setLocation('/pricing')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Pricing
      </Button>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Subscribe to {plan.name}</CardTitle>
          <CardDescription>
            Complete your subscription to get access to premium features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Plan</div>
            <div className="text-lg font-medium">{plan.name}</div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">${plan.price / 100}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">per month</div>
            </div>
          </div>
          
          <div className="border-t pt-4 mb-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Includes:</div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Up to {plan.maxApplications} applications</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Up to {plan.maxArtists} artists</span>
              </li>
              {plan.features?.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm planId={plan.id} />
            </Elements>
          )}
          
          {!clientSecret && (
            <Button 
              className="w-full"
              onClick={handleCreateSubscription}
              disabled={paymentStatus === 'processing'}
            >
              {paymentStatus === 'processing' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Continue to Payment'
              )}
            </Button>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 items-start">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Your subscription will renew automatically every month. You can cancel anytime.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function Checkout() {
  // Add Header to make the page look consistent with the rest of the app
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 pt-16">
        <CheckoutContainer />
      </div>
    </div>
  );
}