import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import LandingHeader from '@/components/layout/LandingHeader';
import Footer from '@/components/layout/Footer';

export default function Blog() {
  const [, setLocation] = useLocation();
  
  // Sample blog posts data
  const posts = [
    {
      title: "Top 10 Music Grant Opportunities for 2025",
      date: "March 20, 2025",
      author: "Alex Rivera",
      category: "Grant Opportunities",
      excerpt: "Discover the most promising grant opportunities for musicians and composers in 2025, including application deadlines, eligibility requirements, and tips for success.",
      image: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bXVzaWN8ZW58MHx8MHx8fDA%3D"
    },
    {
      title: "How to Craft a Compelling Artist Statement",
      date: "March 15, 2025",
      author: "Maya Johnson",
      category: "Application Tips",
      excerpt: "Learn the essential elements of an artist statement that captures attention and effectively communicates your artistic vision and goals to grant reviewers.",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8d3JpdGluZ3xlbnwwfHwwfHx8MA%3D%3D"
    },
    {
      title: "The Impact of AI on Grant Writing for the Arts",
      date: "March 8, 2025",
      author: "Dr. Thomas Chen",
      category: "Technology",
      excerpt: "Explore how artificial intelligence is revolutionizing the grant writing process for artists and arts organizations, from drafting applications to analyzing success factors.",
      image: "https://images.unsplash.com/photo-1677442135073-c238ba3523cf?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8QUl8ZW58MHx8MHx8fDA%3D"
    },
    {
      title: "Building a Strong Portfolio for Grant Applications",
      date: "March 1, 2025",
      author: "Sophia Martinez",
      category: "Portfolio Development",
      excerpt: "Tips and strategies for creating a portfolio that showcases your artistic achievements and potential in a way that resonates with grant reviewers.",
      image: "https://images.unsplash.com/photo-1607004468138-e7e23ea26947?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cG9ydGZvbGlvfGVufDB8fDB8fHww"
    },
    {
      title: "Understanding Grant Budgets: A Musician's Guide",
      date: "February 25, 2025",
      author: "David Wilson",
      category: "Financial Planning",
      excerpt: "A comprehensive guide to creating accurate and compelling budgets for your music projects when applying for grants and funding opportunities.",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZmluYW5jZXxlbnwwfHwwfHx8MA%3D%3D"
    },
    {
      title: "Navigating International Funding for Music Tours",
      date: "February 18, 2025",
      author: "Emma Taylor",
      category: "International Opportunities",
      excerpt: "Explore opportunities and strategies for securing international funding for your music tours, including country-specific grants and cross-cultural exchange programs.",
      image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHdvcmxkJTIwbWFwfGVufDB8fDB8fHww"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-primary/10 to-transparent">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Blog</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Expert insights, tips, and resources for musicians and artists navigating the grant application process.
            </p>
          </div>
        </section>
        
        {/* Featured Post */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden max-w-5xl mx-auto">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <img 
                    src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bXVzaWMlMjBzdHVkaW98ZW58MHx8MHx8fDA%3D" 
                    alt="Featured post" 
                    className="h-64 w-full object-cover md:h-full"
                  />
                </div>
                <div className="p-8 md:w-1/2">
                  <div className="text-sm font-medium text-primary mb-2">Featured Post</div>
                  <h2 className="text-3xl font-bold mb-4">Securing Music Production Grants: A Complete Guide</h2>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>March 27, 2025</span>
                    <span className="mx-2">•</span>
                    <span>By Jennifer Kwon</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Learn everything you need to know about finding, applying for, and winning grants specifically designed for music production projects. From studio time to album production, this comprehensive guide covers all aspects of funding your next recording project.
                  </p>
                  <Button onClick={() => {}} variant="outline" className="font-medium">
                    Read Full Article
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Blog Posts Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Latest Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="h-48 w-full object-cover"
                  />
                  <div className="p-6">
                    <div className="text-sm font-medium text-primary mb-2">{post.category}</div>
                    <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <span>{post.date}</span>
                      <span className="mx-2">•</span>
                      <span>By {post.author}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {post.excerpt}
                    </p>
                    <Button variant="link" className="p-0 h-auto font-medium text-primary">
                      Read More →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Newsletter Section */}
        <section className="py-16 bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl font-bold mb-6">Stay Updated</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Subscribe to our newsletter for the latest grant opportunities, tips, and industry insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-grow rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button className="font-medium">
                Subscribe
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}