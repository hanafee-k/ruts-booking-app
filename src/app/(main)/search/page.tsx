"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/layout/BottomNav";
import "./search.css";

// Interface
interface Room {
  id: number;
  name: string;
  building: string;
  capacity: number;
  facilities: string[]; 
  image_url: string | null;
  status: 'active' | 'maintenance';
}

// ✅ Helper ฟังก์ชันสำหรับแปลงชื่อสิ่งอำนวยความสะดวกเป็นไอคอน (รองรับทั้ง EN และ TH)
const getFacilityIcon = (fac: string) => {
  const key = fac.toLowerCase();
  if (key.includes('wifi') || key.includes('ไวไฟ') || key.includes('เน็ต')) return 'wifi';
  if (key.includes('projector') || key.includes('โปรเจคเตอร์')) return 'videocam';
  if (key.includes('power') || key.includes('ปลั๊ก') || key.includes('ไฟ')) return 'power';
  if (key.includes('whiteboard') || key.includes('กระดาน') || key.includes('ไวท์บอร์ด')) return 'developer_board';
  if (key.includes('computer') || key.includes('คอม')) return 'desktop_windows';
  if (key.includes('aircon') || key.includes('แอร์') || key.includes('อากาศ')) return 'ac_unit';
  
  return 'check_circle'; // ไอคอนเริ่มต้นถ้าหาไม่เจอ
};

// ฟังก์ชันดึงวันที่ปัจจุบันแบบเวลาไทย (แก้บัค Hydration)
const getLocalDateString = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().split('T')[0];
};

