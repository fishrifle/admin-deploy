"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@/hooks/use-organization";
import { InitiativeManager } from "@/components/dashboard/initiative-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Initiative } from "@/types/initiative.types";
import { useToast } from "@/components/ui/use-toast";


export default function InitiativesPage() {
  const { organization, loading: orgLoading } = useOrganization();
  const { toast } = useToast();
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (organization) {
      fetchInitiatives();
    }
  }, [organization]);

  const fetchInitiatives = async () => {
    if (!organization) return;

    try {
      // Using imported supabase client
      
      // First get widgets for this organization
      const { data: widgets, error: widgetsError } = await supabase
        .from("widgets")
        .select("id")
        .eq("organization_id", organization.id);

      if (widgetsError) throw widgetsError;

      if (widgets && widgets.length > 0) {
        const widgetIds = widgets.map(w => w.id);
        
        // Then get initiatives for those widgets
        const { data: initiativesData, error: initiativesError } = await supabase
          .from("initiatives")
          .select("*")
          .in("widget_id", widgetIds)
          .order("created_at", { ascending: false });

        if (initiativesError) throw initiativesError;

        setInitiatives(initiativesData || []);
      }
    } catch (error) {
      console.error("Error fetching initiatives:", error);
      toast({
        title: "Error",
        description: "Failed to load initiatives",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitiativesChange = async (newInitiatives: Initiative[]) => {
    // This is mainly for preview purposes
    // In a real implementation, you'd save these to the database
    setInitiatives(newInitiatives);
  };

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading initiatives...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Organization Not Found</h2>
        <p className="text-gray-600">
          Please contact support if this error persists.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Initiatives</h1>
          <p className="text-gray-600">
            Manage your fundraising initiatives and campaigns
          </p>
        </div>
      </div>

      {initiatives.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Heart className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Initiatives Yet</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Create your first fundraising initiative to start accepting donations. 
              Initiatives can be assigned to donation widgets and help organize your campaigns.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create First Initiative
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Initiatives</CardTitle>
          </CardHeader>
          <CardContent>
            <InitiativeManager
              initiatives={initiatives}
              onChange={handleInitiativesChange}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>About Initiatives</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">What are initiatives?</h4>
            <p className="text-sm text-gray-600">
              Initiatives are specific fundraising campaigns or causes that your organization supports. 
              Each initiative can have its own goal, description, and suggested donation amounts.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">How do they work with widgets?</h4>
            <p className="text-sm text-gray-600">
              When creating donation widgets, you can select which initiatives to include. 
              Donors will be able to choose which initiative they want to support, 
              or you can create widgets for specific initiatives.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Suggested amounts</h4>
            <p className="text-sm text-gray-600">
              Set custom suggested donation amounts for each initiative. 
              These amounts will be displayed as quick-select buttons in your donation widgets.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}