import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { 
  ChevronRight, 
  Award, 
  Sparkles, 
  Clock, 
  BarChart3, 
  CheckCircle,
  Users,
  Brain
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import LandingHeader from '../components/layout/LandingHeader';
import Footer from '../components/layout/Footer';

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  const features = [
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      description: 'Get personalized grant-writing guidance with our AI assistant trained on successful applications',
      icon: <Brain className="h-8 w-8 text-primary" />,
      color: 'bg-blue-50 dark:bg-blue-950/30'
    },
    {
      id: 'templates',
      title: 'Smart Templates',
      description: 'Start with proven templates that have secured funding across various grant categories',
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      color: 'bg-purple-50 dark:bg-purple-950/30'
    },
    {
      id: 'deadlines',
      title: 'Deadline Tracking',
      description: 'Never miss an application deadline with smart reminders and progress tracking',
      icon: <Clock className="h-8 w-8 text-primary" />,
      color: 'bg-amber-50 dark:bg-amber-950/30'
    },
    {
      id: 'analytics',
      title: 'Application Analytics',
      description: 'Track your success rates and identify patterns to improve future applications',
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      color: 'bg-green-50 dark:bg-green-950/30'
    },
    {
      id: 'collaboration',
      title: 'Artist Collaboration',
      description: 'Easily share and collaborate with team members on application materials',
      icon: <Users className="h-8 w-8 text-primary" />,
      color: 'bg-rose-50 dark:bg-rose-950/30'
    },
    {
      id: 'grants',
      title: 'Grant Database',
      description: 'Access our curated database of music grants updated regularly',
      icon: <Award className="h-8 w-8 text-primary" />,
      color: 'bg-teal-50 dark:bg-teal-950/30'
    }
  ];

  const testimonials = [
    {
      quote: "GrantiFuel helped me secure my first major commission. The AI assistant guided me through the entire process.",
      author: "Sarah Lee",
      role: "Composer, New York Philharmonic Resident Artist",
      image: "https://images.unsplash.com/photo-1509460913899-515f1df34fea?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3"
    },
    {
      quote: "I was struggling with grant applications until I found GrantiFuel. Their templates helped me articulate my artistic vision clearly.",
      author: "Marcus Chen",
      role: "Jazz Pianist & Educator",
      image: "https://images.unsplash.com/photo-1522556189639-b150ed9c4330?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3"
    },
    {
      quote: "The analytics feature showed me exactly where my applications were falling short. Game-changer!",
      author: "Elena Rodriguez",
      role: "Chamber Music Director",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2864&auto=format&fit=crop&ixlib=rb-4.0.3"
    }
  ];

  const stats = [
    { value: '$14M+', label: 'Funding secured for artists' },
    { value: '89%', label: 'Success rate increase' },
    { value: '3800+', label: 'Artists supported' },
    { value: '500+', label: 'Available grant opportunities' }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-slate-100 dark:from-gray-900 dark:to-gray-950 -z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1580477667995-2b94f01c9516?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-5 -z-10"></div>
        
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row items-center max-w-6xl mx-auto">
            <div className="md:w-1/2 mb-12 md:mb-0 md:pr-12">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Revolutionizing music grant applications</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight gradient-text mb-6">
                Fund Your Musical Vision
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                GrantiFuel helps musicians and artists navigate the complex world of grants with AI-powered tools, smart templates, and expert guidance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => setLocation('/dashboard')} className="font-medium">
                  Get Started
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => setLocation('/grants')} className="font-medium">
                  Explore Grants
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80" 
                  alt="Music studio with instruments" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-primary/20 mix-blend-overlay"></div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="font-semibold">Success rate <span className="text-green-500">doubled</span> for first-time applicants</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Everything You Need to Secure Funding</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Our comprehensive suite of tools is designed to make the grant application process easier, more efficient, and more successful.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card 
                key={feature.id}
                className={`transition-all duration-300 hover:shadow-lg ${
                  hoveredFeature === feature.id ? 'ring-2 ring-primary/50 shadow-lg' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(feature.id)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <CardContent className="p-8">
                  <div className={`p-3 rounded-lg inline-block mb-4 ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm md:text-base text-gray-600 dark:text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Success Stories from Artists Like You</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Hear from musicians and artists who have transformed their grant application process with GrantiFuel.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-w-16 aspect-h-10 w-full h-40">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.author} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 mb-4 italic">"{testimonial.quote}"</p>
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/10 dark:bg-gray-800">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Grant Applications?</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Join thousands of artists who are using GrantiFuel to fund their creative projects.
            </p>
            <Button size="lg" onClick={() => setLocation('/dashboard')} className="font-medium">
              Get Started Now
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}