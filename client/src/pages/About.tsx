import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/layout/Footer';
import { 
  Twitter, 
  Linkedin, 
  Award, 
  Users, 
  Zap, 
  Heart,
  BarChart3,
  Globe
} from 'lucide-react';

export default function AboutPage() {
  const [, setLocation] = useLocation();

  const teamMembers = [
    {
      name: 'Sarah Chen',
      role: 'CEO & Co-Founder',
      bio: 'Former violinist with the San Francisco Symphony and grant winner who saw firsthand the challenges artists face in securing funding.',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      social: {
        twitter: 'https://twitter.com/sarahchen',
        linkedin: 'https://linkedin.com/in/sarahchen'
      }
    },
    {
      name: 'Michael Rodriguez',
      role: 'CTO & Co-Founder',
      bio: 'MIT graduate with a passion for music technology. Combines AI expertise with a background as a jazz pianist.',
      image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      social: {
        twitter: 'https://twitter.com/michaelrodriguez',
        linkedin: 'https://linkedin.com/in/michaelrodriguez'
      }
    },
    {
      name: 'Jada Washington',
      role: 'Head of Artist Relations',
      bio: 'Former grant administrator for the National Endowment for the Arts with a deep understanding of funding processes.',
      image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      social: {
        twitter: 'https://twitter.com/jadawashington',
        linkedin: 'https://linkedin.com/in/jadawashington'
      }
    },
    {
      name: 'Alex Patel',
      role: 'Lead Designer',
      bio: 'Award-winning UX designer and classical guitarist who brings a unique artist perspective to product design.',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      social: {
        twitter: 'https://twitter.com/alexpatel',
        linkedin: 'https://linkedin.com/in/alexpatel'
      }
    },
    {
      name: 'Elena Kim',
      role: 'AI Research Lead',
      bio: 'PhD in Machine Learning with specialization in NLP. Published researcher on AI applications in creative fields.',
      image: 'https://images.unsplash.com/photo-1524593689594-aae2f26b75ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      social: {
        twitter: 'https://twitter.com/elenakim',
        linkedin: 'https://linkedin.com/in/elenakim'
      }
    },
    {
      name: 'Omar Johnson',
      role: 'Head of Partnerships',
      bio: 'Former Director at Spotify with extensive connections in the music industry and arts funding organizations.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      social: {
        twitter: 'https://twitter.com/omarjohnson',
        linkedin: 'https://linkedin.com/in/omarjohnson'
      }
    }
  ];

  const values = [
    {
      icon: <Award className="h-8 w-8 text-primary" />,
      title: 'Artist Empowerment',
      description: 'We believe all artists deserve access to funding opportunities regardless of background, connections, or grant-writing experience.'
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: 'Community',
      description: 'We foster collaboration and knowledge-sharing within the artist community to collectively improve success rates.'
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: 'Innovation',
      description: 'We continuously push technological boundaries to develop tools that make the grant application process more effective and less intimidating.'
    },
    {
      icon: <Heart className="h-8 w-8 text-primary" />,
      title: 'Passion',
      description: 'We are passionate about the arts and enabling creative projects that might not otherwise see the light of day.'
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      title: 'Data-Driven',
      description: 'We use real application data and success metrics to continuously improve our platform and guidance.'
    },
    {
      icon: <Globe className="h-8 w-8 text-primary" />,
      title: 'Accessibility',
      description: 'We strive to make our platform accessible to artists of all backgrounds, regions, and technical abilities.'
    }
  ];

  const milestones = [
    {
      year: '2019',
      title: 'The Idea',
      description: 'Sarah and Michael conceive Grantaroo after experiencing the challenges of grant applications firsthand.'
    },
    {
      year: '2020',
      title: 'First Prototype',
      description: 'Development of the initial platform with basic template functionality and grant database.'
    },
    {
      year: '2021',
      title: 'Seed Funding',
      description: 'Secured $1.5M in seed funding from investors passionate about arts and technology.'
    },
    {
      year: '2022',
      title: 'AI Integration',
      description: 'Launched the AI assistant feature, dramatically improving application quality for users.'
    },
    {
      year: '2023',
      title: 'Rapid Growth',
      description: 'Reached 10,000 artists on the platform and celebrated $10M in grants secured.'
    },
    {
      year: '2024',
      title: 'Global Expansion',
      description: 'Expanded to international grants and launched partnerships with major arts organizations.'
    },
    {
      year: '2025',
      title: 'The Future',
      description: 'Continuing our mission to democratize arts funding with new collaborative features.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      
      <main className="flex-grow pt-24">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-950">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center max-w-6xl mx-auto">
              <div className="md:w-1/2 mb-12 md:mb-0 md:pr-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Mission</h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  Grantaroo was founded with a clear mission: to democratize access to arts funding by empowering artists with technology.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                  We believe that talent should be the only prerequisite for securing funding, not grant-writing expertise or industry connections. Our platform leverages AI, data, and community knowledge to level the playing field.
                </p>
                <Button onClick={() => setLocation('/join-us')}>
                  Join Our Team
                </Button>
              </div>
              <div className="md:w-1/2">
                <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden shadow-xl">
                  <img 
                    src="https://images.unsplash.com/photo-1523374228107-6e44bd2b524e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" 
                    alt="Team collaboration" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Values Section */}
        <section className="py-16 md:py-24 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Values</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                These core principles guide everything we do at Grantaroo, from product development to customer support.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {values.map((value, index) => (
                <Card key={index} className="bg-gray-50 dark:bg-gray-800 border-0">
                  <CardContent className="p-8">
                    <div className="rounded-full bg-primary/10 p-3 inline-block mb-4">
                      {value.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* Team Section */}
        <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Meet Our Team</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                We're a diverse group of artists, technologists, and industry experts united by our passion for the arts and innovation.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {teamMembers.map((member, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="aspect-w-1 aspect-h-1 w-full">
                      <img 
                        src={member.image} 
                        alt={member.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                      <p className="text-primary font-medium mb-3">{member.role}</p>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">{member.bio}</p>
                      <div className="flex space-x-3">
                        <a 
                          href={member.social.twitter} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-primary dark:text-gray-400 transition-colors"
                          aria-label={`${member.name}'s Twitter`}
                        >
                          <Twitter className="h-5 w-5" />
                        </a>
                        <a 
                          href={member.social.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-primary dark:text-gray-400 transition-colors"
                          aria-label={`${member.name}'s LinkedIn`}
                        >
                          <Linkedin className="h-5 w-5" />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* Journey/Timeline Section */}
        <section className="py-16 md:py-24 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Journey</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                From a simple idea to a platform that has helped thousands of artists secure millions in funding.
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                
                {/* Timeline items */}
                <div className="space-y-16">
                  {milestones.map((milestone, index) => (
                    <div key={index} className="relative">
                      {/* Year bubble */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg z-10">
                        {milestone.year}
                      </div>
                      
                      {/* Content */}
                      <div className={`flex ${index % 2 === 0 ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className="w-1/2"></div>
                        <div className={`w-1/2 ${index % 2 === 0 ? 'pr-12 text-right' : 'pl-12'}`}>
                          <div className="mb-2 mt-8">
                            <h3 className="text-xl font-semibold">{milestone.title}</h3>
                            <p className="text-gray-600 dark:text-gray-300">{milestone.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-primary/10 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Join the Grantaroo Community</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Connect with like-minded artists, share your success stories, and transform your approach to grant funding.
              </p>
              <Button size="lg" onClick={() => setLocation('/dashboard')}>
                Get Started Today
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}