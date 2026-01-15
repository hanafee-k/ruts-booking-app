"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import "./booking.css";

// Interface สำหรับข้อมูลห้อง
interface Room {
  id: number;
  name: string;
  building: string;
  image_url: string;
  capacity: number;
}

// Interface สำหรับข้อมูล User
interface UserProfile {
  full_name: string;
  student_id: string;
}

export default function BookingConfirmPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // รับค่าจาก URL
  const roomId = params?.id as string;
  const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const startTime = searchParams.get('startTime') || "09:00";
  
  // --- 🕒 Logic เวลาทำการ (Business Hours) ---
  const BUSINESS_OPEN = 8;  // 08:00
  const BUSINESS_CLOSE = 17; // 17:00

  const startHour = parseInt(startTime.split(':')[0]);
  const startMinute = startTime.split(':')[1] || "00";

  // เช็คว่าเวลาเริ่ม อยู่ในเวลาทำการไหม? (08:00 - 16:59)
  const isOutOfHours = startHour < BUSINESS_OPEN || startHour >= BUSINESS_CLOSE;
  
  // คำนวณว่าจองได้สูงสุดกี่ชั่วโมง (ไม่เกิน 17:00)
  // เช่น เริ่ม 09:00 -> เหลือ 8 ชม. (ถึง 17:00)
  // เช่น เริ่ม 16:00 -> เหลือ 1 ชม.
  const maxDurationPossible = Math.max(0, BUSINESS_CLOSE - startHour);

  // --- States ---
  const [room, setRoom] = useState<Room | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [duration, setDuration] = useState(Math.min(2, maxDurationPossible)); // Default 2 ชม. หรือตามที่เหลือ
  const [purpose, setPurpose] = useState("");
  const [attendees, setAttendees] = useState("");
  const [advisor, setAdvisor] = useState("");
  const [note, setNote] = useState("");
  const [isAgreed, setIsAgreed] = useState(true);

  // คำนวณเวลาเลิก (EndTime) ตาม Duration ที่เลือก
  const endHour = startHour + duration; 
  const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute}`;

  // --- Fetch Data ---
  useEffect(() => {
    // ถ้าเวลาเริ่มไม่อยู่ในเกณฑ์ ให้ปรับ Duration เป็น 0 หรือค่าที่ถูกต้อง
    if (isOutOfHours) setDuration(0);
    else if (duration === 0 && maxDurationPossible > 0) setDuration(1);
  }, [isOutOfHours, maxDurationPossible]);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) setUserProfile(profile);

      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      
      if (roomData) {
        setRoom(roomData);
      } else {
        setRoom({
          id: parseInt(roomId),
          name: "ห้องปฏิบัติการคอมพิวเตอร์ 402",
          building: "อาคาร 4 คณะวิศวกรรมศาสตร์",
          capacity: 45,
          image_url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800"
        });
      }

      setLoading(false);
    };
    initData();
  }, [roomId, supabase, router]);

  const formatDisplayDate = (d: string) => {
    return new Date(d).toLocaleDateString('th-TH', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    });
  };

  const handleSubmit = async () => {
    if (isOutOfHours || duration <= 0) {
      alert("ไม่สามารถจองนอกเวลาทำการได้ (08:00 - 17:00 น.)");
      return;
    }
    if (!purpose || !attendees) {
      alert("กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // ✅ แก้ตรงนี้: แปลงเวลา Local (ไทย) -> UTC ก่อนบันทึก
      // สร้าง Date Object จากวันที่และเวลาที่เลือก
      const startDateTimeLocal = new Date(`${dateStr}T${startTime}:00`);
      const endDateTimeLocal = new Date(`${dateStr}T${endTime}:00`);

      // .toISOString() จะแปลงเป็น UTC ให้อัตโนมัติ (เช่น 09:00 ไทย -> 02:00Z)
      const startISO = startDateTimeLocal.toISOString();
      const endISO = endDateTimeLocal.toISOString();

      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          room_id: parseInt(roomId),
          start_time: startISO, // ส่งค่า UTC
          end_time: endISO,     // ส่งค่า UTC
          title: purpose,
          purpose: purpose,
          status: 'pending',
          attendees_count: parseInt(attendees) || 0,
          advisor: advisor,
          note: note
        });

      if (error) throw error;

      alert("จองห้องสำเร็จ! กรุณารอการอนุมัติ");
      router.push('/schedule'); // แนะนำให้ไปหน้าตารางเรียนเพื่อดูผลลัพธ์

    } catch (err: any) {
      console.error(err);
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{padding:'40px', textAlign:'center'}}>กำลังโหลดข้อมูล...</div>;

  return (
    <div className="booking-confirm-page">
      
      {/* Header */}
      <header className="confirm-header">
        <button className="btn-back-header" onClick={() => router.back()}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="header-title">ยืนยันการจอง</h2>
        <div style={{width: 40}}></div>
      </header>

      <main className="confirm-content">
        
        {/* Warning Badge ถ้านอกเวลา */}
        {isOutOfHours && (
          <div style={{background:'#fef2f2', color:'#dc2626', padding:'12px', borderRadius:'8px', fontSize:'0.9rem', border:'1px solid #fecaca'}}>
            ⚠️ <b>อยู่นอกเวลาทำการ</b> (08:00 - 17:00 น.)<br/>กรุณาเลือกเวลาใหม่ในหน้าค้นหา
          </div>
        )}

        {/* Room Summary */}
        <section className="room-summary-card">
          <div className="card-top-accent"></div>
          <div className="room-card-header">
            <div>
              <span className="badge-label">ห้องที่เลือก</span>
              <h3 className="room-name-large">{room?.name}</h3>
              <p className="room-loc">{room?.building}</p>
            </div>
          </div>
          <div className="room-hero-img" style={{backgroundImage: `url(${room?.image_url})`}}>
            <div className="img-overlay"></div>
            <div className="pc-count">
              <span className="material-symbols-outlined" style={{fontSize:16}}>desktop_windows</span>
              {room?.capacity} เครื่อง
            </div>
          </div>
        </section>

        {/* Info Section (ปรับแก้ให้เลือก Duration ได้) */}
        <section className="info-section">
          <h3 className="section-head">
            <span className="material-symbols-outlined" style={{color:'var(--b-secondary)'}}>calendar_month</span>
            ข้อมูลวันและเวลา
          </h3>
          <div className="info-grid">
            <div className="info-col border-r">
              <span className="info-label">วันที่</span>
              <span className="info-val">{formatDisplayDate(dateStr)}</span>
            </div>
            <div className="info-col">
              <span className="info-label">เวลา ({duration} ชม.)</span>
              <span className="info-val" style={{color: isOutOfHours ? 'red' : 'inherit'}}>
                {startTime} - {isOutOfHours ? '??:??' : endTime}
              </span>
            </div>
            
            <div className="info-footer">
              <div className="info-col">
                <span className="info-label">ระยะเวลา (ชั่วโมง)</span>
                {/* ⭐ ตัวเลือกจำนวนชั่วโมง */}
                <select 
                  className="form-select" 
                  style={{padding:'4px 8px', width:'auto', minWidth:'100px'}}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  disabled={isOutOfHours}
                >
                  {isOutOfHours ? (
                    <option value="0">นอกเวลาทำการ</option>
                  ) : (
                    Array.from({length: maxDurationPossible}, (_, i) => i + 1).map(h => (
                      <option key={h} value={h}>{h} ชั่วโมง</option>
                    ))
                  )}
                </select>
              </div>
              <div className="info-col" style={{alignItems:'flex-end'}}>
                 <span className="info-label">สิ้นสุด</span>
                 <span className="info-val" style={{color:'var(--b-secondary)'}}>{isOutOfHours ? '-' : endTime}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Form Details */}
        <section>
          <div className="section-head" style={{marginBottom:'12px'}}>
            <span className="material-symbols-outlined">edit_document</span>
            รายละเอียดเพิ่มเติม
          </div>
          
          <div className="form-card">
            <div className="form-group">
              <label>วัตถุประสงค์ <span className="req">*</span></label>
              <select className="form-select" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                <option value="" disabled>เลือกวัตถุประสงค์</option>
                <option value="study">การเรียนการสอน (Class)</option>
                <option value="group">ติวหนังสือ / ทำงานกลุ่ม</option>
                <option value="club">กิจกรรมชมรม</option>
                <option value="other">อื่นๆ</option>
              </select>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
              <div className="form-group">
                <label>จำนวนคน <span className="req">*</span></label>
                <input type="number" className="form-input" placeholder="0" value={attendees} onChange={(e) => setAttendees(e.target.value)} />
              </div>
              <div className="form-group">
                <label>รหัสนักศึกษา</label>
                <input type="text" className="form-input" value={userProfile?.student_id || "-"} readOnly />
              </div>
            </div>

            <div className="form-group">
              <label>อาจารย์ที่ปรึกษา</label>
              <input type="text" className="form-input" placeholder="ระบุชื่ออาจารย์" value={advisor} onChange={(e) => setAdvisor(e.target.value)} />
            </div>

            <div className="form-group">
              <label>หมายเหตุ</label>
              <textarea className="form-textarea" rows={3} placeholder="..." value={note} onChange={(e) => setNote(e.target.value)}></textarea>
            </div>
          </div>
        </section>

        <section className="checkbox-group">
          <input type="checkbox" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} />
          <span className="checkbox-text">ข้าพเจ้ายอมรับระเบียบการใช้ห้องปฏิบัติการ</span>
        </section>

      </main>

      {/* Footer */}
      <footer className="confirm-footer">
        <div className="progress-row">
          <span style={{color:'var(--b-slate-500)'}}>ขั้นตอน 3 จาก 3</span>
          <span style={{fontWeight:700, color:'var(--b-primary)'}}>ยืนยันข้อมูล</span>
        </div>
        <div className="progress-bar"><div className="progress-fill"></div></div>
        
        <button 
          className="btn-confirm-final" 
          disabled={submitting || !isAgreed || isOutOfHours}
          style={{opacity: (submitting || !isAgreed || isOutOfHours) ? 0.5 : 1}}
          onClick={handleSubmit}
        >
          {isOutOfHours ? "อยู่นอกเวลาทำการ" : (submitting ? "กำลังบันทึก..." : "ยืนยันการจอง")}
        </button>
      </footer>
    </div>
  );
}