import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Check, X } from 'lucide-react';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/layout/Footer';

export default function PricingPage() {
  const [, setLocation] = useLocation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const handleBillingToggle = () => {
    setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly');
  };

  const pricingPlans = [
    {
      name: 'Free',
      description: 'Perfect for individuals just getting started',
      price: {
        monthly: 0,
        annual: 0
      },
      features: [
        { included: true, text: '3 grant applications' },
        { included: true, text: 'Basic AI assistant' },
        { included: true, text: 'Standard templates' },
        { included: false, text: 'Advanced analytics' },
        { included: false, text: 'Custom templates' },
        { included: false, text: 'Collaboration tools' },
        { included: false, text: 'Priority support' }
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Pro',
      description: 'For serious artists with multiple projects',
      price: {
        monthly: 19,
        annual: 15
      },
      features: [
        { included: true, text: 'Unlimited applications' },
        { included: true, text: 'Advanced AI assistant' },
        { included: true, text: 'Premium templates' },
        { included: true, text: 'Basic analytics' },
        { included: true, text: 'Custom templates' },
        { included: false, text: 'Collaboration tools' },
        { included: false, text: 'Priority support' }
      ],
      cta: 'Upgrade to Pro',
      popular: true
    },
    {
      name: 'Teams',
      description: 'For ensembles, bands and organizations',
      price: {
        monthly: 39,
        annual: 33
      },
      features: [
        { included: true, text: 'Unlimited applications' },
        { included: true, text: 'Advanced AI assistant' },
        { included: true, text: 'All premium templates' },
        { included: true, text: 'Advanced analytics' },
        { included: true, text: 'Custom templates' },
        { included: true, text: 'Collaboration for up to 10 users' },
        { included: true, text: 'Priority support' }
      ],
      cta: 'Start Team Plan',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      
      <main className="flex-grow pt-24">
        {/* Pricing Header */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Transparent Pricing for Every Artist</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12">
              Choose the plan that works best for your creative journey. No hidden fees, cancel anytime.
            </p>
            
            {/* Billing Cycle Toggle */}
            <div className="flex items-center justify-center mb-16">
              <span className={`mr-3 ${billingCycle === 'monthly' ? 'font-semibold' : 'text-gray-500'}`}>Monthly</span>
              <Switch 
                checked={billingCycle === 'annual'} 
                onCheckedChange={handleBillingToggle}
                aria-label="Toggle billing cycle"
              />
              <span className={`ml-3 ${billingCycle === 'annual' ? 'font-semibold' : 'text-gray-500'}`}>
                Annual <span className="text-green-500 text-sm font-medium">Save 20%</span>
              </span>
            </div>
            
            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={`relative ${
                    plan.popular 
                      ? 'border-primary shadow-lg scale-105 md:scale-110 z-10' 
                      : 'border-gray-200 dark:border-gray-800'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Most Popular
                      </div>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-4xl font-bold">${plan.price[billingCycle]}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-1">
                        {plan.price[billingCycle] > 0 ? `/month${billingCycle === 'annual' ? ', billed annually' : ''}` : ''}
                      </span>
                    </div>
                    
                    <ul className="space-y-3 text-left mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          {feature.included ? (
                            <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 dark:text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                          )}
                          <span className={feature.included ? '' : 'text-gray-400 dark:text-gray-500'}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => {
                        if (plan.name === 'Free') {
                          setLocation('/dashboard');
                        } else {
                          // In a real app, this would redirect to checkout
                          setLocation('/checkout/' + plan.name.toLowerCase());
                        }
                      }}
                    >
                      {plan.cta}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* FAQs */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div>
                <h3 className="text-xl font-semibold mb-3">Can I cancel my subscription?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes, you can cancel your subscription at any time. If you cancel, you'll be able to use your plan until the end of your billing period.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Are there any long-term contracts?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  No, all our plans are subscription-based with no long-term commitment. You can upgrade, downgrade, or cancel at any time.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">What payment methods do you accept?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We accept all major credit cards, including Visa, Mastercard, American Express, and Discover. We also support PayPal.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Can I switch plans later?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Absolutely! You can switch between plans at any time. If you upgrade, the new features will be immediately available and we'll prorate your billing.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Is there a free trial?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We offer a free plan with limited features. This allows you to test our basic features before committing to a paid subscription.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Do you offer discounts for non-profits?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes, we offer special pricing for non-profit organizations and educational institutions. Please contact our support team for more information.
                </p>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <p className="text-gray-600 dark:text-gray-300 mb-6">Still have questions?</p>
              <Button variant="outline" onClick={() => setLocation('/contact')}>
                Contact Us
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}