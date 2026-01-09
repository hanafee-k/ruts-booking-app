"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface BottomNavProps {
  onQuickAction?: (action: string) => void;
}

export default function BottomNav({ onQuickAction }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // กำหนด active state ตาม pathname
  const getActiveNav = () => {
    if (pathname === "/dashboard") return "home";
    if (pathname === "/search") return "search";
    if (pathname === "/schedule") return "schedule";
    if (pathname === "/profile") return "profile";
    return "home";
  };

  const activeNav = getActiveNav();

  // Handle Navigation
  const handleNavClick = (route: string) => {
    switch(route) {
      case "home":
        router.push("/dashboard");
        break;
      case "search":
        router.push("/search");
        break;
      case "schedule":
        router.push("/schedule");
        break;
      case "profile":
        router.push("/profile");
        break;
    }
  };

  // Handle QR Scan
  const handleQRScan = () => {
    if (onQuickAction) {
      onQuickAction("สแกน QR");
    } else {
      // หรือจะเปิดหน้า QR Scanner
      // router.push("/scan-qr");
      alert("เปิด QR Scanner");
    }
  };

  return (
    <nav className="bottom-nav">
      <button 
        className={`nav-btn ${activeNav === "home" ? "nav-btn-active" : ""}`}
        onClick={() => handleNavClick("home")}
      >
        <span className={`material-symbols-outlined ${activeNav === "home" ? "icon-filled" : ""}`}>
          home
        </span>
        <span className="nav-label">หน้าหลัก</span>
      </button>
      
      <button 
        className={`nav-btn ${activeNav === "search" ? "nav-btn-active" : ""}`}
        onClick={() => handleNavClick("search")}
      >
        <span className="material-symbols-outlined">search</span>
        <span className="nav-label">ค้นหา</span>
      </button>
      
      <div className="nav-center-wrapper">
        <button className="nav-center-btn" onClick={handleQRScan}>
          <span className="material-symbols-outlined">qr_code_scanner</span>
        </button>
      </div>
      
      <button 
        className={`nav-btn ${activeNav === "schedule" ? "nav-btn-active" : ""}`}
        onClick={() => handleNavClick("schedule")}
      >
        <span className="material-symbols-outlined">calendar_today</span>
        <span className="nav-label">ตารางเรียน</span>
      </button>
      
      <button 
        className={`nav-btn ${activeNav === "profile" ? "nav-btn-active" : ""}`}
        onClick={() => handleNavClick("profile")}
      >
        <span className="material-symbols-outlined">person</span>
        <span className="nav-label">โปรไฟล์</span>
      </button>
    </nav>
  );
}