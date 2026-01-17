"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./admin.css"; // เรียกใช้ CSS ที่เราปรับปรุงล่าสุด

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="admin-container">
      
      {/* พื้นที่เนื้อหาหลัก (Main Content) */}
      <main className="admin-content">
        {children}
      </main>

      {/* Bottom Navigation (เมนูล่าง) */}
      <nav className="admin-sidebar">
        <div style={{display:'flex', width:'100%', justifyContent:'space-between'}}>
            
            <Link href="/admin/dashboard" className={`nav-link ${pathname === '/admin/dashboard' ? 'active' : ''}`}>
                <span className="material-symbols-outlined">dashboard</span>
                <span>แดชบอร์ด</span>
            </Link>
            
            <Link href="/admin/bookings" className={`nav-link ${pathname === '/admin/bookings' ? 'active' : ''}`}>
                <span className="material-symbols-outlined">event_note</span>
                <span>จอง</span>
            </Link>
            
            <Link href="/admin/rooms" className={`nav-link ${pathname === '/admin/rooms' ? 'active' : ''}`}>
                <span className="material-symbols-outlined">meeting_room</span>
                <span>ห้อง</span>
            </Link>

            <Link href="/admin/users" className={`nav-link ${pathname === '/admin/users' ? 'active' : ''}`}>
                <span className="material-symbols-outlined">group</span>
                <span>ผู้ใช้</span>
            </Link>

            <Link href="/" className="nav-link" style={{color: '#94a3b8'}}>
                <span className="material-symbols-outlined">logout</span>
                <span>ออก</span>
            </Link>
            
        </div>
      </nav>

    </div>
  );
}