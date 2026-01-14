"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/layout/BottomNav";

export default function SearchPage() {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  
  // รับค่าเริ่มต้นจาก URL (กรณีมาจากหน้า Schedule)
  const autoTime = searchParams.get('autoTime');

  // State ข้อมูล
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]); // เก็บการจองของวันที่เลือก
  const [loading, setLoading] = useState(true);

  // State การค้นหา
  const [searchTerm, setSearchTerm] = useState("");
  
  // State วันและเวลา (ค่าเริ่มต้น: วันนี้, เวลาปัจจุบัน หรือ autoTime)
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchStart, setSearchStart] = useState(autoTime || "09:00");
  const [searchEnd, setSearchEnd] = useState(autoTime ? 
    `${parseInt(autoTime.split(':')[0]) + 2}:00`.padStart(5, '0') : "11:00");

  // Filter States
  const [filterAvailable, setFilterAvailable] = useState(false); // เปลี่ยนความหมายเป็น "ว่างในช่วงเวลานี้"
  const [filterPower, setFilterPower] = useState(false);
  const [filterProjector, setFilterProjector] = useState(false);
  const [filterLarge, setFilterLarge] = useState(false);

  // 1. ดึงข้อมูลห้อง (Rooms)
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      const { data } = await supabase.from('rooms').select('*').order('name', { ascending: true });
      if (data) setRooms(data);
      setLoading(false);
    };
    fetchRooms();
  }, [supabase]);

  // 2. ดึงข้อมูลการจอง (Bookings) เมื่อวันที่เปลี่ยน
  useEffect(() => {
    const fetchBookings = async () => {
      // ดึง Booking ทั้งหมดของวันที่เลือก (เพื่อเอามาเช็ค Conflict)
      const { data } = await supabase
        .from('bookings')
        .select('room_id, start_time, end_time')
        .neq('status', 'cancelled')
        .gte('start_time', `${searchDate}T00:00:00`)
        .lte('end_time', `${searchDate}T23:59:59`);

      if (data) setBookings(data);
    };
    fetchBookings();
  }, [searchDate, supabase]); // รันใหม่เมื่อเปลี่ยนวัน

  // 3. ฟังก์ชันเช็คว่าห้องว่างไหม ในช่วงเวลาที่เลือก
  const checkRoomAvailability = (roomId: number) => {
     const newStart = new Date(`${searchDate}T${searchStart}`);
     const newEnd = new Date(`${searchDate}T${searchEnd}`);

     // กรองเฉพาะ Booking ของห้องนี้
     const roomBookings = bookings.filter(b => b.room_id === roomId);

     // เช็คว่าเวลาชนกันไหม
     const hasConflict = roomBookings.some(booking => {
        const bookedStart = new Date(booking.start_time);
        const bookedEnd = new Date(booking.end_time);
        // สูตรเช็คชน: (StartA < EndB) && (EndA > StartB)
        return newStart < bookedEnd && newEnd > bookedStart;
     });

     return !hasConflict; // ถ้าไม่ชน = ว่าง (True)
  };

  // 4. Logic การกรองห้องและแสดงผล
  const filteredRooms = rooms.filter(room => {
    // กรองชื่อ
    const matchName = room.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      room.building?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // สถานะพื้นฐานจาก DB (เช่น ปิดปรับปรุง)
    const isMaintenance = room.status === 'maintenance';
    
    // สถานะจากการคำนวณเวลา (Dynamic Status)
    const isTimeSlotAvailable = checkRoomAvailability(room.id);
    
    // สรุปสถานะสุดท้าย: ต้องไม่ปิดปรับปรุง และ เวลาต้องว่าง
    const isAvailable = !isMaintenance && isTimeSlotAvailable;

    // Filter Chips logic
    const matchAvailable = filterAvailable ? isAvailable : true;
    const matchPower = filterPower ? room.facilities?.includes('power') : true;
    const matchProjector = filterProjector ? room.facilities?.includes('projector') : true;
    const matchLarge = filterLarge ? room.capacity >= 40 : true;

    return matchName && matchAvailable && matchPower && matchProjector && matchLarge;
  });

  return (
    <div className="search-page">
      
      <header className="sticky-header">
        <div className="top-nav">
          <button onClick={() => router.back()} className="btn-icon">
             <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h2>ค้นหาห้องเรียน</h2>
          <button className="btn-icon-circle">
             <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>

        {/* --- ส่วนเลือกวันและเวลา (เพิ่มใหม่) --- */}
        <div className="datetime-selector">
            <div className="date-input-wrapper">
                <span className="material-symbols-outlined icon-xs">calendar_today</span>
                <input 
                    type="date" 
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                />
            </div>
            <div className="time-row">
                <div className="time-input-wrapper">
                    <span className="material-symbols-outlined icon-xs">schedule</span>
                    <input 
                        type="time" 
                        value={searchStart}
                        onChange={(e) => setSearchStart(e.target.value)}
                    />
                </div>
                <span className="time-separator">-</span>
                <div className="time-input-wrapper">
                    <input 
                        type="time" 
                        value={searchEnd}
                        onChange={(e) => setSearchEnd(e.target.value)}
                    />
                </div>
            </div>
        </div>

        {/* Search Input */}
        <div className="search-bar-container">
          <div className="search-input-wrapper">
             <input type="text" placeholder="พิมพ์ชื่อห้อง..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-chips">
          <button className={`chip ${filterAvailable ? 'chip-primary' : 'chip-outline'}`} onClick={() => setFilterAvailable(!filterAvailable)}>
             {filterAvailable && <span className="material-symbols-outlined icon-sm">check</span>} ว่างช่วงนี้
          </button>
          <button className={`chip ${filterProjector ? 'chip-primary' : 'chip-outline'}`} onClick={() => setFilterProjector(!filterProjector)}>
             มีโปรเจคเตอร์
          </button>
          <button className={`chip ${filterPower ? 'chip-primary' : 'chip-outline'}`} onClick={() => setFilterPower(!filterPower)}>
             มีปลั๊กไฟ
          </button>
           <button className={`chip ${filterLarge ? 'chip-primary' : 'chip-outline'}`} onClick={() => setFilterLarge(!filterLarge)}>
             40+ คน
          </button>
        </div>
      </header>

      <main className="search-content">
        <div className="results-header">
           <h3>ผลลัพธ์การค้นหา</h3>
           <span className="results-count">พบ {filteredRooms.length} ห้อง</span>
        </div>

        <div className="room-list">
           {loading ? <p className="text-center text-slate-400 mt-10">กำลังโหลด...</p> : filteredRooms.length > 0 ? (
             filteredRooms.map((room) => {
                
                // คำนวณสถานะเพื่อแสดงผลในการ์ด
                const isMaintenance = room.status === 'maintenance';
                const isTimeAvailable = checkRoomAvailability(room.id);
                const isAvailable = !isMaintenance && isTimeAvailable;

                return (
                  <div key={room.id} className={`room-card ${!isAvailable ? 'occupied' : ''}`}>
                     
                     <div className="room-image" style={{ backgroundImage: `url(${room.image_url || '/images/room-placeholder.jpg'})` }}>
                        {isMaintenance ? (
                             <span className="status-badge occupied" style={{background:'orange'}}>ปิดปรับปรุง</span>
                        ) : isAvailable ? (
                             <span className="status-badge available">ว่าง (Available)</span>
                        ) : (
                             <span className="status-badge occupied">ไม่ว่าง (In Use)</span>
                        )}
                     </div>

                     <div className="room-details">
                        <div className="room-header-row">
                           <div>
                              <p className="room-dept">วิศวกรรมคอมพิวเตอร์</p>
                              <h4>{room.name}</h4>
                           </div>
                           <div className="rating"><span className="material-symbols-outlined star-icon">star</span><span>4.8</span></div>
                        </div>
                        <p className="room-location">{room.building || "อาคารเรียนรวม"} • ความจุ {room.capacity} คน</p>
                        
                        <div className="facilities-row">
                           {room.facilities?.includes('projector') && <div className="facility-item"><span className="material-symbols-outlined">videocam</span> Projector</div>}
                           {room.facilities?.includes('power') && <div className="facility-item"><span className="material-symbols-outlined">power</span> Power</div>}
                           <div className="facility-item"><span className="material-symbols-outlined">wifi</span> High Speed</div>
                        </div>

                        {/* ปุ่มจอง: ส่งวัน/เวลา ไปด้วย */}
                        {isAvailable ? (
                           <button 
                              className="btn-book"
                              onClick={() => router.push(`/booking/${room.id}?date=${searchDate}&time=${searchStart}`)}
                           >
                              จองห้องเรียน
                           </button>
                        ) : (
                           <button className="btn-occupied" disabled>
                               {isMaintenance ? 'ปิดปรับปรุง' : 'ไม่ว่างในช่วงเวลานี้'}
                           </button>
                        )}
                     </div>
                  </div>
                );
             })
           ) : (
             <div className="no-results"><span className="material-symbols-outlined">search_off</span><p>ไม่พบห้องที่คุณค้นหา</p></div>
           )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}