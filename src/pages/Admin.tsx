import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MessageSquare, 
  Users, 
  FileText, 
  TrendingUp,
  HelpCircle
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const queryData = [
  { day: "Mon", queries: 45 },
  { day: "Tue", queries: 52 },
  { day: "Wed", queries: 38 },
  { day: "Thu", queries: 65 },
  { day: "Fri", queries: 48 },
  { day: "Sat", queries: 12 },
  { day: "Sun", queries: 8 },
];

const userActivityData = [
  { week: "Week 1", users: 12 },
  { week: "Week 2", users: 19 },
  { week: "Week 3", users: 25 },
  { week: "Week 4", users: 32 },
];

const topQuestions = [
  { question: "What is our leave policy?", count: 34 },
  { question: "How do I submit expenses?", count: 28 },
  { question: "What are the sales targets for Q1?", count: 22 },
  { question: "Where can I find the brand guidelines?", count: 18 },
  { question: "What's the process for requesting PTO?", count: 15 },
];

const topDocuments = [
  { name: "HR Policy Manual 2024.pdf", queries: 156 },
  { name: "Employee Handbook.docx", queries: 134 },
  { name: "Sales Playbook Q1.pdf", queries: 89 },
  { name: "Onboarding Guide.docx", queries: 67 },
  { name: "Technical Documentation.pdf", queries: 45 },
];

const Admin = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Queries"
            value="1,284"
            change="+12%"
            icon={<MessageSquare className="w-4 h-4" />}
          />
          <StatsCard
            title="Active Users"
            value="32"
            change="+5"
            icon={<Users className="w-4 h-4" />}
          />
          <StatsCard
            title="Documents"
            value="24"
            change="+3"
            icon={<FileText className="w-4 h-4" />}
          />
          <StatsCard
            title="Answer Rate"
            value="94%"
            change="+2%"
            icon={<TrendingUp className="w-4 h-4" />}
          />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Queries This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={queryData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="day" 
                      className="text-xs fill-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs fill-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="queries" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Users Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userActivityData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="week" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--accent))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lists */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Most Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topQuestions.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm truncate max-w-[280px]">{item.question}</span>
                    <span className="text-sm font-medium text-muted-foreground">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Most Used Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topDocuments.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm truncate max-w-[280px]">{item.name}</span>
                    <span className="text-sm font-medium text-muted-foreground">{item.queries} queries</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

const StatsCard = ({ 
  title, 
  value, 
  change, 
  icon 
}: { 
  title: string; 
  value: string; 
  change: string; 
  icon: React.ReactNode;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-sm text-success">{change}</span>
      </div>
    </CardContent>
  </Card>
);

export default Admin;
