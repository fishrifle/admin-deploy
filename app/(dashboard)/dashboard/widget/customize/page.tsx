"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WidgetCustomizer } from "@/components/dashboard/widget-customizer";
import { useOrganization } from "@/hooks/use-organization";
import { supabase } from "@/lib/supabase/client";
import { WidgetConfig } from "@/types/widget.types";
import { useToast } from "@/components/ui/use-toast";

export default function CustomizeWidgetPage() {
  const router = useRouter();
  const { organization, loading: orgLoading } = useOrganization();
  const [widget, setWidget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchWidget() {
      if (!organization) return;

      console.log("Fetching widget for organization:", organization.id);

      try {
        const { data: widgetData, error: fetchError } = await supabase
          .from("widgets")
          .select("*")
          .eq("organization_id", organization.id)
          .single();

        console.log("Widget fetch result:", { widgetData, fetchError });

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected for new organizations
          throw fetchError;
        }

        if (widgetData) {
          console.log("Found existing widget:", widgetData);
          setWidget(widgetData);
        } else {
          console.log("No widget found, creating new one...");
          // Create a new widget if none exists
          const { data: newWidget, error } = await supabase
            .from("widgets")
            .insert({
              organization_id: organization.id,
              name: `${organization.name} Widget`,
              slug: organization.name.toLowerCase().replace(/\s+/g, "-"),
              config: {},
            })
            .select()
            .single();

          if (error) throw error;
          setWidget(newWidget);
        }
      } catch (error) {
        console.error("Error fetching widget:", error);
        toast({
          title: "Error",
          description: "Failed to load widget configuration",
          });
      } finally {
        setLoading(false);
      }
    }

    if (!orgLoading && organization) {
      fetchWidget();
    }
  }, [organization, orgLoading, supabase, toast]);

  const handleSave = async (config: WidgetConfig) => {
    if (!widget) return;

    try {
      const { error } = await supabase
        .from("widgets")
        .update({
          config,
          updated_at: new Date().toISOString(),
        })
        .eq("id", widget.id);

      if (error) throw error;

      // Update widget theme
      const { error: themeError } = await supabase
        .from("widget_themes")
        .upsert({
          widget_id: widget.id,
          primary_color: config.theme.primaryColor,
          secondary_color: config.theme.secondaryColor,
          font_family: config.theme.fontFamily,
          border_radius: config.theme.borderRadius,
          custom_css: config.theme.customCss,
        });

      if (themeError) throw themeError;

      // Update causes
      await supabase.from("causes").delete().eq("widget_id", widget.id);

      if (config.causes.length > 0) {
        const { error: causesError } = await supabase.from("causes").insert(
          config.causes.map((cause) => ({
            ...cause,
            widget_id: widget.id,
          }))
        );

        if (causesError) throw causesError;
      }

      toast({
        title: "Success",
        description: "Widget configuration saved successfully",
      });

      // Activate widget if it's the first save
      if (!widget.is_active) {
        await supabase
          .from("widgets")
          .update({ is_active: true })
          .eq("id", widget.id);
      }
    } catch (error) {
      console.error("Error saving widget:", error);
      toast({
        title: "Error",
        description: "Failed to save widget configuration",
      });
    }
  };

  if (loading || orgLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">
          No organization found. Please complete your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Customize Your Widget</h1>
            <p className="text-gray-600 mt-1">
              Design your donation widget to match your brand
            </p>
          </div>
          {organization && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Customizing widget for</p>
              <p className="font-semibold text-lg">{organization.name}</p>
            </div>
          )}
        </div>
      </div>

      {widget ? (
        <WidgetCustomizer
          initialConfig={widget.config || {
            theme: {
              primaryColor: "#3b82f6",
              secondaryColor: "#64748b", 
              fontFamily: "inter",
              borderRadius: "8px"
            },
            causes: [],
            settings: {
              showProgressBar: true,
              showDonorList: true,
              allowRecurring: true,
              minimumDonation: 5,
              suggestedAmounts: [10, 25, 50, 100]
            }
          }}
          widgetId={widget.id}
          organizationName={organization?.name}
          onSave={handleSave}
        />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No widget found. Creating one now...</p>
        </div>
      )}
    </div>
  );
}
