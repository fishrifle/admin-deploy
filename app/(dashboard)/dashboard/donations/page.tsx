"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useOrganization } from "@/hooks/use-organization";
import { supabase } from "@/lib/supabase/client";
import { Download, TrendingUp, DollarSign, Users, Heart } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";

export default function DonationsPage() {
  const { organization, loading: orgLoading } = useOrganization();
  const [donations, setDonations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRaised: 0,
    totalDonations: 0,
    averageDonation: 0,
    uniqueDonors: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDonations() {
      if (!organization) return;

      try {
        // Get widget for this organization
        const { data: widget } = await supabase
          .from("widgets")
          .select("id")
          .eq("organization_id", organization.id)
          .single();

        if (!widget) return;

        // Fetch donations
        const { data: donationsData } = await supabase
          .from("donations")
          .select("*, causes(name)")
          .eq("widget_id", widget.id)
          .eq("status", "succeeded")
          .order("created_at", { ascending: false });

        if (donationsData) {
          setDonations(donationsData);

          // Calculate stats
          const total = donationsData.reduce((sum, d) => sum + d.amount, 0);
          const uniqueDonorEmails = new Set(
            donationsData.map((d) => d.donor_email).filter(Boolean)
          );

          setStats({
            totalRaised: total,
            totalDonations: donationsData.length,
            averageDonation:
              donationsData.length > 0 ? total / donationsData.length : 0,
            uniqueDonors: uniqueDonorEmails.size,
          });

          // Prepare chart data for last 30 days
          const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = startOfDay(subDays(new Date(), 29 - i));
            return {
              date: format(date, "MMM dd"),
              amount: 0,
              count: 0,
            };
          });

          donationsData.forEach((donation) => {
            const donationDate = startOfDay(new Date(donation.created_at));
            const dayIndex = last30Days.findIndex(
              (day) => day.date === format(donationDate, "MMM dd")
            );
            if (dayIndex !== -1) {
              last30Days[dayIndex].amount += donation.amount;
              last30Days[dayIndex].count += 1;
            }
          });

          setChartData(last30Days);
        }
      } catch (error) {
        console.error("Error fetching donations:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!orgLoading) {
      fetchDonations();
    }
  }, [organization, orgLoading, supabase]);

  const exportDonations = () => {
    const csv = [
      ["Date", "Donor Name", "Donor Email", "Amount", "Cause", "Status"],
      ...donations.map((d) => [
        format(new Date(d.created_at), "yyyy-MM-dd HH:mm"),
        d.donor_name || "Anonymous",
        d.donor_email || "",
        d.amount,
        d.causes?.name || "General",
        d.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donations-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Donations</h1>
          <p className="text-gray-600 mt-1">
            Track and analyze your donation data
          </p>
        </div>
        <div className="flex items-center gap-4">
          {organization && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Donations for</p>
            </div>
          )}
          <Button onClick={exportDonations} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {stats.totalRaised.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Donations
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDonations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Donation
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.averageDonation.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Donors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueDonors}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Donation Trends (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#0066cc"
                  fill="#0066cc"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Donation Count (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0066cc" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Donations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Donations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Donor</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Cause</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {donations.slice(0, 10).map((donation) => (
                  <tr key={donation.id} className="border-b">
                    <td className="p-2">
                      {format(new Date(donation.created_at), "MMM dd, yyyy")}
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="font-medium">
                          {donation.donor_name || "Anonymous"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {donation.donor_email}
                        </p>
                      </div>
                    </td>
                    <td className="p-2 font-medium">
                      ${donation.amount.toFixed(2)}
                    </td>
                    <td className="p-2">
                      {donation.causes?.name || "General"}
                    </td>
                    <td className="p-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {donation.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
