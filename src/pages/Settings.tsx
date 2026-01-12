import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, Building, Shield, Bell, Trash2 } from "lucide-react";

const Settings = () => {
  const [companyName, setCompanyName] = useState("Acme Inc.");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4 hidden sm:inline" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building className="w-4 h-4 hidden sm:inline" />
              Company
            </TabsTrigger>
            <TabsTrigger value="access" className="gap-2">
              <Shield className="w-4 h-4 hidden sm:inline" />
              Access
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4 hidden sm:inline" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" defaultValue="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" defaultValue="Smith" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="john@acme.com" />
                </div>
                <Button variant="accent">Save changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Update your password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button variant="accent">Update password</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Settings</CardTitle>
                <CardDescription>Manage your company workspace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company name</Label>
                  <Input 
                    id="companyName" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select defaultValue="tech">
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tech">Technology</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="accent">Save changes</Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions for your workspace</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete Workspace
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage who has access to your workspace</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <TeamMember 
                    name="John Smith" 
                    email="john@acme.com" 
                    role="Admin"
                    isCurrentUser
                  />
                  <TeamMember 
                    name="Sarah Johnson" 
                    email="sarah@acme.com" 
                    role="HR"
                  />
                  <TeamMember 
                    name="Mike Wilson" 
                    email="mike@acme.com" 
                    role="Sales"
                  />
                  <TeamMember 
                    name="Emily Brown" 
                    email="emily@acme.com" 
                    role="Support"
                  />
                </div>
                <div className="mt-6 pt-6 border-t">
                  <Button variant="accent">Invite team member</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
                <CardDescription>Configure what each role can access</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <RolePermission 
                    role="Admin" 
                    description="Full access to all documents and settings"
                  />
                  <RolePermission 
                    role="HR" 
                    description="Access to HR-related documents only"
                  />
                  <RolePermission 
                    role="Sales" 
                    description="Access to sales-related documents only"
                  />
                  <RolePermission 
                    role="Support" 
                    description="Access to support-related documents only"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Configure when you receive emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New document uploads</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when new documents are added
                    </p>
                  </div>
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly usage digest</p>
                    <p className="text-sm text-muted-foreground">
                      Receive a summary of activity each week
                    </p>
                  </div>
                  <Switch 
                    checked={weeklyDigest} 
                    onCheckedChange={setWeeklyDigest} 
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const TeamMember = ({ 
  name, 
  email, 
  role, 
  isCurrentUser = false 
}: { 
  name: string; 
  email: string; 
  role: string; 
  isCurrentUser?: boolean;
}) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
        <User className="w-5 h-5 text-accent" />
      </div>
      <div>
        <p className="font-medium text-sm flex items-center gap-2">
          {name}
          {isCurrentUser && <Badge variant="secondary" className="text-xs">You</Badge>}
        </p>
        <p className="text-sm text-muted-foreground">{email}</p>
      </div>
    </div>
    <Select defaultValue={role.toLowerCase()}>
      <SelectTrigger className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="hr">HR</SelectItem>
        <SelectItem value="sales">Sales</SelectItem>
        <SelectItem value="support">Support</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

const RolePermission = ({ role, description }: { role: string; description: string }) => (
  <div className="flex items-center justify-between py-2 border-b last:border-0">
    <div>
      <p className="font-medium text-sm">{role}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Button variant="ghost" size="sm">Edit</Button>
  </div>
);

export default Settings;
