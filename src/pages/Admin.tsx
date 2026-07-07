import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, FileText, TrendingUp, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Seo from "@/components/Seo";


const Admin = () => {
  const { user } = useAuth();
  const [docCount, setDocCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { count: docs } = await supabase.from("documents").select("*", { count: "exact", head: true });
      const { count: users } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      setDocCount(docs ?? 0);
      setUserCount(users ?? 0);
    };
    load();
  }, [user]);

  return (
    <DashboardLayout>
      <Seo
        title="Analytics — Company Brain"
        description="Track how your team uses Company Brain: query volume, active users, document counts, and the most-asked questions across your workspace."
        path="/admin"
        noindex
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Usage insights across your workspace</p>
        </div>

        <h2 className="text-lg font-semibold">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Queries" value="0" icon={<MessageSquare className="w-4 h-4" />} />
          <StatsCard title="Active Users" value={userCount.toString()} icon={<Users className="w-4 h-4" />} />
          <StatsCard title="Documents" value={docCount.toString()} icon={<FileText className="w-4 h-4" />} />
          <StatsCard title="Answer Rate" value="—" icon={<TrendingUp className="w-4 h-4" />} />
        </div>

        <h2 className="text-lg font-semibold">Activity</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Queries This Week</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                No query activity yet
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Active Users Trend</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                No activity data yet
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />Most Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-8 text-center">No questions yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />Most Used Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-8 text-center">No usage data yet</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

const StatsCard = ({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
      </div>
    </CardContent>
  </Card>
);

export default Admin;
