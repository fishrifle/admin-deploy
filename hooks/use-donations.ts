"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";

type Donation = Database["public"]["Tables"]["donations"]["Row"];

interface DonationStats {
  totalRaised: number;
  totalDonations: number;
  averageDonation: number;
  uniqueDonors: number;
}

export function useDonations(widgetId?: string) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats>({
    totalRaised: 0,
    totalDonations: 0,
    averageDonation: 0,
    uniqueDonors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchDonations() {
      if (!widgetId) {
        setLoading(false);
        return;
      }

      try {
        const [donationsResult, statsResult] = await Promise.all([
          supabase
            .from("donations")
            .select("*, causes(name)")
            .eq("widget_id", widgetId)
            .eq("status", "succeeded")
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .rpc('get_donation_stats', { widget_id: widgetId })
        ]);

        if (donationsResult.error) throw donationsResult.error;

        if (mounted) {
          setDonations(donationsResult.data || []);
          
          if (statsResult.data && statsResult.data.length > 0) {
            const stats = statsResult.data[0];
            setStats({
              totalRaised: stats.total_raised || 0,
              totalDonations: stats.total_donations || 0,
              averageDonation: stats.average_donation || 0,
              uniqueDonors: stats.unique_donors || 0,
            });
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchDonations();

    // Set up real-time subscription (only if less than 1000 donations)
    let subscription: any;
    if (donations.length < 1000) {
      subscription = supabase
        .channel("donations")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "donations",
            filter: `widget_id=eq.${widgetId}`,
          },
          (payload) => {
            if (mounted) {
              // Type guard for donation data
              const newDonation = payload.new;
              if (newDonation && typeof newDonation === 'object' && 'id' in newDonation && 'amount' in newDonation) {
                setDonations((prev) => [newDonation as Donation, ...prev.slice(0, 49)]);
              } else {
                console.error('Invalid donation data received:', newDonation);
              }
            }
          }
        )
        .subscribe();
    }

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [widgetId]);

  return { donations, stats, loading, error };
}
