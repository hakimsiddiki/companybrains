import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User, Building, Shield, Bell, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company_id: string | null;
  email_notifications: boolean;
  weekly_digest: boolean;
}
interface Company {
  id: string;
  name: string;
  industry: string | null;
}
interface Member {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role?: string;
}

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const loadAll = async () => {
    if (!user) return;
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (prof) {
      setProfile(prof as Profile);
      if (prof.company_id) {
        const { data: comp } = await supabase.from("companies").select("*").eq("id", prof.company_id).maybeSingle();
        if (comp) setCompany(comp as Company);

        const { data: mems } = await supabase.from("profiles").select("id, first_name, last_name, email").eq("company_id", prof.company_id);
        const { data: roles } = await supabase.from("user_roles").select("user_id, role").eq("company_id", prof.company_id);
        const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) ?? []);
        setMembers((mems ?? []).map(m => ({ ...m, role: roleMap.get(m.id) ?? "member" })));
      }
    }
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [user]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      first_name: profile.first_name,
      last_name: profile.last_name,
    }).eq("id", profile.id);
    setSavingProfile(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  const handleSaveCompany = async () => {
    if (!company) return;
    setSavingCompany(true);
    const { error } = await supabase.from("companies").update({
      name: company.name,
      industry: company.industry,
    }).eq("id", company.id);
    setSavingCompany(false);
    if (error) toast.error(error.message);
    else toast.success("Company updated");
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!company) return;
    const { error } = await supabase.from("companies").delete().eq("id", company.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Workspace deleted");
    await signOut();
    navigate("/");
  };

  const handleNotifToggle = async (field: "email_notifications" | "weekly_digest", value: boolean) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
    const update = field === "email_notifications" ? { email_notifications: value } : { weekly_digest: value };
    const { error } = await supabase.from("profiles").update(update).eq("id", profile.id);
    if (error) toast.error(error.message);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4 hidden sm:inline" />Profile</TabsTrigger>
            <TabsTrigger value="company" className="gap-2"><Building className="w-4 h-4 hidden sm:inline" />Company</TabsTrigger>
            <TabsTrigger value="access" className="gap-2"><Shield className="w-4 h-4 hidden sm:inline" />Access</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4 hidden sm:inline" />Notifications</TabsTrigger>
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
                    <Input id="firstName" value={profile?.first_name ?? ""} onChange={(e) => profile && setProfile({ ...profile, first_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" value={profile?.last_name ?? ""} onChange={(e) => profile && setProfile({ ...profile, last_name: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile?.email ?? ""} disabled />
                </div>
                <Button variant="accent" onClick={handleSaveProfile} disabled={savingProfile || !profile}>
                  {savingProfile ? "Saving..." : "Save changes"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Update your password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <Button variant="accent" onClick={handleUpdatePassword} disabled={updatingPassword}>
                  {updatingPassword ? "Updating..." : "Update password"}
                </Button>
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
                  <Input id="companyName" value={company?.name ?? ""} onChange={(e) => company && setCompany({ ...company, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={company?.industry ?? ""} onValueChange={(v) => company && setCompany({ ...company, industry: v })}>
                    <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tech">Technology</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="accent" onClick={handleSaveCompany} disabled={savingCompany || !company}>
                  {savingCompany ? "Saving..." : "Save changes"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions for your workspace</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="w-4 h-4" />Delete Workspace
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your company, all documents, and team data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteWorkspace} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>People with access to your workspace</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No team members yet</p>
                  ) : (
                    members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <p className="font-medium text-sm flex items-center gap-2">
                              {[m.first_name, m.last_name].filter(Boolean).join(" ") || m.email}
                              {m.id === user?.id && <Badge variant="secondary" className="text-xs">You</Badge>}
                            </p>
                            <p className="text-sm text-muted-foreground">{m.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">{m.role}</Badge>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-6 pt-6 border-t">
                  <Button variant="accent" onClick={() => toast.info("Email invites coming soon")}>
                    Invite team member
                  </Button>
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
                    <p className="text-sm text-muted-foreground">Get notified when new documents are added</p>
                  </div>
                  <Switch
                    checked={profile?.email_notifications ?? false}
                    onCheckedChange={(v) => handleNotifToggle("email_notifications", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly usage digest</p>
                    <p className="text-sm text-muted-foreground">Receive a summary of activity each week</p>
                  </div>
                  <Switch
                    checked={profile?.weekly_digest ?? false}
                    onCheckedChange={(v) => handleNotifToggle("weekly_digest", v)}
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

export default Settings;
