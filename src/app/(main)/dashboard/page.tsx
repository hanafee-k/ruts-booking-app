"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; 
import BottomNav from "@/components/layout/BottomNav";
import { createClient } from "@/lib/supabase/client";

// Types
interface Room {
  id: number;
  name: string;
  capacity: number;
  type: string;
  availableUntil: string;
  status: "available" | "limited";
  image: string;
}

interface Booking {
  id: number;
  room: string;
  date: string;
  status: "completed" | "cancelled";
  icon: string;
}

// ข้อมูล Mock
const availableRooms: Room[] = [
  {
    id: 1,
    name: "ห้อง 301",
    capacity: 40,
    type: "ห้องบรรยาย",
    availableUntil: "16:00",
    status: "available",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCGC4KUyunBfd7HbYzIagNhEKWQc_ya_105ToDFLSpp6d1vwidHGYSBmvlfdpaJl-EDOfUcthPQMvBTgQlfgeuRUlqFnH10mNKNHFXG7g9r1vo1RDEgR5uA-Q2Jb56mPmygS38DjxZtzrNxIPi-8qEPU7LXx-cyA78Z3DdpRwjV6HLxahW6EjGJarCxApwAaogPa1VUeO21nICJ6oP9KYvMzFtLmdA8gXn4CRrHvK0s0dwdqipoGHiWHelp9WUyhWLm2dASREzuKzE"
  },
  {
    id: 2,
    name: "ห้อง 205",
    capacity: 25,
    type: "ห้องปฏิบัติการคอมพิวเตอร์",
    availableUntil: "15:30",
    status: "available",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB6mnTIydBj81qY8WLr-OguMBDE621cWRL_tAxEiLi0z5hl5e4z9tg5zkJysEW-UhrG49afQ0k8cNtJcqTVzgXM9Iw1f8--coZdhQWbuDsjsahd31tx26qg2lcbO32BFHU8f5PmCDXXTHLfcUgvlu04uCvTXRenDesjU9gSYzDYdYgwcnIpaOyIHWEu9DBA0IR4N0pNQ7rhz98oBsbmEyECEuTHv020vnHqvtr3-gjN4N5XPfgfOb0rXXIBzLgoWCQhs4kJ4kk1FBo"
  },
  {
    id: 3,
    name: "ห้อง 101",
    capacity: 10,
    type: "ห้องประชุม",
    availableUntil: "14:00",
    status: "limited",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuATGq76jaK7ZX25nPs_jyEnsmUBEep4VZT4NVF_zv7hZQrAwoaQA8u6Vf30nnqVxu4sp3xcrLHgLnyV3rUWLEgvl5B4xUIj00fxWvPm3KA6dCJOqeyfv43C_ivQL8qNk4Zv84vGAHoYeH_Squ2NuFgg10toG_OUYyB1fUt1MEWwEnW0SpONVR4bsa2O1csIqIKMsRy62qKbtxdn6bVGettDa1afJ_ZgTMBcUQlRA8B6eO2NCeHTGTWdewEvvSjFbkFjdziDqnKbKOI"
  }
];

const bookingHistory: Booking[] = [
  {
    id: 1,
    room: "ห้อง 301",
    date: "เมื่อวาน, 10:00 - 12:00",
    status: "completed",
    icon: "done"
  },
  {
    id: 2,
    room: "ห้อง 205 (ห้องแล็บ)",
    date: "จันทร์, 14:00 - 16:00",
    status: "cancelled",
    icon: "close"
  }
];

const currentBooking = {
  room: "ห้อง 402: โครงสร้างข้อมูล",
  building: "อาคาร 4 • ชั้น 4",
  time: "13:00 - 15:00",
  remaining: "เหลืออีก 1 ชม. 30 นาที",
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAKQo9tOI8mI-TsK8S7gAIE8_n-SWMZ2H3-WZYQO4b6AO8gVRvG81hVUDUCCv2IlYwPu5VWmQDL2iy7STScBrEE33sFGG2aaKR11Jn2sOjJECcmABVlCFG7R9T5d_7gIJ-cL8LQRA1I0YJ_ixjYQ2LmtYoWEqGJ1LMM6mQPrQ"
};

