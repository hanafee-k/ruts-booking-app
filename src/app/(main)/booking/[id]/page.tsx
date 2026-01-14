"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface BookingFormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  participants: number;
  additionalNotes: string;
  needProjector: boolean;
}

export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const roomId = params?.id;
  const prefillTime = searchParams.get('time');

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<BookingFormData>({
    title: "",
    date: new Date().toISOString().split('T')[0],
    startTime: prefillTime || "09:00",
    endTime: prefillTime ? `${parseInt(prefillTime.split(':')[0]) + 2}:00`.padStart(5, '0') : "11:00",
    participants: 4,
    additionalNotes: "",
    needProjector: true,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      if (!roomId) return;
      const { data } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      if (data) setRoom(data);
      setLoading(false);
    };
    fetchRoom();
  }, [roomId, supabase]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.title.trim()) newErrors.title = "กรุณากรอกหัวข้อการจอง";
    if (formData.participants < 1) newErrors.participants = "ต้องมีผู้เข้าร่วมอย่างน้อย 1 คน";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkConflict = async () => {
    const newStart = new Date(`${formData.date}T${formData.startTime}`);
    const newEnd = new Date(`${formData.date}T${formData.endTime}`);

    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('room_id', roomId)
      .neq('status', 'cancelled')
      .gte('start_time', `${formData.date}T00:00:00`)
      .lte('end_time', `${formData.date}T23:59:59`);

    if (!existingBookings) return false;

    const hasConflict = existingBookings.some((booking) => {
      const bookedStart = new Date(booking.start_time);
      const bookedEnd = new Date(booking.end_time);
      return newStart < bookedEnd && newEnd > bookedStart;
    });

    return hasConflict;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("กรุณาเข้าสู่ระบบ");
        router.push("/login");
        return;
      }

      const isConflict = await checkConflict();
      if (isConflict) {
        alert("❌ ไม่สามารถจองได้! มีคนจองช่วงเวลานี้ไปแล้วครับ");
        setIsSubmitting(false);
        return;
      }

      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

      if (endDateTime <= startDateTime) {
        alert("เวลาสิ้นสุดต้องหลังจากเวลาเริ่ม");
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from('bookings').insert({
        user_id: user.id,
        room_id: roomId,
        title: formData.title,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        note: formData.additionalNotes + (formData.needProjector ? " (ต้องการโปรเจคเตอร์)" : ""),
        status: 'pending'
      });

      if (error) throw error;
      alert("✅ จองสำเร็จ! กรุณารอผลการอนุมัติ");
      router.push("/dashboard");

    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateParticipants = (delta: number) => {
    setFormData((prev) => ({ ...prev, participants: Math.max(1, prev.participants + delta) }));
  };

  const calculateDuration = (): number => {
    if (!formData.startTime || !formData.endTime) return 0;
    const start = parseInt(formData.startTime.split(":")[0]);
    const end = parseInt(formData.endTime.split(":")[0]);
    return Math.max(0, end - start);
  };

  if (loading) return <div style={{padding:'20px', textAlign:'center'}}>กำลังโหลดข้อมูล...</div>;
  if (!room) return <div style={{padding:'20px', textAlign:'center'}}>ไม่พบห้องพัก</div>;

  return (
    <div className="booking-page">
      <div className="booking-header">
        <button className="btn-back" onClick={() => router.back()}><span className="material-symbols-outlined">arrow_back_ios_new</span></button>
        <h2 className="booking-title">รายละเอียดการจอง</h2>
      </div>

      <div className="booking-content">
        <div className="room-card">
          <div className="room-image">
            <div className="room-image-overlay"></div>
            <div style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', backgroundImage: `url(${room.image_url || '/images/room-placeholder.jpg'})`, backgroundSize: 'cover', zIndex: 0}} />
            <span className="room-status">ว่าง</span>
          </div>
          <div className="room-info" style={{zIndex: 1, position:'relative'}}>
            <div className="room-header">
              <div><h3 className="room-name">{room.name}</h3><p className="room-location"><span className="material-symbols-outlined">location_on</span> {room.building || "อาคารเรียนรวม"}</p></div>
              <div className="room-capacity"><div className="avatar"><span className="material-symbols-outlined">person</span></div><div className="avatar-count">{room.capacity}</div></div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header"><div className="section-indicator"></div><h3>ข้อมูลการจอง</h3></div>
          <div className="form-fields">
            <label className="form-field">
              <p className="form-label">หัวข้อการจอง <span className="required">*</span></p>
              <div className="input-wrapper">
                <input type="text" className={`form-input ${errors.title ? "error" : ""}`} placeholder="เช่น ติวหนังสือ" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                <span className="input-icon"><span className="material-symbols-outlined">edit</span></span>
              </div>
            </label>

            <div className="form-row">
              <label className="form-field">
                <p className="form-label">วันที่ <span className="required">*</span></p>
                <input type="date" className="form-input" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </label>
              <div style={{display:'flex', gap:'10px', flex:1}}>
                <label className="form-field" style={{flex:1}}>
                    <p className="form-label">เริ่ม</p>
                    <input type="time" className="form-input" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                </label>
                <label className="form-field" style={{flex:1}}>
                    <p className="form-label">ถึง</p>
                    <input type="time" className="form-input" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
                </label>
              </div>
            </div>

            <label className="form-field">
              <p className="form-label">จำนวนผู้เข้าร่วม</p>
              <div className="counter-wrapper">
                <button className="counter-btn" onClick={() => updateParticipants(-1)} disabled={formData.participants <= 1}><span className="material-symbols-outlined">remove</span></button>
                <span className="counter-value">{formData.participants}</span>
                <button className="counter-btn" onClick={() => updateParticipants(1)} disabled={room && formData.participants >= room.capacity}><span className="material-symbols-outlined">add</span></button>
              </div>
            </label>

            <label className="form-field">
              <p className="form-label">รายละเอียดเพิ่มเติม</p>
              <textarea className="form-textarea" rows={3} placeholder="ระบุอุปกรณ์เพิ่มเติม..." value={formData.additionalNotes} onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })} />
            </label>

            <div className="toggle-field">
              <div className="toggle-info"><span className="toggle-title">ต้องการโปรเจคเตอร์</span><span className="toggle-subtitle">พร้อมสาย HDMI</span></div>
              <label className="toggle-switch">
                <input type="checkbox" checked={formData.needProjector} onChange={(e) => setFormData({ ...formData, needProjector: e.target.checked })} />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="booking-footer">
        <div className="booking-summary"><span className="summary-label">ระยะเวลาจอง</span><span className="summary-value">{calculateDuration()} ชม.</span></div>
        <button className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
          <span>{isSubmitting ? "กำลังตรวจสอบ..." : "ยืนยันการจอง"}</span>
          {!isSubmitting && <span className="material-symbols-outlined">arrow_forward</span>}
        </button>
      </div>
    </div>
  );
}