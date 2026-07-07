import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Seo from "@/components/Seo";

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    companyName: "",
    firstName: "",
    lastName: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          company_name: formData.companyName,
        },
      },
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Workspace created!");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="flex items-center gap-2 mb-8">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {step > 1 ? <CheckCircle className="w-5 h-5" /> : "1"}
            </div>
            <div className={`flex-1 h-1 rounded ${step >= 2 ? "bg-accent" : "bg-muted"}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
            }`}>
              2
            </div>
          </div>

          {step === 1 ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Create your account</h1>
                <p className="text-muted-foreground">No credit card required • 14-day free trial</p>
              </div>

              <form onSubmit={handleStep1} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@company.com" value={formData.email} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" placeholder="Create a strong password" value={formData.password} onChange={handleChange} required minLength={8} />
                  <p className="text-xs text-muted-foreground">At least 8 characters</p>
                </div>

                <Button type="submit" variant="accent" className="w-full">Continue</Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Set up your workspace</h1>
                <p className="text-muted-foreground">Tell us about your company</p>
              </div>

              <form onSubmit={handleStep2} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleChange} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company name</Label>
                  <Input id="companyName" name="companyName" type="text" value={formData.companyName} onChange={handleChange} required />
                </div>

                <Button type="submit" variant="accent" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating workspace..." : "Create workspace"}
                </Button>

                <Button type="button" variant="ghost" className="w-full" onClick={() => setStep(1)}>Back</Button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-accent hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12">
        <div className="text-primary-foreground max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-8">
            <Brain className="w-10 h-10 text-accent-foreground" />
          </div>
          <h2 className="text-3xl font-bold mb-6">What you'll get</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 mt-0.5 text-accent" /><span>Unlimited document uploads</span></li>
            <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 mt-0.5 text-accent" /><span>AI-powered Q&A with citations</span></li>
            <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 mt-0.5 text-accent" /><span>Role-based access control</span></li>
            <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 mt-0.5 text-accent" /><span>Team collaboration features</span></li>
            <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 mt-0.5 text-accent" /><span>Usage analytics dashboard</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Signup;