export default function DashboardPage() {
  const router = useRouter(); // เพิ่มบรรทัดนี้
  const [searchQuery, setSearchQuery] = useState("");

  // Filter ห้องตามคำค้นหา
  const filteredRooms = availableRooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle Actions - แก้ไขฟังก์ชันนี้
  const handleBookRoom = (roomId: number) => {
    // ไปหน้า Booking แทน alert
    router.push(`/booking/${roomId}`);
  };

  const handleQuickAction = (action: string) => {
    alert(`คุณกด: ${action}`);
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      
      <header className="dashboard-header">
        <div className="header-user-info">
          <div className="user-avatar-wrapper">
            <div 
              className="user-avatar"
              style={{
                backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCDcCksSmIXuso_J_V_3HbWG9d9iZXDV960HOM1VN-sHVISOtrZxGl-4aol77fDNNNFoDGRA9uRAT7npayyQiPiWwAVqkKylEdGprt-e5lE50JEZeolayzmauH6R3MHl_Pfr0jz78yhCHTwfh5noo7YCQn-r8XnMP0Yl_6c2_QiLG5K22-ciCBfHsDTpUkbHApF9bpGZ64V9k_jl6TYOSbB2GzjB_LZu9R3vCHsHKPVImOU3R6Z4SZho2X7tFQObbW9WQZ2ag-hqYk")`
              }}
            />
            <div className="user-status-dot" />
          </div>
          <div className="user-text">
            <h1 className="user-subtitle">คณะวิศวกรรมศาสตร์ มทร.ศรีวิชัย</h1>
            <p className="user-name">สวัสดี, นักศึกษา</p>
          </div>
        </div>
        <button className="notification-btn" onClick={() => handleQuickAction("การแจ้งเตือน")}>
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Search Bar */}
        <div className="search-container">
          <span className="search-icon material-symbols-outlined">search</span>
          <input
            type="text"
            className="search-input"
            placeholder="ค้นหาห้องหรืออาคาร..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Quick Actions */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">เมนูด่วน</h2>
          </div>
          <div className="quick-actions-grid">
            <button className="quick-action-btn" onClick={() => handleQuickAction("ค้นหาห้อง")}>
              <div className="quick-action-icon quick-action-icon-blue">
                <span className="material-symbols-outlined">search_activity</span>
              </div>
              <span className="quick-action-label">ค้นหาห้อง</span>
            </button>
            <button className="quick-action-btn" onClick={() => handleQuickAction("การจองของฉัน")}>
              <div className="quick-action-icon quick-action-icon-gold">
                <span className="material-symbols-outlined">calendar_month</span>
              </div>
              <span className="quick-action-label">การจองของฉัน</span>
            </button>
            <button className="quick-action-btn" onClick={() => handleQuickAction("เช็คอิน")}>
              <div className="quick-action-icon quick-action-icon-lightblue">
                <span className="material-symbols-outlined">qr_code_scanner</span>
              </div>
              <span className="quick-action-label">เช็คอิน</span>
            </button>
            <button className="quick-action-btn" onClick={() => handleQuickAction("แจ้งปัญหา")}>
              <div className="quick-action-icon quick-action-icon-red">
                <span className="material-symbols-outlined">report_problem</span>
              </div>
              <span className="quick-action-label">แจ้งปัญหา</span>
            </button>
          </div>
        </section>

        {/* Happening Now */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">กำลังใช้งาน</h2>
            <span className="status-badge status-badge-checking">
              <span className="status-dot" />
              กำลังเช็คอิน...
            </span>
          </div>
          <div className="happening-card">
            <div className="happening-card-decoration" />
            <div className="happening-card-content">
              <div 
                className="happening-card-image"
                style={{ backgroundImage: `url("${currentBooking.image}")` }}
              />
              <div className="happening-card-details">
                <h3 className="happening-room-name">{currentBooking.room}</h3>
                <p className="happening-building">{currentBooking.building}</p>
                <div className="happening-time-info">
                  <span className="material-symbols-outlined">schedule</span>
                  <span className="happening-time">{currentBooking.time}</span>
                  <span className="happening-remaining">{currentBooking.remaining}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Available Now */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">ห้องว่าง</h2>
            <button className="see-all-link" onClick={() => handleQuickAction("ดูทั้งหมด")}>
              ดูทั้งหมด
            </button>
          </div>
          <div className="rooms-scroll-container">
            {filteredRooms.length > 0 ? (
              filteredRooms.map((room) => (
                <div 
                  key={room.id} 
                  className="room-card"
                  style={{ cursor: 'pointer' }} // เพิ่มบรรทัดนี้
                  onClick={() => handleBookRoom(room.id)} // เพิ่มบรรทัดนี้
                >
                  <div 
                    className="room-image"
                    style={{ backgroundImage: `url("${room.image}")` }}
                  >
                    <span className={`room-status-badge ${room.status === "available" ? "status-available" : "status-limited"}`}>
                      {room.status === "available" ? "ว่าง" : "จำกัด"}
                    </span>
                  </div>
                  <div className="room-details">
                    <div className="room-header">
                      <h3 className="room-name">{room.name}</h3>
                      <div className="room-capacity">
                        <span className="material-symbols-outlined">group</span>
                        <span>{room.capacity}</span>
                      </div>
                    </div>
                    <div className="room-info">
                      <span>ว่างจนถึง {room.availableUntil} น.</span>
                      <div className="room-info-dot" />
                      <span>{room.type}</span>
                    </div>
                    <button 
                      className="room-book-btn"
                      onClick={(e) => {
                        e.stopPropagation(); // ป้องกันไม่ให้ trigger card click
                        handleBookRoom(room.id);
                      }}
                    >
                      จองห้อง
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <span className="material-symbols-outlined">search_off</span>
                <p>ไม่พบห้องที่ค้นหา</p>
              </div>
            )}
          </div>
        </section>

        {/* Booking History */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">ประวัติการจอง</h2>
          </div>
          <div className="booking-history-container">
            {bookingHistory.map((booking) => (
              <div key={booking.id} className="booking-history-item">
                <div className="booking-history-left">
                  <div className={`booking-history-icon ${booking.status === "completed" ? "icon-completed" : "icon-cancelled"}`}>
                    <span className="material-symbols-outlined">{booking.icon}</span>
                  </div>
                  <div className="booking-history-text">
                    <p className="booking-room-name">{booking.room}</p>
                    <p className="booking-date">{booking.date}</p>
                  </div>
                </div>
                <span className={`booking-status-badge ${booking.status === "completed" ? "status-completed" : "status-cancelled"}`}>
                  {booking.status === "completed" ? "เสร็จสิ้น" : "ยกเลิก"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation - ใช้ Component */}
      <BottomNav onQuickAction={handleQuickAction} />
    </div>
  );
}