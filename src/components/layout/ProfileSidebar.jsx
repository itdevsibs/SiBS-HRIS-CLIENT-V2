import { useState } from "react";
import { useRouter, usePathname } from "@/lib/router";
import {
  LayoutDashboard,
  User,
  Users,
  Folder,
  FileText,
  Menu,
} from "lucide-react";
import Logo from "@/components/Logo";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);

  // ✅ Menu items (customize based on your system)
  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      name: "Profile",
      icon: User,
      path: "/profile",
    },
    {
      name: "Employees",
      icon: Users,
      path: "/employees",
    },
    {
      name: "Departments",
      icon: Folder,
      path: "/departments",
    },
    {
      name: "Documents",
      icon: FileText,
      path: "/documents",
    },
  ];

  return (
    <aside
      className={`h-screen bg-white border-r shadow-sm flex flex-col transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* 🔹 Top (Logo + Toggle) */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && <Logo />}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* 🔹 Menu */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item, index) => {
          const isActive = pathname === item.path;

          return (
            <button
              key={index}
              onClick={() => router.push(item.path)}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <item.icon size={20} />

              {!collapsed && (
                <span className="text-sm font-medium">
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 🔹 Bottom */}
      {!collapsed && (
        <div className="p-4 border-t text-xs text-gray-400">
          © {new Date().getFullYear()} SiBS HRIS
        </div>
      )}
    </aside>
  );
}