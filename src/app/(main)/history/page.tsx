"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/layout/BottomNav";
import "./history.css";

// Interface
interface Booking {
  id: number;
  start_time: string;
  end_time: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  title: string;
  room: {
    name: string;
    building: string;
  };
}

// Helpers
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('th-TH', { 
    day: 'numeric', month: 'short', year: '2-digit' 
  });
};

const formatTimeRange = (start: string, end: string) => {
  const s = new Date(start).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const e = new Date(end).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  return `${s} - ${e}`;
};

export default function HistoryPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Data
  const fetchHistory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from('bookings')
        .select(`id, start_time, end_time, status, title, rooms ( name, building )`)
        .eq('user_id', user.id)
        .order('start_time', { ascending: false }); // ใหม่สุดขึ้นก่อน

      if (data) {
        // Map data structure
        const formatted: Booking[] = data.map((b: any) => ({
          ...b,
          room: b.rooms
        }));
        setBookings(formatted);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [supabase]);

  // Handle Cancel Booking
  const handleCancel = async (bookingId: number) => {
    if (!confirm("คุณต้องการยกเลิกการจองนี้ใช่หรือไม่?")) return;

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (!error) {
      fetchHistory(); // Refresh data
    } else {
      alert("เกิดข้อผิดพลาดในการยกเลิก");
    }
  };

  // Filter Logic
  const now = new Date();
  const filteredBookings = bookings.filter(b => {
    const startTime = new Date(b.start_time);
    const isFuture = startTime >= now;
    const isCancelledOrRejected = b.status === 'cancelled' || b.status === 'rejected';

    if (activeTab === 'upcoming') {
      // โชว์อนาคต และต้องไม่ถูกยกเลิก/ปฏิเสธ
      return isFuture && !isCancelledOrRejected;
    } else {
      // โชว์อดีต หรือ รายการที่ถูกยกเลิก/ปฏิเสธทั้งหมด
      return !isFuture || isCancelledOrRejected;
    }
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'รออนุมัติ';
      case 'approved': return 'อนุมัติแล้ว';
      case 'rejected': return 'ไม่ผ่าน';
      case 'cancelled': return 'ยกเลิกแล้ว';
      default: return status;
    }
  };

  return (
    <div className="history-page">
      
      {/* Header */}
      <header className="history-header">
        <div className="history-title">
          <h1>ประวัติ<span>การจอง</span></h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="history-tabs">
        <div className="tab-group">
          <button 
            className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            เร็วๆ นี้ ({bookings.filter(b => new Date(b.start_time) >= new Date() && b.status !== 'cancelled' && b.status !== 'rejected').length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            ประวัติย้อนหลัง
          </button>
        </div>
      </div>

      {/* List Area */}
      <main className="history-list">
        {loading ? (
          <div style={{textAlign:'center', color:'#94a3b8', padding:'40px'}}>กำลังโหลดข้อมูล...</div>
        ) : filteredBookings.length > 0 ? (
          filteredBookings.map((item) => (
            <div key={item.id} className="history-card">
              
              <div className="card-top">
                <div className="room-info">
                  <h3>{item.room?.name || "ไม่ระบุห้อง"}</h3>
                  <p>{item.room?.building || "-"}</p>
                </div>
                <span className={`status-badge ${item.status}`}>
                  {getStatusLabel(item.status)}
                </span>
              </div>

              <div className="card-divider"></div>

              <div className="card-details">
                <div className="detail-row">
                  <div className="icon-box"><span className="material-symbols-outlined">event</span></div>
                  <span>{formatDate(item.start_time)}</span>
                </div>
                <div className="detail-row">
                  <div className="icon-box"><span className="material-symbols-outlined">schedule</span></div>
                  <span>{formatTimeRange(item.start_time, item.end_time)}</span>
                </div>
                {item.title && (
                  <div className="detail-row">
                    <div className="icon-box"><span className="material-symbols-outlined">description</span></div>
                    <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                      {item.title}
                    </span>
                  </div>
                )}
              </div>

              {/* ปุ่มยกเลิก (เฉพาะ Tab Upcoming และสถานะ Pending) */}
              {activeTab === 'upcoming' && item.status === 'pending' && (
                <button 
                  className="btn-cancel"
                  onClick={() => handleCancel(item.id)}
                >
                  ยกเลิกการจอง
                </button>
              )}

            </div>
          ))
        ) : (
          <div className="empty-state">
            <span className="material-symbols-outlined empty-icon">history_toggle_off</span>
            <p>ไม่พบรายการ{activeTab === 'upcoming' ? 'จองเร็วๆ นี้' : 'ประวัติย้อนหลัง'}</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}