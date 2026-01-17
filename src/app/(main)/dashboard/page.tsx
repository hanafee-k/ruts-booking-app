"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import "./dashboard.css";

// Interface สำหรับข้อมูลการจอง
interface Booking {
  id: string;
  room_name: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  // --- Data States ---
  const [userData, setUserData] = useState({
    name: "กำลังโหลด...",
    studentId: "",
    department: "วิศวกรรมคอมพิวเตอร์",
    avatar: ""
  });

  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [nextClass, setNextClass] = useState<Booking | null>(null);

  // วันที่ปัจจุบันแบบไทย
  const today = new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. เช็ค Login
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // 2. ดึง Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserData({
            name: profile.full_name || "นักศึกษา",
            studentId: profile.student_id || "-",
            department: "วิศวกรรมคอมพิวเตอร์",
            avatar: profile.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"
          });
        }

        // 3. ดึงข้อมูลการจอง (Upcoming Bookings)
        // สมมติว่ามีตาราง 'bookings'
        const now = new Date().toISOString();
        const { data: bookingsData } = await supabase
          .from('bookings') // ⚠️ ต้องมีตารางนี้ใน Supabase
          .select('*')
          .eq('user_id', user.id)
          .gte('start_time', now) // เอาเฉพาะเวลาในอนาคต
          .neq('status', 'cancelled') // ไม่เอาที่ยกเลิก
          .order('start_time', { ascending: true })
          .limit(5);

        if (bookingsData && bookingsData.length > 0) {
          setUpcomingBookings(bookingsData as Booking[]);
          // สมมติว่าการจองที่ใกล้ที่สุดคือ Next Class/Agenda
          setNextClass(bookingsData[0] as Booking);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, supabase]);

  // --- Helper Functions ---

  // แปลงวันที่สำหรับกล่องวันที่ (เช่น 24 ต.ค.)
  const formatDateBox = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('th-TH', { month: 'short' });
    return { day, month };
  };

  // แปลงเวลา (เช่น 13:30 - 15:30)
  const formatTimeRange = (start: string, end: string) => {
    const s = new Date(start).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const e = new Date(end).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return `${s} - ${e}`;
  };

  // นำทาง
  const navigateTo = (path: string) => {
    router.push(path);
  };

  if (loading) {
    return <div className="dashboard-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '100px' }}>กำลังโหลด...</div>;
  }

  return (
    <div className="dashboard-page">

      {/* 1. Sticky Header */}
      <header className="dash-header">
        <div className="dash-header-left">
          <div className="brand-logo">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div className="brand-text">
            <h2>Academic RUTS</h2>
            <p>คณะวิศวกรรมศาสตร์</p>
          </div>
        </div>
        <button onClick={() => router.push('/notifications')}>
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      {/* 2. Profile Section */}
      <section className="profile-section">
        <div className="profile-avatar-wrapper">
          <div
            className="profile-avatar"
            style={{ backgroundImage: `url(${userData.avatar})` }}
          ></div>
          <div className="status-dot"></div>
        </div>
        <div className="profile-info">
          <p className="welcome-text">ยินดีต้อนรับ,</p>
          <h1 className="user-fullname">{userData.name}</h1>
          <span className="dept-badge">{userData.department}</span>
        </div>
      </section>

      {/* 3. Today's Agenda (ใช้ Booking ล่าสุดมาแสดงแทน Agenda) */}
      <div className="section-title-row">
        <h2 className="section-title">กำหนดการวันนี้</h2>
        <span className="date-label">{today}</span>
      </div>

      <section className="agenda-card">
        {nextClass ? (
          <>
            <div
              className="agenda-image"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')` }}
            >
              <span className="status-badge-ongoing">กำลังมาถึง</span>
            </div>

            <div className="agenda-content">
              <div>
                <p className="class-time">เวลา • {formatTimeRange(nextClass.start_time, nextClass.end_time)}</p>
                <h3 className="class-name">{nextClass.room_name}</h3>
                <div className="class-location">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>event_note</span>
                  <span>{nextClass.purpose || "ไม่มีรายละเอียด"}</span>
                </div>
              </div>

              <div className="agenda-footer">
                <div className="attendees">
                  <div className="attendee-avatar" style={{ backgroundImage: `url(${userData.avatar})`, backgroundSize: 'cover' }}></div>
                  <div className="attendee-avatar" style={{ backgroundColor: '#6b7280', color: 'white' }}>+</div>
                </div>
                <button className="view-btn" onClick={() => navigateTo('/history')}>ดูรายละเอียด</button>
              </div>
            </div>
          </>
        ) : (
          /* กรณีไม่มี Agenda */
          <div style={{ padding: '2rem', textAlign: 'center', color: '#ccc' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '10px' }}>event_busy</span>
            <p>ไม่มีรายการจองหรือเรียนเร็วๆ นี้</p>
            <button className="view-btn" style={{ marginTop: '10px' }} onClick={() => navigateTo('/booking')}>จองห้องเลย</button>
          </div>
        )}
      </section>

      {/* 4. Quick Actions (ทำงานได้จริง) */}
      <section style={{ padding: '0 1rem', marginTop: '1.5rem' }}>
        <h3 className="section-title" style={{ marginBottom: '1rem' }}>เมนูลัด</h3>
        <div className="quick-actions-grid">

          <div className="qa-item" onClick={() => navigateTo('/search')}>
            <button className="qa-btn">
              <span className="material-symbols-outlined filled" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
            </button>
            <span className="qa-label">จองห้อง</span>
          </div>

          <div className="qa-item" onClick={() => navigateTo('/schedule')}>
            <button className="qa-btn">
              <span className="material-symbols-outlined filled" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
            </button>
            <span className="qa-label">ตารางเรียน</span>
          </div>

          <div className="qa-item" onClick={() => navigateTo('/history')}>
            <button className="qa-btn">
              <span className="material-symbols-outlined filled" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
            </button>
            <span className="qa-label">ประวัติ</span>
          </div>

          <div
            className="qa-item"
            onClick={() => window.open("https://www.google.com/maps/search/?api=1&query=มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย+สงขลา", "_blank")}
            style={{ cursor: "pointer" }} // เพิ่ม cursor ให้รู้ว่ากดได้
          >
            <button className="qa-btn">
              <span className="material-symbols-outlined filled" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
            </button>
            <span className="qa-label">แผนที่</span>
          </div>

        </div>
      </section>

      {/* 5. Upcoming Bookings (เชื่อม DB) */}
      <section style={{ marginTop: '1.5rem' }}>
        <div className="section-title-row">
          <h3 className="section-title">การจองเร็วๆ นี้</h3>
          <button className="see-all-btn" onClick={() => navigateTo('/history')}>ดูทั้งหมด</button>
        </div>

        <div className="upcoming-list">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => {
              const { day, month } = formatDateBox(booking.start_time);
              return (
                <div className="booking-item" key={booking.id}>
                  <div className="date-box" style={booking.status === 'pending' ? { color: 'rgba(244, 209, 37, 0.8)' } : {}}>
                    <span className="date-num">{day}</span>
                    <span className="date-month">{month}</span>
                  </div>
                  <div className="booking-info">
                    <h4 className="booking-title">{booking.room_name}</h4>
                    <p className="booking-time">{formatTimeRange(booking.start_time, booking.end_time)} • {booking.purpose}</p>
                  </div>
                  <div className="booking-status">
                    {booking.status === 'confirmed' && <span className="status-tag confirmed">อนุมัติ</span>}
                    {booking.status === 'pending' && <span className="status-tag pending">รออนุมัติ</span>}
                    <span className="material-symbols-outlined" style={{ color: '#9ca3af' }}>chevron_right</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-results" style={{ padding: '1rem' }}>
              <p>ไม่มีรายการจองเร็วๆ นี้</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}