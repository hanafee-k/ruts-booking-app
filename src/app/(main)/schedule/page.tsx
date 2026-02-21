"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/layout/BottomNav";
import "./schedule.css";

// Helper Functions
const formatTime = (isoString: string) => {
  return new Date(isoString).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
};

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 🌟 ฟังก์ชันหา 7 วันในสัปดาห์ (เริ่มวันจันทร์ - จบวันอาทิตย์)
const getWeekDays = (date: Date) => {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1); // ปรับให้เริ่มวันจันทร์
  const monday = new Date(current.setDate(diff));
  
  const days = [];
  for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
  }
  return days;
};

export default function SchedulePage() {
  const router = useRouter();
  const supabase = createClient();
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [allBookings, setAllBookings] = useState<any[]>([]); // 🌟 เปลี่ยนมาเก็บการจองทั้งหมด
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  // ดึงข้อมูลการจองทั้งหมด (หรือในเดือนนั้นๆ)
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`*, rooms ( name, building )`)
        .order('start_time', { ascending: true });

      if (data) {
        setAllBookings(data); // เก็บทั้งหมดไว้ใน State
      }
      setLoading(false);
    };
    fetchBookings();
  }, [supabase]);

  // 🌟 ฟังก์ชันดึงการจองสำหรับ "หน้ารายวัน" (ต้องเช็ควันที่ให้ตรงด้วย)
  const getBookingsForSlot = (slotTimeStr: string) => {
     const slotHour = parseInt(slotTimeStr.split(':')[0]); 
     return allBookings.filter(b => {
        const bDate = new Date(b.start_time);
        // เช็คว่าตรงกับวันที่เลือกไหม
        if (bDate.toDateString() !== selectedDate.toDateString()) return false;

        const startHour = bDate.getHours();
        const endHour = new Date(b.end_time).getHours();
        return slotHour >= startHour && slotHour < endHour;
     });
  };

  // 🌟 ฟังก์ชันดึงการจองสำหรับ "หน้ารายสัปดาห์" (ดึงของวันนั้นๆ)
  const getBookingsForDate = (targetDate: Date) => {
    return allBookings.filter(b => {
       const bDate = new Date(b.start_time);
       return bDate.toDateString() === targetDate.toDateString();
    });
  }

  const getStatus = (booking: any) => {
    const now = new Date();
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    if (now >= start && now <= end) return "IN PROGRESS";
    if (now < start) return "UPCOMING";
    return "CONFIRMED";
  };

  const weekDays = getWeekDays(selectedDate);

  return (
    <div className="schedule-page">

      {/* 1. Banner */}
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

      {/* 2. Toggle View */}
      <div className="section-container">
        <div className="view-toggle-wrapper">
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

     {/* 3. Date Selection */}
      <div className="section-container" style={{marginTop: '16px'}}>
        <style>{`
          .date-overlay::-webkit-calendar-picker-indicator {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            margin: 0; padding: 0; cursor: pointer; opacity: 0;
          }
        `}</style>
        <div className="date-picker-card">
           <div className="date-display">
              <div className="date-icon-box">
                 <span className="material-symbols-outlined">calendar_month</span>
              </div>
              <div className="date-text">
                 <span className="date-label">
                   {viewMode === 'daily' ? 'วันที่ต้องการดู' : 'สัปดาห์ที่ต้องการดู'}
                 </span>
                 <span className="date-value">
                   {viewMode === 'daily' 
                     ? selectedDate.toLocaleDateString('th-TH', { dateStyle: 'long' })
                     : `${weekDays[0].toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - ${weekDays[6].toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`
                   }
                 </span>
              </div>
           </div>
           <span className="material-symbols-outlined dropdown-icon">expand_more</span>
           <input 
              type="date"
              className="date-overlay"
              value={formatDateForInput(selectedDate)}
              onChange={(e) => {
                 if(e.target.value) {
                     const [y, m, d] = e.target.value.split('-').map(Number);
                     setSelectedDate(new Date(y, m - 1, d));
                 }
              }}
           />
        </div>
      </div>

      {/* 4. Content Area (สลับระหว่าง รายวัน / รายสัปดาห์) */}
      {loading ? (
          <div className="loading-state">
            <span className="material-symbols-outlined spin-icon">hourglass_empty</span>
            <p>กำลังโหลดตารางเรียน...</p>
          </div>
      ) : viewMode === 'daily' ? (
        
        /* 🌟 ส่วนที่ 4.1: โหมดรายวัน (Daily View) */
        <div className="timeline-container">
          <div className="timeline-grid">
            {timeSlots.map((time, index) => {
              const slotBookings = getBookingsForSlot(time);
              const isLast = index === timeSlots.length - 1;
              
              return (
                <div key={time} className="timeline-row">
                    <div className="time-column">
                        <span className="time-label">{time}</span>
                        <div className="timeline-dot"></div>
                        {!isLast && <div className="timeline-line"></div>}
                    </div>
                    
                    {/* ข้อมูลด้านขวา */}
                    <div className="content-column" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {slotBookings.length > 0 ? (
                            slotBookings.map((booking) => {
                                const status = getStatus(booking);

                                let cardClass = "card-upcoming";
                                let badgeClass = "badge-upcoming";
                                let icon = null;

                                if (status === "IN PROGRESS") {
                                    cardClass = "card-inprogress";
                                    badgeClass = "badge-inprogress";
                                    icon = <span className="material-symbols-outlined icon-pulse">sensors</span>;
                                }

                                {/* 🌟 กลับมาแสดงการ์ดเต็มๆ แบบเดิมในทุกๆ ชั่วโมงที่มีการจอง */}
                                return (
                                    <div key={`${booking.id}-${time}`} className={`booking-card ${cardClass}`}>
                                        <div className="card-header">
                                            <span className={`status-badge ${badgeClass}`}>{status}</span>
                                            {icon}
                                        </div>
                                        <h4 className="booking-title" style={{textTransform: 'capitalize'}}>
                                          {booking.title || "จองห้องเรียน"}
                                        </h4>
                                        <div className="booking-details">
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
                            time === '12:00' ? (
                                <div className="card-break">
                                    <span className="material-symbols-outlined">restaurant</span>
                                    <span>พักเที่ยง (Lunch Break)</span>
                                </div>
                            ) : (
                                <div className="card-empty" onClick={() => {
                                    const dateStr = formatDateForInput(selectedDate);
                                    router.push(`/search?autoTime=${time}&date=${dateStr}`);
                                  }}>
                                    <span className="material-symbols-outlined">add_circle</span>
                                    <span>จองช่วงเวลานี้</span>
                                 </div>
                            )
                        )}
                    </div>
                </div>
              )
            })}
          </div>
        </div>

      ) : (

        /* 🌟 ส่วนที่ 4.2: โหมดรายสัปดาห์ (Weekly View) */
        <div className="weekly-container">
          {weekDays.map(day => {
            const dayBookings = getBookingsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div key={day.toISOString()} className={`weekly-day-card ${isToday ? 'is-today-card' : ''}`}>
                <div className={`weekly-day-header ${isToday ? 'bg-primary' : ''}`}>
                  <span>{day.toLocaleDateString('th-TH', { weekday: 'long' })}</span>
                  <span>{day.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                </div>
                
                <div className="weekly-day-body">
                  {dayBookings.length > 0 ? (
                    dayBookings.map(b => (
                      <div key={b.id} className="weekly-booking-item">
                        <div className="weekly-time">
                          {formatTime(b.start_time)}<br/>
                          <span style={{color: 'var(--text-gray)', fontWeight: 500}}>{formatTime(b.end_time)}</span>
                        </div>
                        <div className="weekly-info">
                          <h4 style={{textTransform: 'capitalize'}}>{b.title || 'จองห้องเรียน'}</h4>
                          <p>
                            <span className="material-symbols-outlined">location_on</span> 
                            {b.rooms?.name || "ไม่ระบุห้อง"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="weekly-empty">
                      <span className="material-symbols-outlined">event_busy</span>
                      ไม่มีตารางในวันนี้
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      )}

      {/* FAB Button */}
      <button className="fab-add" onClick={() => {
           const dateStr = formatDateForInput(selectedDate);
           router.push(`/search?date=${dateStr}`);
      }}>
        <span className="material-symbols-outlined">add</span>
      </button>

      <BottomNav />
    </div>
  );
}