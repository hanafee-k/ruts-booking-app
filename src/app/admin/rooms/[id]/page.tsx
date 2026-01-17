"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import "../../admin.css";

export default function EditRoomPage() {
  const router = useRouter();
  const params = useParams(); // รับ id จาก URL
  const roomId = params?.id;
  
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    building: "",
    capacity: 0,
    image_url: "",
    status: "active",
    facilities: [] as string[]
  });

  const facilityOptions = [
    { id: 'wifi', label: 'Wi-Fi' },
    { id: 'projector', label: 'โปรเจคเตอร์' },
    { id: 'whiteboard', label: 'กระดานไวท์บอร์ด' },
    { id: 'computer', label: 'คอมพิวเตอร์' },
    { id: 'aircon', label: 'เครื่องปรับอากาศ' },
    { id: 'power', label: 'ปลั๊กไฟ' }
  ];

  // 1. ดึงข้อมูลเดิมมาแสดง
  useEffect(() => {
    const fetchRoom = async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) {
        alert("ไม่พบข้อมูลห้อง");
        router.push('/admin/rooms');
      } else if (data) {
        setFormData({
          name: data.name || "",
          building: data.building || "",
          capacity: data.capacity || 0,
          image_url: data.image_url || "",
          status: data.status || "active", // ✅ แก้ตรงนี้: ใส่ || "active" กันไว้
          facilities: data.facilities || []
        });
      }
      setLoading(false);
    };

    if (roomId) fetchRoom();
  }, [roomId, supabase, router]);

  // Handle Checkbox
  const handleToggleFacility = (id: string) => {
    setFormData(prev => {
      const exists = prev.facilities.includes(id);
      if (exists) return { ...prev, facilities: prev.facilities.filter(f => f !== id) };
      return { ...prev, facilities: [...prev.facilities, id] };
    });
  };

  // 2. บันทึกการแก้ไข (Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('rooms')
        .update(formData) // ใช้คำสั่ง update แทน insert
        .eq('id', roomId); // ระบุ ID ที่จะแก้
      
      if (error) throw error;
      
      alert("แก้ไขข้อมูลสำเร็จ!");
      router.push('/admin/rooms');
      
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{padding:40, textAlign:'center'}}>กำลังโหลดข้อมูลเดิม...</div>;

  return (
    <div>
      <div className="page-header">
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <button onClick={() => router.back()} className="btn-action" style={{background:'white', border:'1px solid #ccc'}}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1>แก้ไขข้อมูลห้อง</h1>
        </div>
      </div>

      <div className="admin-form-card">
        <form onSubmit={handleSubmit}>
          
          <div className="form-grid">
            <div className="form-group">
              <label>ชื่อห้อง <span style={{color:'red'}}>*</span></label>
              <input 
                type="text" className="form-input" required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>ชื่ออาคาร / ตึก <span style={{color:'red'}}>*</span></label>
              <input 
                type="text" className="form-input" required
                value={formData.building}
                onChange={e => setFormData({...formData, building: e.target.value})}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>ความจุ (ที่นั่ง)</label>
              <input 
                type="number" className="form-input" min="1"
                value={formData.capacity}
                onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
              />
            </div>
            <div className="form-group">
              <label>สถานะห้อง</label>
              <select 
                className="form-select"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="active">เปิดใช้งาน (Active)</option>
                <option value="maintenance">ปิดปรับปรุง (Maintenance)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>รูปภาพ URL</label>
            <input 
              type="url" className="form-input"
              value={formData.image_url}
              onChange={e => setFormData({...formData, image_url: e.target.value})}
            />
            {formData.image_url && (
                <img src={formData.image_url} alt="Preview" style={{height: 100, objectFit:'cover', marginTop: 10, borderRadius: 8}} />
            )}
          </div>

          <div className="form-group">
            <label>สิ่งอำนวยความสะดวก</label>
            <div className="facilities-grid">
              {facilityOptions.map(fac => (
                <div 
                  key={fac.id} 
                  className="facility-item"
                  onClick={() => handleToggleFacility(fac.id)}
                  style={{
                    borderColor: formData.facilities.includes(fac.id) ? '#FDB515' : '#e2e8f0',
                    background: formData.facilities.includes(fac.id) ? '#fffbeb' : 'white'
                  }}
                >
                  <span className="material-symbols-outlined" style={{
                    color: formData.facilities.includes(fac.id) ? '#d97706' : '#cbd5e1'
                  }}>
                    {formData.facilities.includes(fac.id) ? 'check_box' : 'check_box_outline_blank'}
                  </span>
                  {fac.label}
                </div>
              ))}
            </div>
          </div>

          <hr style={{border:'none', borderTop:'1px solid #e2e8f0', margin:'24px 0'}} />

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
          </button>

        </form>
      </div>
    </div>
  );
}