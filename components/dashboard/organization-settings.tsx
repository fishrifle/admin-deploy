"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Building, CreditCard, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useStripeConnect } from "@/hooks/use-stripe-connect";
import { Organization } from "@/types/organization.types";
import { useToast } from "@/components/ui/use-toast";

interface OrganizationSettingsProps {
  organizationId: string;
}

export function OrganizationSettings({ organizationId }: OrganizationSettingsProps) {
  const { userId } = useAuth();
  const { toast } = useToast();
  const { createConnectAccount, checkStatus, openDashboard, loading: stripeLoading } = useStripeConnect();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<{
    connected: boolean;
    onboardingComplete: boolean;
    requiresAction: boolean;
    actionUrl?: string;
  }>({
    connected: false,
    onboardingComplete: false,
    requiresAction: false,
  });

  const [formData, setFormData] = useState({
    legalName: "",
    displayName: "",
    email: "",
    termsOfServiceUrl: "",
  });

  useEffect(() => {
    fetchOrganization();
    fetchStripeStatus();
  }, [organizationId]);

  const fetchOrganization = async () => {
    try {
      // Using imported supabase client
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organizationId)
        .single();

      if (error) throw error;

      setOrganization(data);
      setFormData({
        legalName: data.legal_name || data.name || "",
        displayName: data.display_name || data.name || "",
        email: data.email || "",
        termsOfServiceUrl: data.terms_of_service_url || "",
      });
    } catch (error) {
      console.error("Error fetching organization:", error);
      toast({
        title: "Error",
        description: "Failed to load organization details",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStripeStatus = async () => {
    try {
      const status = await checkStatus(organizationId);
      setStripeStatus({
        connected: !!status.accountId,
        onboardingComplete: status.onboardingComplete,
        requiresAction: status.requiresAction,
        actionUrl: status.actionUrl,
      });
    } catch (error) {
      // No Stripe account yet, which is fine
      setStripeStatus({
        connected: false,
        onboardingComplete: false,
        requiresAction: false,
      });
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Using imported supabase client
      const { error } = await supabase
        .from("organizations")
        .update({
          legal_name: formData.legalName,
          display_name: formData.displayName,
          email: formData.email,
          terms_of_service_url: formData.termsOfServiceUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", organizationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization profile updated successfully",
      });

      fetchOrganization();
    } catch (error) {
      console.error("Error updating organization:", error);
      toast({
        title: "Error",
        description: "Failed to update organization profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      await createConnectAccount(organizationId);
    } catch (error) {
      console.error("Error connecting Stripe:", error);
      toast({
        title: "Error",
        description: "Failed to set up Stripe Connect",
      });
    }
  };

  const handleOpenStripeDashboard = async () => {
    try {
      await openDashboard(organizationId);
    } catch (error) {
      console.error("Error opening Stripe dashboard:", error);
      toast({
        title: "Error",
        description: "Failed to open Stripe dashboard",
      });
    }
  };

  if (loading) {
    return <div>Loading organization settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-gray-600">Manage your organization profile and payment settings</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">
            <Building className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="legal-name">Legal Name *</Label>
                  <Input
                    id="legal-name"
                    value={formData.legalName}
                    onChange={(e) => setFormData(prev => ({ ...prev, legalName: e.target.value }))}
                    placeholder="Your organization's legal name"
                    autoComplete="organization"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Used for official documents and tax purposes
                  </p>
                </div>

                <div>
                  <Label htmlFor="display-name">Display Name *</Label>
                  <Input
                    id="display-name"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Name shown to donors"
                    autoComplete="organization"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This name appears on donation widgets
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="email">Contact Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@yourorg.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <Label htmlFor="terms-url">Terms of Service URL</Label>
                <Input
                  id="terms-url"
                  type="url"
                  value={formData.termsOfServiceUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, termsOfServiceUrl: e.target.value }))}
                  placeholder="https://yourorg.com/terms"
                  autoComplete="url"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Link to your terms of service (optional, but recommended)
                </p>
              </div>

              <Button 
                onClick={handleSaveProfile} 
                disabled={saving || !formData.legalName || !formData.displayName || !formData.email}
              >
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Processing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!stripeStatus.connected ? (
                <div className="border rounded-lg p-6 text-center">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Connect Stripe Account</h3>
                  <p className="text-gray-600 mb-4">
                    Connect your Stripe account to start accepting donations. 
                    You&apos;ll be redirected to Stripe to complete the setup process.
                  </p>
                  <Button 
                    onClick={handleConnectStripe} 
                    disabled={stripeLoading}
                    size="lg"
                  >
                    {stripeLoading ? "Connecting..." : "Connect with Stripe"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    {stripeStatus.onboardingComplete ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">
                        {stripeStatus.onboardingComplete 
                          ? "Stripe Account Connected" 
                          : "Stripe Setup Required"
                        }
                      </p>
                      <p className="text-sm text-gray-600">
                        {stripeStatus.onboardingComplete
                          ? "Your Stripe account is fully set up and ready to accept payments"
                          : "Complete your Stripe onboarding to start accepting donations"
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {stripeStatus.requiresAction && stripeStatus.actionUrl && (
                      <Button
                        onClick={() => window.open(stripeStatus.actionUrl, "_blank")}
                        variant="outline"
                      >
                        Complete Setup
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                    
                    {stripeStatus.onboardingComplete && (
                      <Button
                        onClick={handleOpenStripeDashboard}
                        disabled={stripeLoading}
                        variant="outline"
                      >
                        {stripeLoading ? "Opening..." : "Open Stripe Dashboard"}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    )}

                    <Button
                      onClick={fetchStripeStatus}
                      variant="ghost"
                      size="sm"
                    >
                      Refresh Status
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}