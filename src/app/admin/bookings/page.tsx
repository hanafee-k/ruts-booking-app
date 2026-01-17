"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import "../admin.css";

// Interface สำหรับข้อมูลการจอง
interface Booking {
  id: number;
  start_time: string;
  end_time: string;
  status: string;
  title: string;
  user_id: string;
  profiles: { full_name: string; student_id: string };
  rooms: { name: string; image_url?: string };
}

export default function AdminBookingsPage() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ เพิ่มตัวกรองสถานะ (Default ดู 'pending' ก่อน)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  // Fetch Data
  const fetchBookings = async () => {
    setLoading(true);
    let query = supabase
      .from('bookings')
      .select(`
        *,
        profiles ( full_name, student_id ),
        rooms ( name, image_url )
      `)
      .order('start_time', { ascending: false }); // เอาวันที่ล่าสุดขึ้นก่อน

    const { data } = await query;
    if (data) setBookings(data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // ⭐ ฟังก์ชันเปลี่ยนสถานะ (Update Logic)
  const updateStatus = async (bookingId: number, newStatus: 'approved' | 'rejected', userId: string, roomName: string) => {
    const actionName = newStatus === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ';
    if(!confirm(`ยืนยันการ "${actionName}" คำขอนี้?`)) return;

    try {
      console.log(`กำลังอัปเดต ID: ${bookingId} เป็น ${newStatus}`); // Debug Log 1

      // 1. อัปเดตสถานะ Booking
      const { data, error: updateError } = await supabase
        .from('bookings')
        .update({ status: newStatus }) // ส่งค่า status ใหม่ไป
        .eq('id', bookingId)
        .select(); // สำคัญ! ใส่ .select() เพื่อดูว่าข้อมูลถูกแก้จริงไหม

      if (updateError) {
        console.error("Update Error:", updateError); // Debug Log 2
        throw new Error(updateError.message);
      }

      if (!data || data.length === 0) {
        throw new Error("ไม่พบรายการจอง หรือไม่มีสิทธิ์แก้ไข (ติด RLS)");
      }

      console.log("Update Success:", data); // Debug Log 3

      // 2. 🔔 ส่ง Notification หา User
      const message = newStatus === 'approved' 
        ? `✅ การจองห้อง "${roomName}" ของคุณได้รับการอนุมัติแล้ว`
        : `❌ การจองห้อง "${roomName}" ของคุณถูกปฏิเสธ`;

      const { error: notifError } = await supabase.from('notifications').insert({
          user_id: userId,
          title: "ผลการจองห้อง",
          message: message,
          type: newStatus === 'approved' ? 'success' : 'error',
          is_read: false
      });

      if (notifError) console.error("Notification Error:", notifError);

      // 3. Refresh ข้อมูล (อัปเดต State Local ทันที เพื่อให้ UI เปลี่ยน)
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      
      alert(`ดำเนินการ${actionName}เรียบร้อย`);

    } catch (err: any) {
      console.error(err);
      alert("เกิดข้อผิดพลาด: " + err.message);
    }
  };

  // Helper Formatter
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  
  const formatTime = (start: string, end: string) => {
    const s = new Date(start).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'});
    const e = new Date(end).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'});
    return `${s} - ${e}`;
  };

  // กรองข้อมูลตาม Tab ที่เลือก
  const filteredBookings = filter === 'pending' 
    ? bookings.filter(b => b.status === 'pending')
    : bookings;

  return (
    <div style={{paddingBottom: 100}}>
      <div className="page-header">
        <div>
            <h1>รายการจอง</h1>
            <span style={{fontSize:'0.85rem', color:'var(--text-sub)'}}>จัดการคำขอจองห้อง</span>
        </div>
        <button className="btn-action" onClick={fetchBookings} style={{width:'auto', padding:'8px', background:'white', border:'1px solid #e2e8f0'}}>
           <span className="material-symbols-outlined" style={{fontSize:20}}>refresh</span>
        </button>
      </div>

      {/* 🟢 TABS (ตัวเลือก: รออนุมัติ / ทั้งหมด) */}
      <div className="filter-tabs">
        <button 
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
        >
            รออนุมัติ ({bookings.filter(b => b.status === 'pending').length})
        </button>
        <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
        >
            ประวัติทั้งหมด
        </button>
      </div>

      {/* 📝 Booking List Cards */}
      <div className="booking-list-container">
        {loading ? (
             [...Array(3)].map((_, i) => <div key={i} className="booking-card-skeleton"></div>)
        ) : filteredBookings.length > 0 ? (
          filteredBookings.map((b) => (
            <div key={b.id} className="booking-card">
              
              {/* Header: วันที่ & สถานะ */}
              <div className="booking-card-header">
                  <div className="booking-date">
                     <span className="material-symbols-outlined icon">calendar_month</span>
                     {formatDate(b.start_time)}
                  </div>
                  <span className={`status-badge ${b.status}`}>
                     {b.status === 'pending' ? 'รออนุมัติ' : b.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}
                  </span>
              </div>

              {/* Content: รายละเอียด */}
              <div className="booking-card-body">
                  <h3 className="room-name">{b.rooms?.name || "ไม่ระบุห้อง"}</h3>
                  
                  <div className="booking-info-row">
                      <span className="material-symbols-outlined">schedule</span>
                      <span>{formatTime(b.start_time, b.end_time)}</span>
                  </div>

                  <div className="booking-info-row">
                      <span className="material-symbols-outlined">person</span>
                      <span>{b.profiles?.full_name || "Unknown"} <span style={{opacity:0.6}}>({b.profiles?.student_id})</span></span>
                  </div>

                  <div className="booking-info-row title">
                      <span className="material-symbols-outlined">description</span>
                      <span>{b.title}</span>
                  </div>
              </div>

              {/* Actions: ปุ่มกด (เฉพาะสถานะ pending) */}
              {b.status === 'pending' && (
                  <div className="booking-card-actions">
                      <button 
                        className="btn-action-card approve"
                        onClick={() => updateStatus(b.id, 'approved', b.user_id, b.rooms?.name)}
                      >
                          <span className="material-symbols-outlined">check_circle</span> อนุมัติ
                      </button>
                      <button 
                        className="btn-action-card reject"
                        onClick={() => updateStatus(b.id, 'rejected', b.user_id, b.rooms?.name)}
                      >
                          <span className="material-symbols-outlined">cancel</span> ปฏิเสธ
                      </button>
                  </div>
              )}

            </div>
          ))
        ) : (
          <div className="empty-state">
             <span className="material-symbols-outlined">event_busy</span>
             <p>{filter === 'pending' ? 'ไม่มีรายการรออนุมัติ' : 'ไม่มีประวัติการจอง'}</p>
          </div>
        )}
      </div>
    </div>
  );
}