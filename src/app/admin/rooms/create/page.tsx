"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import "../../admin.css"; // ถอยกลับไป 3 ชั้นเพื่อหาไฟล์ css

export default function CreateRoomPage() {
  const router = useRouter();
  const supabase = createClient();
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    building: "",
    capacity: 40,
    image_url: "",
    status: "active",
    facilities: [] as string[] // เก็บเป็น Array เช่น ['wifi', 'projector']
  });

  // Facility Options
  const facilityOptions = [
    { id: 'wifi', label: 'Wi-Fi' },
    { id: 'projector', label: 'โปรเจคเตอร์' },
    { id: 'whiteboard', label: 'กระดานไวท์บอร์ด' },
    { id: 'computer', label: 'คอมพิวเตอร์' },
    { id: 'aircon', label: 'เครื่องปรับอากาศ' },
    { id: 'power', label: 'ปลั๊กไฟ' }
  ];

  const handleToggleFacility = (id: string) => {
    setFormData(prev => {
      const exists = prev.facilities.includes(id);
      if (exists) return { ...prev, facilities: prev.facilities.filter(f => f !== id) };
      return { ...prev, facilities: [...prev.facilities, id] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from('rooms').insert([formData]);
      
      if (error) throw error;
      
      alert("เพิ่มห้องสำเร็จ!");
      router.push('/admin/rooms'); // กลับไปหน้ารายการ
      
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <button onClick={() => router.back()} className="btn-action" style={{background:'white', border:'1px solid #ccc'}}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1>เพิ่มห้องปฏิบัติการใหม่</h1>
        </div>
      </div>

      <div className="admin-form-card">
        <form onSubmit={handleSubmit}>
          
          <div className="form-grid">
            <div className="form-group">
              <label>ชื่อห้อง <span style={{color:'red'}}>*</span></label>
              <input 
                type="text" className="form-input" required placeholder="เช่น ห้องปฏิบัติการ 402"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>ชื่ออาคาร / ตึก <span style={{color:'red'}}>*</span></label>
              <input 
                type="text" className="form-input" required placeholder="เช่น อาคาร 4 คณะวิศวกรรมศาสตร์"
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
              type="url" className="form-input" placeholder="https://..."
              value={formData.image_url}
              onChange={e => setFormData({...formData, image_url: e.target.value})}
            />
            <small style={{color:'#64748b'}}>*แนะนำให้ใช้ลิงก์รูปภาพที่เข้าถึงได้สาธารณะ</small>
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
            {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลห้อง'}
          </button>

        </form>
      </div>
    </div>
  );
}