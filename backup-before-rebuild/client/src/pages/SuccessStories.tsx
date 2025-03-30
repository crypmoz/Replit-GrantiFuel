import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/layout/Footer';

export default function SuccessStories() {
  const [, setLocation] = useLocation();
  
  // Sample success stories data
  const stories = [
    {
      title: "Symphonic Orchestra Secures Major Grant",
      organization: "Metropolitan Symphony Orchestra",
      amount: "$125,000",
      grantName: "National Arts Endowment Fund",
      description: "The Metropolitan Symphony Orchestra secured a major grant to fund their educational outreach program, bringing classical music to underserved schools across the region.",
      quote: "Grantaroo's AI assistant helped us craft a compelling narrative that perfectly articulated our vision. The templates were invaluable in organizing our budget and timeline sections.",
      author: "Maria Castillo",
      position: "Executive Director",
      image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fG9yY2hlc3RyYXxlbnwwfHwwfHx8MA%3D%3D"
    },
    {
      title: "Jazz Collective Wins International Tour Support",
      organization: "Blue Note Collective",
      amount: "$78,000",
      grantName: "Global Arts Exchange Initiative",
      description: "The Blue Note Collective secured funding for their international tour, allowing them to perform in 7 countries and conduct masterclasses with local musicians.",
      quote: "The application dashboard made tracking our submission status incredibly easy. We could collaborate efficiently across our entire team thanks to Grantaroo's intuitive interface.",
      author: "James Washington",
      position: "Artistic Director",
      image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8amF6enxlbnwwfHwwfHx8MA%3D%3D"
    },
    {
      title: "Community Music School Expands Program",
      organization: "Harmony Music Academy",
      amount: "$95,000",
      grantName: "Community Arts Development Fund",
      description: "Harmony Music Academy received funding to expand their program offering free music lessons to youth in underserved neighborhoods, doubling their student capacity.",
      quote: "We were able to reuse components from previous successful applications, which saved us tremendous time. The AI suggestions helped us strengthen our impact statements.",
      author: "Sarah Chen",
      position: "Program Director",
      image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bXVzaWMlMjBzY2hvb2x8ZW58MHx8MHx8fDA%3D"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-primary/10 to-transparent">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Success Stories</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Discover how artists and organizations are using Grantaroo to secure funding and bring their creative visions to life.
            </p>
          </div>
        </section>
        
        {/* Success Stories */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 gap-12 max-w-4xl mx-auto">
              {stories.map((story, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                  <div className="md:flex">
                    <div className="md:w-1/3">
                      <img 
                        src={story.image} 
                        alt={story.organization} 
                        className="h-64 w-full object-cover md:h-full"
                      />
                    </div>
                    <div className="p-6 md:w-2/3">
                      <div className="text-sm font-medium text-primary mb-1">{story.grantName}</div>
                      <h2 className="text-2xl font-bold mb-2">{story.title}</h2>
                      <div className="flex items-center mb-4">
                        <div className="font-medium">{story.organization}</div>
                        <div className="mx-2">•</div>
                        <div className="font-bold text-green-600 dark:text-green-400">{story.amount}</div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {story.description}
                      </p>
                      <blockquote className="italic border-l-4 border-primary pl-4 py-2 mb-4">
                        "{story.quote}"
                      </blockquote>
                      <div className="font-medium">
                        {story.author}, {story.position}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Write Your Success Story?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Join thousands of artists and organizations who have successfully secured funding with Grantaroo.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => setLocation('/dashboard')}
              className="font-medium"
            >
              Get Started Today
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}