import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Upload, MessageSquare, Shield, Users, BarChart3, ArrowRight } from "lucide-react";
import Seo from "@/components/Seo";

const landingJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Company Brain",
    url: "https://companybrains.lovable.app/",
    description:
      "B2B SaaS platform for secure, private AI Q&A on internal company documents.",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Company Brain",
    url: "https://companybrains.lovable.app/",
  },
];


const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Brain className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-semibold text-lg">Company Brain</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button variant="accent" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm mb-6 animate-fade-in">
            <Shield className="w-4 h-4" />
            <span>Private & Secure AI for your company</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 animate-fade-in-up">
            Ask your company.
            <br />
            <span className="text-muted-foreground">It answers.</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Upload your internal documents and get instant, accurate answers. 
            AI Company Brain uses only your company's data—never the internet.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/signup">
              <Button variant="hero" size="xl">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="hero-outline" size="xl">
                View Demo
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            No credit card required • 14-day free trial
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything your team needs</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete knowledge management solution that keeps your company's information secure and accessible.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Upload className="w-6 h-6" />}
              title="Document Upload"
              description="Upload PDFs and DOCX files. We extract, chunk, and index everything automatically."
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Intelligent Q&A"
              description="Ask questions in natural language. Get accurate answers with source citations."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Complete Privacy"
              description="Your data never leaves your control. AI answers from your docs only—never the web."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Role-Based Access"
              description="Control who sees what. HR docs for HR, sales data for sales teams."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Usage Analytics"
              description="See what your team is asking. Identify knowledge gaps and popular topics."
            />
            <FeatureCard
              icon={<Brain className="w-6 h-6" />}
              title="Smart Citations"
              description="Every answer includes references to source documents. Verify in seconds."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground">Three simple steps to unlock your company's knowledge</p>
          </div>
          
          <div className="space-y-8">
            <StepCard
              number="1"
              title="Upload your documents"
              description="Drag and drop your PDFs, Word docs, and other files. We handle the rest."
            />
            <StepCard
              number="2"
              title="AI processes and indexes"
              description="Our AI extracts text, creates embeddings, and builds a searchable knowledge base."
            />
            <StepCard
              number="3"
              title="Ask anything"
              description="Your team can now ask questions and get instant, accurate answers with citations."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to unlock your company's knowledge?</h2>
          <p className="text-primary-foreground/80 mb-8">
            Make your team's knowledge instantly searchable and unlock productivity across your company.
          </p>
          <Link to="/signup">
            <Button variant="secondary" size="xl">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Brain className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="font-semibold">Company Brain</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 AI Company Brain. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="bg-card p-6 rounded-xl border hover:shadow-md transition-shadow">
    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-4">
      {icon}
    </div>
    <h3 className="font-semibold text-lg mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

const StepCard = ({ number, title, description }: { number: string; title: string; description: string }) => (
  <div className="flex gap-6 items-start">
    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold shrink-0">
      {number}
    </div>
    <div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default Landing;