function SearchContent() {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  
  const autoTime = searchParams.get('autoTime');
  const autoDate = searchParams.get('date');

  const [isMounted, setIsMounted] = useState(false);

  // --- States ---
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [date, setDate] = useState(autoDate || "");
  const [startTime, setStartTime] = useState(autoTime || "09:00");
  
  // Filters
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [filterProjector, setFilterProjector] = useState(false);
  const [filterPower, setFilterPower] = useState(false);
  const [filterLarge, setFilterLarge] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!autoDate) {
      setDate(getLocalDateString());
    } else {
      setDate(autoDate);
    }
  }, [autoDate]);

  // --- 1. ดึงข้อมูล "ห้องทั้งหมด" ---
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .order('name', { ascending: true });
          
        if (error) throw error;
        if (data) setRooms(data);
      } catch (err) {
        console.error("Error fetching rooms:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [supabase]);

  // --- 2. ดึงข้อมูล "การจอง" ตามวันที่เลือก ---
  useEffect(() => {
    if (!date) return;
    const fetchBookings = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('room_id, start_time, end_time')
        .neq('status', 'cancelled')
        .gte('start_time', `${date}T00:00:00`)
        .lte('end_time', `${date}T23:59:59`);

      if (data) setBookings(data);
    };
    fetchBookings();
  }, [date, supabase]);

  // --- Logic เช็คห้องว่าง ---
  const checkIsRoomFree = (roomId: number) => {
    if (!date) return true;
    const endHour = parseInt(startTime.split(':')[0]) + 3; 
    const endTimeStr = `${endHour.toString().padStart(2, '0')}:${startTime.split(':')[1]}`;
    
    const selectedStart = new Date(`${date}T${startTime}`);
    const selectedEnd = new Date(`${date}T${endTimeStr}`);

    const roomBookings = bookings.filter(b => b.room_id === roomId);

    const hasConflict = roomBookings.some(booking => {
      const bookedStart = new Date(booking.start_time);
      const bookedEnd = new Date(booking.end_time);
      return selectedStart < bookedEnd && selectedEnd > bookedStart;
    });

    return !hasConflict;
  };

  // --- Filter Logic ---
  const filteredRooms = rooms.filter(room => {
    const matchName = room.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (room.building || "").toLowerCase().includes(searchTerm.toLowerCase());

    const isMaintenance = room.status === 'maintenance';
    const isTimeFree = checkIsRoomFree(room.id);
    const isAvailable = !isMaintenance && isTimeFree;

    if (filterAvailable && !isAvailable) return false;
    
    // ดักจับฟิลเตอร์ตามชื่อที่อาจเซฟไว้ใน DB
    const hasFac = (facList: string[], keyword: string) => 
      facList?.some(f => f.toLowerCase().includes(keyword));

    if (filterProjector && !hasFac(room.facilities, 'projector') && !hasFac(room.facilities, 'โปรเจคเตอร์')) return false;
    if (filterPower && !hasFac(room.facilities, 'power') && !hasFac(room.facilities, 'ปลั๊ก')) return false;
    if (filterLarge && room.capacity < 40) return false;

    return matchName;
  });

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  return (
    <div className="search-page">
      {/* 🌟 CSS ยืดไอคอนปฏิทินให้เต็มกล่อง ห้ามใช้ display: none เด็ดขาด */}
      <style dangerouslySetInnerHTML={{__html: `
        .ultimate-hidden-input {
          position: absolute !important; top: 0 !important; left: 0 !important;
          width: 100% !important; height: 100% !important; opacity: 0 !important; 
          z-index: 50 !important; cursor: pointer !important;
          color: transparent !important; background: transparent !important; border: none !important;
        }
        .ultimate-hidden-input::-webkit-calendar-picker-indicator {
          position: absolute !important; top: 0 !important; left: 0 !important;
          width: 100% !important; height: 100% !important;
          margin: 0 !important; padding: 0 !important;
          cursor: pointer !important; opacity: 0 !important;
        }
      `}} />

      <header className="modern-header">
        <div className="header-top">
          <div className="header-title">
            <h1>ค้นหา<span>ห้อง</span></h1>
          </div>
          <button className="btn-icon-circle" onClick={() => router.back()}>
             <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="inputs-grid">
          
          <div className="smart-input active" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="input-visual" style={{ pointerEvents: 'none' }}>
              <span className="material-symbols-outlined input-icon">calendar_month</span>
              <div className="input-labels">
                <span className="input-label-small">วันที่</span>
                <span className="input-value">{isMounted ? formatDateDisplay(date) : "กำลังโหลด..."}</span>
              </div>
            </div>
            {isMounted && (
              <input type="date" className="ultimate-hidden-input" value={date} onChange={(e) => setDate(e.target.value)} />
            )}
          </div>

          <div className="smart-input" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="input-visual" style={{ pointerEvents: 'none' }}>
              <span className="material-symbols-outlined input-icon">schedule</span>
              <div className="input-labels">
                <span className="input-label-small">เวลาเริ่ม</span>
                <span className="input-value">{isMounted ? startTime : "--:--"}</span>
              </div>
            </div>
            {isMounted && (
              <input type="time" className="ultimate-hidden-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            )}
          </div>

        </div>

        <div className="search-bar">
          <span className="material-symbols-outlined search-icon">search</span>
          <input 
            type="text" 
            placeholder="ค้นหาชื่อห้อง, ตึก..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters">
          <button className={`filter-chip ${filterAvailable ? 'active' : ''}`} onClick={() => setFilterAvailable(!filterAvailable)}>ว่างตอนนี้</button>
          <button className={`filter-chip ${filterProjector ? 'active' : ''}`} onClick={() => setFilterProjector(!filterProjector)}>มีโปรเจคเตอร์</button>
          <button className={`filter-chip ${filterPower ? 'active' : ''}`} onClick={() => setFilterPower(!filterPower)}>มีปลั๊กไฟ</button>
          <button className={`filter-chip ${filterLarge ? 'active' : ''}`} onClick={() => setFilterLarge(!filterLarge)}>40+ คน</button>
        </div>
      </header>

      <main className="content-area">
        <div className="section-header">
          <h3>ผลลัพธ์ ({filteredRooms.length})</h3>
        </div>

        {!isMounted || loading ? (
          <div style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}>กำลังโหลดข้อมูล...</div>
        ) : filteredRooms.length > 0 ? (
          
          /* 🌟 Wrapper จัด Grid สำหรับ Desktop */
          <div className="results-grid">
            
            {filteredRooms.map(room => {
               const isMaintenance = room.status === 'maintenance';
               const isTimeFree = checkIsRoomFree(room.id);
               const isAvailable = !isMaintenance && isTimeFree;

               return (
                <div key={room.id} className="modern-card">
                  
                  {/* โค้ดห้องที่ถูกเติมกลับมาครบถ้วน! */}
                  <div className="card-image" style={{backgroundImage: `url(${room.image_url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800'})`}}>
                    <div className="status-float">
                      <div className={`dot ${isAvailable ? 'green' : 'red'}`}></div>
                      <span>{isMaintenance ? 'ปิดปรับปรุง' : (isAvailable ? 'ว่าง' : 'ไม่ว่าง')}</span>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="card-title-row">
                      <div>
                        <div className="room-name">{room.name}</div>
                        <div className="room-detail">{room.building || "อาคารเรียนรวม"} • {room.capacity} ที่นั่ง</div>
                      </div>
                      <div style={{display:'flex', gap:'2px', color:'#FFB81C'}}>
                         <span className="material-symbols-outlined" style={{fontSize:18, fontVariationSettings:"'FILL' 1"}}>star</span>
                         <span style={{fontSize:14, fontWeight:700, color:'#1e293b'}}>4.8</span>
                      </div>
                    </div>

                    <div className="facilities">
                      {room.facilities && room.facilities.length > 0 ? (
                        room.facilities.map((fac: string) => (
                          <span 
                            key={fac} 
                            className="material-symbols-outlined fac-icon" 
                            title={fac} 
                          >
                            {getFacilityIcon(fac)}
                          </span>
                        ))
                      ) : (
                        <span className="room-detail" style={{ fontSize: '0.75rem' }}>ไม่มีข้อมูลสิ่งอำนวยความสะดวก</span>
                      )}
                    </div>

                    {isAvailable ? (
                      <button 
                        className="btn-action"
                        onClick={() => {
                          router.push(`/booking/${room.id}?date=${date}&startTime=${startTime}`);
                        }}
                      >
                        <span>จองห้องนี้</span>
                        <span className="material-symbols-outlined" style={{fontSize:18}}>arrow_forward</span>
                      </button>
                    ) : (
                      <button className="btn-action" disabled>
                        {isMaintenance ? 'อยู่ระหว่างปรับปรุง' : 'ไม่ว่างในช่วงเวลานี้'}
                      </button>
                    )}
                  </div>
                </div>
               );
            })}
            
          </div>

        ) : (
          <div style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}>
            <span className="material-symbols-outlined" style={{fontSize:48, marginBottom:8}}>search_off</span>
            <p>ไม่พบห้องตามเงื่อนไข</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="search-page" style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>กำลังโหลด...</div>}>
      <SearchContent />
    </Suspense>
  );
}