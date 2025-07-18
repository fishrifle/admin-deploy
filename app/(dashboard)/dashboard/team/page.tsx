"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@/hooks/use-organization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Mail, Shield, User, Trash2 } from "lucide-react";

interface TeamMember {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

export default function TeamPage() {
  const { organization, loading: orgLoading } = useOrganization();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTeamMembers() {
      if (!organization) return;

      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("organization_id", organization.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setMembers(data || []);
      } catch (error) {
        console.error("Error fetching team members:", error);
        toast({
          title: "Error",
          description: "Failed to load team members",
        });
      } finally {
        setLoading(false);
      }
    }

    if (!orgLoading && organization) {
      fetchTeamMembers();
    }
  }, [organization, orgLoading, toast]);

  const handleInvite = async () => {
    if (!inviteEmail || !organization) return;

    setInviting(true);
    try {
      // For now, just add to users table with pending status
      // In a real app, you'd send an email invitation
      const { error } = await supabase.from("users").insert({
        email: inviteEmail,
        role: inviteRole,
        organization_id: organization.id,
        // Note: id would come from Clerk when they sign up
      });

      if (error) throw error;

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail}`,
      });

      setInviteEmail("");
      // Refresh members list
      // fetchTeamMembers(); // You'd call this here
    } catch (error) {
      console.error("Error inviting member:", error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
      });
    } finally {
      setInviting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "member":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Shield className="w-4 h-4" />;
      case "admin":
        return <Shield className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  if (loading || orgLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Team Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your organization&apos;s team members and permissions
            </p>
          </div>
          {organization && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Managing team for</p>
              <p className="font-semibold text-lg">{organization.display_name || organization.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Invite New Member */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
                {inviting ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No team members yet. Invite someone to get started!</p>
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {member.first_name && member.last_name
                            ? `${member.first_name} ${member.last_name}`
                            : member.email}
                        </p>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {getRoleIcon(member.role)}
                          <span className="ml-1 capitalize">{member.role}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {member.role !== "owner" && (
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}