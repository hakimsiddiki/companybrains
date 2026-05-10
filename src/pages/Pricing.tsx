import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Public PayPal sandbox client ID is fine in frontend; replace with your live client ID for production.
const PAYPAL_CLIENT_ID = "sb"; // 'sb' = PayPal sandbox demo ID; works for testing buttons

interface Sub {
  status: string;
  plan: string;
  trial_end: string;
  current_period_end: string | null;
}

declare global {
  interface Window { paypal?: any }
}

const Pricing = () => {
  const { session } = useAuth();
  const [sub, setSub] = useState<Sub | null>(null);
  const [ready, setReady] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);

  const loadSub = async () => {
    const { data } = await supabase.from("subscriptions").select("status, plan, trial_end, current_period_end").maybeSingle();
    if (data) setSub(data as Sub);
  };

  useEffect(() => { loadSub(); }, []);

  useEffect(() => {
    if (window.paypal) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    s.onload = () => setReady(true);
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (!ready || !btnRef.current || !window.paypal || sub?.status === "active") return;
    btnRef.current.innerHTML = "";
    window.paypal.Buttons({
      style: { layout: "horizontal", color: "blue", shape: "rect", label: "pay" },
      createOrder: async () => {
        const { data, error } = await supabase.functions.invoke("paypal-create-subscription", { body: { amount: "29.00", plan: "pro" } });
        if (error || !data?.orderId) { toast.error("Could not start payment"); throw new Error("create failed"); }
        return data.orderId;
      },
      onApprove: async (data: any) => {
        const { error } = await supabase.functions.invoke("paypal-capture-order", { body: { orderId: data.orderID, plan: "pro" } });
        if (error) { toast.error("Payment capture failed"); return; }
        toast.success("Subscription activated!");
        loadSub();
      },
      onError: () => toast.error("PayPal error"),
    }).render(btnRef.current);
  }, [ready, session, sub?.status]);

  const trialDaysLeft = sub?.trial_end ? Math.max(0, Math.ceil((new Date(sub.trial_end).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Plans & Billing</h1>
          <p className="text-muted-foreground">No credit card required • 14-day free trial</p>
        </div>

        {sub && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Current status</CardTitle>
                <CardDescription className="capitalize">{sub.status}</CardDescription>
              </div>
              {sub.status === "trialing" && (
                <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />{trialDaysLeft} days left</Badge>
              )}
              {sub.status === "active" && <Badge className="bg-accent text-accent-foreground">Pro</Badge>}
            </CardHeader>
          </Card>
        )}

        <Card className="border-accent/40">
          <CardHeader>
            <div className="flex items-baseline justify-between">
              <CardTitle>Pro</CardTitle>
              <div className="text-right">
                <div className="text-3xl font-bold">$29<span className="text-base font-normal text-muted-foreground">/mo</span></div>
              </div>
            </div>
            <CardDescription>Everything you need for your team's knowledge base.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-2 text-sm">
              {["Unlimited document uploads","AI-powered Q&A with citations","Role-based access control","Team collaboration","Usage analytics"].map((f) => (
                <li key={f} className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5 text-accent" />{f}</li>
              ))}
            </ul>

            {sub?.status === "active" ? (
              <p className="text-sm text-muted-foreground">You're on the Pro plan. Renews {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "soon"}.</p>
            ) : (
              <>
                <div ref={btnRef} />
                {!ready && <p className="text-sm text-muted-foreground">Loading PayPal…</p>}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Pricing;
