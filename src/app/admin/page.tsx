"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminSidebar from "@/app/components/AdminSidebar";
import type { User } from "@supabase/supabase-js";

interface Stats {
  totalFurniture: number;
  publishedFurniture: number;
  totalUsers: number;
  savedConfigs: number;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<"dashboard" | string>("dashboard");
  const [stats, setStats] = useState<Stats>({
    totalFurniture: 0,
    publishedFurniture: 0,
    totalUsers: 0,
    savedConfigs: 0,
  });

  useEffect(() => {
    const init = async () => {
      try {
        // Get current session
        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session) {
          window.location.replace("/auth/login");
          return;
        }
        setUser(data.session.user);

        // Fetch stats
        const { count: totalFurniture } = await supabase
          .from("furniture")
          .select("*", { count: "exact" });

        const { count: publishedFurniture } = await supabase
          .from("furniture")
          .select("*", { count: "exact" })
          .eq("is_published", true);

        const { count: totalUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact" });

        const { count: savedConfigs } = await supabase
          .from("furniture_configurations")
          .select("*", { count: "exact" });

        setStats({
          totalFurniture: totalFurniture || 0,
          publishedFurniture: publishedFurniture || 0,
          totalUsers: totalUsers || 0,
          savedConfigs: savedConfigs || 0,
        });
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      }
    };

    init();
  }, []);

  if (!user)
    return (
      <div className="text-center mt-20 text-lg text-black">
        Loading...
      </div>
    );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar activePage={activePage} setActivePage={setActivePage} />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6 capitalize text-black">{activePage}</h1>
        <p className="mb-8 text-black">
          Welcome, {user.email}. {activePage === "dashboard" && "Here’s your admin overview."}
        </p>

        {activePage === "dashboard" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Total Furniture", value: stats.totalFurniture },
                { label: "Published Furniture", value: stats.publishedFurniture },
                { label: "Total Users", value: stats.totalUsers },
                { label: "Saved Configurations", value: stats.savedConfigs },
              ].map((card) => (
                <div key={card.label} className="bg-white p-6 shadow-md rounded-lg">
                  <h2 className="text-gray-500 text-sm">{card.label}</h2>
                  <p className="text-2xl font-bold text-black">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 shadow-md rounded-lg mb-8">
              <h2 className="text-xl font-semibold mb-4 text-black">Recent Activity</h2>
              <ul className="text-black">
                <li>Admin uploaded 'Modern Chair' 2h ago</li>
                <li>User John Doe saved 'Wooden Table'</li>
                <li>Admin published 'Luxury Sofa'</li>
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className="bg-white p-6 shadow-md rounded-lg cursor-pointer hover:shadow-xl transition text-black"
                onClick={() => window.location.href = "/dashboard/admin/furniture/upload"}
              >
                <h3 className="text-lg font-semibold mb-2">Upload Furniture</h3>
                <p>Add new 3D furniture models to your catalog.</p>
              </div>
              <div
                className="bg-white p-6 shadow-md rounded-lg cursor-pointer hover:shadow-xl transition text-black"
                onClick={() => window.location.href = "/dashboard/admin/furniture"}
              >
                <h3 className="text-lg font-semibold mb-2">View Catalog</h3>
                <p>Browse all furniture items and check published status.</p>
              </div>
              <div
                className="bg-white p-6 shadow-md rounded-lg cursor-pointer hover:shadow-xl transition text-black"
                onClick={() => window.location.href = "/dashboard/admin/analytics"}
              >
                <h3 className="text-lg font-semibold mb-2">Analytics</h3>
                <p>View reports and statistics (coming soon).</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}