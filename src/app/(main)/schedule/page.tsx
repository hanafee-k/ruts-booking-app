"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/layout/BottomNav";

// Helper Functions
const getNext7Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }
  return days;
};

const getDayName = (date: Date) => {
  return date.toLocaleDateString('th-TH', { weekday: 'short' });
};

const formatTime = (isoString: string) => {
  return new Date(isoString).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
};

export default function SchedulePage() {
  const router = useRouter();
  const supabase = createClient();
  
  // State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  const daysList = getNext7Days();
  // Loop เวลาทำงาน 08:00 - 17:00
  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  // ดึงข้อมูลจาก Supabase
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('bookings')
        .select(`*, rooms ( name, building )`)
        .order('start_time', { ascending: true });

      if (data) {
        // Filter เฉพาะวันที่เลือก
        const filtered = data.filter((booking: any) => {
            const bookingDate = new Date(booking.start_time).toDateString();
            const filterDate = selectedDate.toDateString();
            return bookingDate === filterDate;
        });
        setBookings(filtered);
      }
      
      setLoading(false);
    };

    fetchBookings();
  }, [selectedDate, supabase]);

  // ✅ [แก้จุดที่ 1 & 2] : หา Booking หลายตัว และเช็คช่วงเวลา (Duration)
  const getBookingsForSlot = (slotTimeStr: string) => {
     const slotHour = parseInt(slotTimeStr.split(':')[0]); // แปลง "09:00" -> 9

     return bookings.filter(b => {
        const startHour = new Date(b.start_time).getHours();
        const endHour = new Date(b.end_time).getHours();
        
        // Logic: ช่วงเวลานี้ ต้องมากกว่าหรือเท่ากับเวลาเริ่ม และ น้อยกว่าเวลาจบ
        // เช่น จอง 09-11 (9, 10)
        // Slot 09: 9 >= 9 && 9 < 11 (True) -> โชว์
        // Slot 10: 10 >= 9 && 10 < 11 (True) -> โชว์
        // Slot 11: 11 >= 9 && 11 < 11 (False) -> ไม่โชว์ (จบแล้ว)
        return slotHour >= startHour && slotHour < endHour;
     });
  };

  // ฟังก์ชันกำหนดสถานะ
  const getStatus = (booking: any) => {
    const now = new Date();
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);

    if (now >= start && now <= end) return "IN PROGRESS";
    if (now < start) return "UPCOMING";
    return "CONFIRMED"; // เปลี่ยน FINISHED เป็น CONFIRMED เพื่อความสวยงามในหน้านี้
  };

  return (
    <div className="schedule-page">
      
      {/* 1. Top Bar */}
      <div className="top-bar">
        <div className="top-bar-left">
          <button onClick={() => router.back()} className="btn-circle-back">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <div className="page-titles">
            <h2>ตารางเวลาการจอง</h2>
            <p>Computer Engineering</p>
          </div>
        </div>
        <div className="user-profile-pic">
           <div style={{width:'100%', height:'100%', background:'#cbd5e1', borderRadius:'50%'}}></div>
        </div>
      </div>

      {/* 2. Banner */}
      <div className="section-container">
        <div className="banner-card">
          <div className="banner-content">
            <div className="banner-icon">
              <span className="material-symbols-outlined">school</span>
            </div>
            <div className="banner-text">
              <h3>วิศวกรรมคอมพิวเตอร์ RUTS</h3>
              <p>มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย</p>
            </div>
          </div>
          <span className="material-symbols-outlined more-icon">more_vert</span>
        </div>
      </div>

      {/* 3. Toggle View */}
      <div className="section-container">
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'daily' ? 'active' : ''}`}
            onClick={() => setViewMode('daily')}
          >
            รายวัน
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'weekly' ? 'active' : ''}`}
            onClick={() => setViewMode('weekly')}
          >
            รายสัปดาห์
          </button>
        </div>
      </div>

      {/* 4. Date Strip */}
      <div className="date-strip-container">
        {daysList.map((date, index) => {
          const isSelected = date.getDate() === selectedDate.getDate();
          return (
            <div 
              key={index}
              onClick={() => setSelectedDate(date)}
              className={`date-item ${isSelected ? 'selected' : ''}`}
            >
              <span className="day-name">{getDayName(date)}</span>
              <span className="day-number">{date.getDate()}</span>
              {isSelected && <div className="active-dot"></div>}
            </div>
          );
        })}
      </div>

      {/* 5. Timeline (Real Data - Multi Booking Support) */}
      <div className="timeline-container">
        {loading ? (
           <p className="loading-text">กำลังโหลดข้อมูล...</p>
        ) : (
          <div className="timeline-grid">
            {timeSlots.map((time, index) => {
              // ดึงรายการจองทั้งหมดในช่วงเวลานี้ (Array)
              const slotBookings = getBookingsForSlot(time);
              
              let lineClass = "line-normal";

              return (
                <div key={time} className="timeline-row">
                    <div className="time-column">
                        <span className="time-label">{time}</span>
                        {index !== timeSlots.length - 1 && <div className={`time-line ${lineClass}`}></div>}
                    </div>
                    
                    <div className="content-column" style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                        {/* Logic การแสดงผล: 
                            1. ถ้ามี Booking -> วนลูปแสดงการ์ดทุกใบ (แก้ปัญหาจองหลายห้อง)
                            2. ถ้าไม่มี -> เช็คว่าเป็นเที่ยงไหม? หรือแสดงปุ่มจอง
                        */}
                        
                        {slotBookings.length > 0 ? (
                            slotBookings.map((booking) => {
                                const status = getStatus(booking);
                                
                                // เลือก Style การ์ดตามสถานะ
                                let cardClass = "card-confirmed";
                                let badgeClass = "badge-confirmed";
                                let icon = null;

                                if (status === "IN PROGRESS") {
                                    cardClass = "card-inprogress";
                                    badgeClass = "badge-inprogress";
                                    icon = <span className="material-symbols-outlined icon-pulse">sensors</span>;
                                } else if (status === "UPCOMING") {
                                    cardClass = "card-upcoming";
                                    badgeClass = "badge-upcoming";
                                }

                                return (
                                    <div key={booking.id} className={cardClass}>
                                        <div className="card-header">
                                            <span className={badgeClass}>{status}</span>
                                            {icon}
                                        </div>
                                        <h4>{booking.title}</h4>
                                        {/* ใช้ className card-footer หรือ card-footer-dark ตามประเภทการ์ด */}
                                        <div className={status === "UPCOMING" ? "card-footer-dark" : "card-footer"}>
                                            <span className="material-symbols-outlined">schedule</span> 
                                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                            <span className="dot-separator">•</span>
                                            <span className="material-symbols-outlined">location_on</span> 
                                            {booking.rooms?.name || "ไม่ระบุห้อง"}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            // กรณีไม่มี Booking ในช่วงเวลานี้
                            time === '12:00' ? (
                                <div className="card-break">
                                    <span>พักเที่ยง (Lunch Break)</span>
                                </div>
                            ) : (
                                <div className="card-empty" onClick={() => router.push(`/search?autoTime=${time}`)}>
                                    <span>+ จองช่วงเวลานี้</span>
                                 </div>
                            )
                        )}
                    </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button className="fab-add" onClick={() => router.push('/search')}>
        <span className="material-symbols-outlined">add</span>
      </button>

      <BottomNav />
    </div>
  );
}