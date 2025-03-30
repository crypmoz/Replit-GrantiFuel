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
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/30 -z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1580477667995-2b94f01c9516?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-5 -z-10"></div>
        <div className="absolute top-1/3 -right-64 w-96 h-96 bg-purple-200/50 dark:bg-purple-900/20 rounded-full filter blur-3xl -z-10"></div>
        <div className="absolute bottom-1/3 -left-64 w-96 h-96 bg-indigo-200/50 dark:bg-indigo-900/20 rounded-full filter blur-3xl -z-10"></div>
        
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row items-center max-w-6xl mx-auto">
            <div className="md:w-1/2 mb-16 md:mb-0 md:pr-12">
              <div className="inline-flex items-center px-3 py-1.5 mb-6 rounded-full bg-purple-100/80 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50 backdrop-blur-sm">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 mr-2">
                  <Sparkles className="h-3 w-3 text-white" />
                </span>
                <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Revolutionizing music grant applications</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="gradient-text">Fund Your Musical</span>
                <br />
                <span className="text-gray-900 dark:text-white">Vision Today</span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-800 dark:text-gray-100 mb-8 leading-relaxed">
                GrantiFuel helps musicians and artists navigate the complex world of grants with AI-powered tools, smart templates, and expert guidance.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={() => setLocation('/dashboard')} 
                  className="gradient-bg-hover font-medium text-white shadow-md hover:shadow-xl transition-all duration-300"
                >
                  Get Started
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => setLocation('/grants')} 
                  className="font-medium border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-700"
                >
                  Explore Grants
                </Button>
              </div>
              
              <div className="mt-10 flex items-center">
                <div className="flex -space-x-2 mr-4">
                  {[
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80',
                    'https://images.unsplash.com/photo-1506863530036-1efeddceb993?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80',
                  ].map((image, index) => (
                    <img 
                      key={index}
                      src={image} 
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-900" 
                      alt="User avatar" 
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Trusted by <span className="text-purple-700 dark:text-purple-400 font-medium">3,800+ musicians</span> worldwide
                </p>
              </div>
            </div>
            
            <div className="md:w-1/2 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-800/50">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 dark:from-purple-700/20 dark:to-indigo-700/20 z-10"></div>
                <img 
                  src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80" 
                  alt="Music studio with instruments" 
                  className="w-full h-auto"
                />
              </div>
              
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-lg border border-purple-100 dark:border-purple-900/50">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="font-medium">Success rate <span className="gradient-text-success">doubled</span> for first-time applicants</span>
                </div>
              </div>
              
              <div className="absolute -top-6 -right-6 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-lg border border-indigo-100 dark:border-indigo-900/50">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 text-amber-500" />
                  <span className="font-medium">Over <span className="text-amber-500">$14M</span> in funding secured</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-gray-50 to-transparent dark:from-gray-900 to-transparent"></div>
        <div className="absolute -top-64 -right-64 w-96 h-96 bg-purple-200/30 dark:bg-purple-900/10 rounded-full filter blur-3xl -z-10"></div>
        <div className="absolute -bottom-64 -left-64 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-900/10 rounded-full filter blur-3xl -z-10"></div>
        
        <div className="container px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center px-3 py-1.5 mb-4 rounded-full bg-purple-100/80 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50 backdrop-blur-sm">
              <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Powerful Tools</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="gradient-text">Everything You Need</span> to Secure Funding
            </h2>
            
            <p className="text-lg text-gray-800 dark:text-gray-100">
              Our comprehensive suite of tools is designed to make the grant application process easier, more efficient, and more successful.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div 
                key={feature.id}
                className={`group bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700/50 transition-all duration-300 ${
                  hoveredFeature === feature.id ? 'transform -translate-y-1 shadow-xl border-purple-200 dark:border-purple-700/50' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(feature.id)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className={`${feature.color} p-3 rounded-xl inline-flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110`}>
                  {React.cloneElement(feature.icon, { 
                    className: "h-7 w-7 text-primary" 
                  })}
                </div>
                
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
                
                <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700/50">
                  <button className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
                    Learn more <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 flex justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setLocation('/dashboard')}
              className="border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-700 font-medium"
            >
              Explore All Features
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900/50 dark:via-gray-900 dark:to-indigo-950/20"></div>
        <div className="absolute h-full w-full bg-[url('https://images.unsplash.com/photo-1580477667995-2b94f01c9516?q=80&w=2940&auto=format&fit=crop')] bg-fixed bg-cover bg-center opacity-5"></div>
        
        <div className="container px-4 mx-auto relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl p-6 md:p-8 text-center shadow-md border border-gray-100/80 dark:border-gray-700/50 hover:transform hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 mx-auto mb-5 rounded-full"></div>
                <div className="text-3xl md:text-4xl xl:text-5xl font-bold gradient-text-secondary mb-3">{stat.value}</div>
                <div className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
          
          <div className="max-w-3xl mx-auto text-center mt-14 md:mt-16">
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
              We've helped musicians and artists of all genres access funding opportunities that align with their creative vision, enabling them to bring their projects to life.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="absolute -top-64 -left-64 w-96 h-96 bg-purple-200/30 dark:bg-purple-900/10 rounded-full filter blur-3xl -z-10"></div>
        <div className="absolute -bottom-64 -right-64 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-900/10 rounded-full filter blur-3xl -z-10"></div>
        
        <div className="container px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center px-3 py-1.5 mb-4 rounded-full bg-purple-100/80 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50 backdrop-blur-sm">
              <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Success Stories</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="gradient-text">Artists Like You</span> Are Finding Success
            </h2>
            
            <p className="text-lg text-gray-800 dark:text-gray-100">
              Hear from musicians and artists who have transformed their grant application process with GrantiFuel.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl border border-gray-100 dark:border-gray-700/50 transition-all duration-300 hover:transform hover:-translate-y-1 group"
              >
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 to-transparent z-10"></div>
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.author} 
                    className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                  />
                </div>
                
                <div className="p-7">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-5 relative">
                    <span className="absolute -top-3 -left-2 text-4xl text-purple-300/30 dark:text-purple-700/20">"</span>
                    {testimonial.quote}
                    <span className="absolute -bottom-3 -right-2 text-4xl text-purple-300/30 dark:text-purple-700/20">"</span>
                  </p>
                  
                  <div className="pt-5 mt-1 border-t border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full overflow-hidden mr-3 border-2 border-purple-200 dark:border-purple-700">
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.author} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{testimonial.author}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button 
              variant="outline"
              onClick={() => setLocation('/success-stories')}
              className="border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-700 font-medium"
            >
              View All Success Stories
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 to-indigo-700/90 -z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-20 -z-20"></div>
        
        <div className="container px-4 mx-auto relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white/10 w-20 h-1 rounded-full mx-auto mb-6"></div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">
              Ready to Transform Your <span className="text-amber-300">Grant Applications?</span>
            </h2>
            
            <p className="text-lg md:text-xl text-gray-100 mb-10 max-w-3xl mx-auto">
              Join thousands of artists who are using GrantiFuel to fund their creative projects and bring their musical vision to life.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
              <Button 
                size="lg" 
                onClick={() => setLocation('/dashboard')} 
                className="gradient-bg-hover shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 text-white font-medium text-lg px-8 py-6"
              >
                Get Started Now
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => setLocation('/pricing')}
                className="border-2 border-white/30 hover:border-white/60 bg-white/5 hover:bg-white/10 text-white font-medium text-lg px-8 py-6"
              >
                View Pricing
              </Button>
            </div>
            
            <div className="mt-10 text-white/80">
              <p className="flex items-center justify-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-300" />
                No credit card required for free plan
              </p>
            </div>
          </div>
          
          <div className="absolute -bottom-10 left-1/4 w-32 h-32 bg-gradient-to-r from-amber-500/30 to-yellow-500/30 rounded-full filter blur-2xl"></div>
          <div className="absolute -bottom-10 right-1/4 w-32 h-32 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-full filter blur-2xl"></div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}