"use client";

import { useRouter } from "next/navigation";
import { Home, Box, BarChart2, User, LogOut, ShoppingCart } from "lucide-react";

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export default function AdminSidebar({ activePage, setActivePage }: SidebarProps) {
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", key: "dashboard", path: "/admin", icon: <Home size={20} /> },
    { name: "Furniture", key: "furniture", path: "/admin/furniture", icon: <Box size={20} /> },
    { name: "Orders", key: "orders", path: "/admin/orders", icon: <ShoppingCart size={20} /> },
    { name: "HomePage", key: "home", path: "/", icon: <Home size={20} /> },
  
  ];

  const handleLogout = async () => {
    const { supabase } = await import("@/lib/supabase");
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <aside className="w-64 bg-white shadow-md border-r border-gray-200 flex flex-col sticky top-0 h-screen">
      <div className="p-6 text-2xl font-bold text-black border-b">
        Furniture Admin
      </div>

      <nav className="flex-1 px-4 py-4 flex flex-col gap-2">
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setActivePage(item.key);
              router.push(item.path);
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded transition hover:bg-gray-100 ${
              activePage === item.key ? "bg-gray-200 font-semibold" : "text-black"
            }`}
          >
            {item.icon}
            {item.name}
          </button>
        ))}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 mt-4 rounded hover:bg-red-100 text-red-600"
        >
          <LogOut size={20} />
          Logout
        </button>
      </nav>
    </aside>
  );
}