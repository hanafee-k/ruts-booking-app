"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/layout/BottomNav";
import "./schedule.css";

// Helper Functions
const getDayName = (date: Date) => {
  return date.toLocaleDateString('th-TH', { weekday: 'long' });
};

const formatTime = (isoString: string) => {
  return new Date(isoString).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
};

// Helper สำหรับแปลงวันที่ให้ตรงกับ Input (YYYY-MM-DD)
const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function SchedulePage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Ref สำหรับปฏิทิน
  const dateInputRef = useRef<HTMLInputElement>(null);

  // State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

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

  // หา Booking หลายตัว และเช็คช่วงเวลา (Duration)
  const getBookingsForSlot = (slotTimeStr: string) => {
     const slotHour = parseInt(slotTimeStr.split(':')[0]); 

     return bookings.filter(b => {
        const startHour = new Date(b.start_time).getHours();
        const endHour = new Date(b.end_time).getHours();
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
    return "CONFIRMED";
  };

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

      {/* 3. Date Selection (แก้ใหม่: ใช้ JS สั่งเปิด 100% กดง่ายแน่นอน) */}
      <div className="section-container" style={{marginTop: '16px'}}>
        <div 
          onClick={() => dateInputRef.current?.showPicker()} // ✅ สั่งเปิดปฏิทินทันทีที่แตะกล่อง
          style={{
            position: 'relative',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            cursor: 'pointer' // ให้รู้ว่ากดได้
          }}
        >
           {/* ส่วนแสดงผล: ใส่ pointerEvents: 'none' เพื่อให้นิ้วทะลุไปกดกล่องแม่ */}
           <div style={{display:'flex', alignItems:'center', gap:'12px', pointerEvents: 'none'}}>
              <div style={{
                  width:'40px', height:'40px', 
                  background:'#f1f5f9', borderRadius:'10px', 
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#002855'
              }}>
                 <span className="material-symbols-outlined">calendar_month</span>
              </div>
              <div style={{display:'flex', flexDirection:'column'}}>
                 <span style={{fontSize:'0.75rem', color:'#64748b', fontWeight:600}}>วันที่ต้องการดู</span>
                 <span style={{fontSize:'1rem', color:'#0f172a', fontWeight:700}}>
                    {selectedDate.toLocaleDateString('th-TH', { dateStyle: 'long' })}
                 </span>
              </div>
           </div>
           
           <span className="material-symbols-outlined" style={{color:'#94a3b8', pointerEvents: 'none'}}>expand_more</span>

           {/* Input ซ่อนไว้ข้างหลังเฉยๆ เพื่อรอคำสั่ง showPicker */}
           <input 
              ref={dateInputRef}
              type="date"
              style={{
                position: 'absolute',
                opacity: 0,
                bottom: 0,
                left: 0,
                width: 1,  // ทำให้เล็กจนไม่กวน layout
                height: 1,
                pointerEvents: 'none' // ห้ามกดโดนตัว input เอง (เราจะใช้กล่องแม่กดแทน)
              }}
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

      {/* 4. Timeline */}
      <div className="timeline-container">
        {loading ? (
           <p className="loading-text">กำลังโหลดข้อมูล...</p>
        ) : (
          <div className="timeline-grid">
            {timeSlots.map((time, index) => {
              const slotBookings = getBookingsForSlot(time);
              
              return (
                <div key={time} className="timeline-row">
                    <div className="time-column">
                        <span className="time-label">{time}</span>
                        {index !== timeSlots.length - 1 && <div className="time-line line-normal"></div>}
                    </div>
                    
                    <div className="content-column" style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                        {slotBookings.length > 0 ? (
                            slotBookings.map((booking) => {
                                const status = getStatus(booking);
                                
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
                                        <h4>{booking.title || "จองห้องเรียน"}</h4>
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
                            time === '12:00' ? (
                                <div className="card-break">
                                    <span>พักเที่ยง (Lunch Break)</span>
                                </div>
                            ) : (
                                // ✅ แก้ตรงนี้: ส่งวันที่ (date) ไปด้วย
                                <div 
                                  className="card-empty" 
                                  onClick={() => {
                                    const dateStr = formatDateForInput(selectedDate);
                                    router.push(`/search?autoTime=${time}&date=${dateStr}`);
                                  }}
                                >
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

      {/* ✅ ปุ่มบวก: ก็ส่งวันที่ไปด้วย */}
      <button 
        className="fab-add" 
        onClick={() => {
           const dateStr = formatDateForInput(selectedDate);
           router.push(`/search?date=${dateStr}`);
        }}
      >
        <span className="material-symbols-outlined">add</span>
      </button>

      <BottomNav />
    </div>
  );
}