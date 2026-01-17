"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import "../admin.css";

// Interface อัปเดตให้รองรับ status
interface Profile {
  id: string;
  full_name: string;
  student_id: string;
  avatar_url: string;
  email?: string;
  status?: string; // 'active' | 'banned'
  created_at: string;
}

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    student_id: "",
    status: "active"
  });

  // --- FETCH DATA ---
  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('student_id', { ascending: true });
    
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- ACTIONS ---

  // 1. เตรียมเปิด Modal (เพิ่ม หรือ แก้ไข)
  const openModal = (user: Profile | null = null) => {
    setEditingUser(user);
    if (user) {
      // โหมดแก้ไข
      setFormData({
        full_name: user.full_name,
        student_id: user.student_id,
        status: user.status || "active"
      });
    } else {
      // โหมดเพิ่มใหม่
      setFormData({ full_name: "", student_id: "", status: "active" });
    }
    setIsModalOpen(true);
  };

  // 2. บันทึกข้อมูล (Save)
  const handleSave = async () => {
    if (!formData.full_name || !formData.student_id) return alert("กรุณากรอกข้อมูลให้ครบ");

    try {
      if (editingUser) {
        // Update
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            student_id: formData.student_id,
            status: formData.status
          })
          .eq('id', editingUser.id);
        if (error) throw error;
      } else {
        // Create (Insert)
        // *หมายเหตุ: การ Insert ตรงนี้อาจต้องใช้สิทธิ์ Admin หรือปิด RLS ชั่วคราว
        // เพราะปกติ Profile จะสร้างอัตโนมัติเมื่อ User สมัครสมาชิก
        const { error } = await supabase
          .from('profiles')
          .insert([{
            full_name: formData.full_name,
            student_id: formData.student_id,
            status: formData.status,
            // สร้าง Dummy ID หรือรอ Trigger (ขึ้นอยู่กับการออกแบบ DB)
          }]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchUsers(); // Refresh
      alert(editingUser ? "แก้ไขข้อมูลสำเร็จ" : "เพิ่มผู้ใช้งานสำเร็จ");

    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    }
  };

  // 3. ลบผู้ใช้งาน (Delete)
  const handleDelete = async (id: string) => {
    if (!confirm("⚠️ คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?\nข้อมูลการจองทั้งหมดของผู้ใช้นี้จะหายไป")) return;

    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      alert("ลบไม่สำเร็จ: " + error.message);
    } else {
      fetchUsers();
    }
  };

  // 4. สลับสถานะ ระงับ/ปกติ (Toggle Ban)
  const handleToggleStatus = async (user: Profile) => {
    const newStatus = user.status === 'banned' ? 'active' : 'banned';
    const confirmMsg = newStatus === 'banned' 
      ? `ต้องการ "ระงับ" การใช้งานของ ${user.full_name} หรือไม่?` 
      : `ต้องการ "ปลดแบน" ${user.full_name} หรือไม่?`;

    if (!confirm(confirmMsg)) return;

    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', user.id);

    if (error) {
      alert("อัปเดตสถานะไม่สำเร็จ");
    } else {
      // อัปเดต State ทันทีโดยไม่ต้องโหลดใหม่
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    }
  };

  // Filter Logic
  const filteredUsers = users.filter(u => 
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.student_id || "").includes(search)
  );

  return (
    <div style={{position: 'relative', paddingBottom: 100}}>
      <div className="page-header">
        <div>
           <h1>รายชื่อผู้ใช้งาน</h1>
           <span style={{fontSize:'0.85rem', color:'var(--text-sub)'}}>สมาชิกทั้งหมด {users.length} คน</span>
        </div>
        {/* ปุ่มเพิ่มสมาชิก */}
        <button 
          onClick={() => openModal(null)}
          className="btn-primary" 
          style={{width:'auto', padding:'8px 12px', fontSize:'0.85rem'}}
        >
           <span className="material-symbols-outlined" style={{fontSize:20}}>person_add</span> เพิ่ม
        </button>
      </div>

      {/* ช่องค้นหา */}
      <div className="search-box-wrapper" style={{marginBottom: 20}}>
          <span className="material-symbols-outlined search-icon">search</span>
          <input 
            type="text" 
            placeholder="ค้นหาชื่อ หรือ รหัสนักศึกษา..." 
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
      </div>

      <div className="user-list-container">
        {loading ? (
             [...Array(4)].map((_, i) => <div key={i} className="user-card-skeleton"></div>)
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div key={user.id} className="user-card-item" style={{opacity: user.status === 'banned' ? 0.7 : 1}}>
              
              <div className="user-card-header">
                 {/* Avatar */}
                 <div className="user-avatar" style={{filter: user.status === 'banned' ? 'grayscale(100%)' : 'none'}}>
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt="avatar" />
                    ) : (
                        <span className="material-symbols-outlined">person</span>
                    )}
                 </div>
                 
                 {/* Info */}
                 <div className="user-info">
                    <h3 className="user-name">{user.full_name || "ไม่ระบุชื่อ"}</h3>
                    <div className="user-meta">
                        <span className="student-id">
                            <span className="material-symbols-outlined" style={{fontSize:16}}>badge</span>
                            {user.student_id || "-"}
                        </span>
                        <span className="join-date">
                            <span className="material-symbols-outlined" style={{fontSize:16}}>calendar_today</span>
                            {new Date(user.created_at).toLocaleDateString('th-TH', {day:'numeric', month:'short', year:'2-digit'})}
                        </span>
                    </div>
                 </div>

                 {/* Status Badge */}
                 <div className="user-status">
                    <span className={`status-badge ${user.status === 'banned' ? 'rejected' : 'approved'}`}>
                        {user.status === 'banned' ? 'Suspended' : 'Active'}
                    </span>
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="user-card-actions">
                  <button className="btn-action-card secondary" onClick={() => openModal(user)}>
                      <span className="material-symbols-outlined">edit</span> แก้ไข
                  </button>
                  
                  <button 
                    className={`btn-action-card ${user.status === 'banned' ? 'edit' : 'delete'}`} 
                    onClick={() => handleToggleStatus(user)}
                    style={{color: user.status === 'banned' ? 'var(--green)' : 'var(--red)', background: user.status === 'banned' ? '#dcfce7' : '#fee2e2'}}
                  >
                      <span className="material-symbols-outlined">
                        {user.status === 'banned' ? 'check_circle' : 'block'}
                      </span> 
                      {user.status === 'banned' ? 'ปลดแบน' : 'ระงับ'}
                  </button>

                  {/* ปุ่มลบถาวร (ซ่อนไว้ในเมนูจุด หรือกดแยกถ้าจำเป็น) */}
                  <button className="btn-action-card delete" style={{width: 'auto', padding: '0 12px'}} onClick={() => handleDelete(user.id)}>
                      <span className="material-symbols-outlined">delete</span>
                  </button>
              </div>

            </div>
          ))
        ) : (
          <div style={{textAlign:'center', padding:40, color:'var(--text-sub)'}}>
             <span className="material-symbols-outlined" style={{fontSize:48, marginBottom:8}}>person_search</span>
             <p>ไม่พบรายชื่อที่ค้นหา</p>
          </div>
        )}
      </div>

      {/* ✅ MODAL FORM (เพิ่ม/แก้ไข) */}
      {isModalOpen && (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
            <div style={{
                background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340,
                display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
                <h3 style={{textAlign:'center', fontWeight:700, margin:0}}>
                    {editingUser ? "แก้ไขข้อมูล" : "เพิ่มสมาชิกใหม่"}
                </h3>

                <div style={{display:'flex', flexDirection:'column', gap:12}}>
                    <div className="form-group">
                        <label>ชื่อ-นามสกุล</label>
                        <input 
                            type="text" className="form-input" 
                            value={formData.full_name} 
                            onChange={e => setFormData({...formData, full_name: e.target.value})}
                            placeholder="เช่น นายรักเรียน ขยันยิ่ง"
                        />
                    </div>
                    <div className="form-group">
                        <label>รหัสนักศึกษา / ตำแหน่ง</label>
                        <input 
                            type="text" className="form-input" 
                            value={formData.student_id} 
                            onChange={e => setFormData({...formData, student_id: e.target.value})}
                            placeholder="เช่น 6400000000"
                        />
                    </div>
                    {/* Status Select */}
                    <div className="form-group">
                        <label>สถานะบัญชี</label>
                        <select 
                            className="form-select"
                            value={formData.status}
                            onChange={e => setFormData({...formData, status: e.target.value})}
                        >
                            <option value="active">ใช้งานปกติ (Active)</option>
                            <option value="banned">ระงับการใช้งาน (Banned)</option>
                        </select>
                    </div>
                </div>

                <div style={{display:'flex', gap:10, marginTop:10}}>
                    <button onClick={handleSave} className="btn-primary" style={{flex:1, justifyContent:'center'}}>
                        บันทึก
                    </button>
                    <button onClick={() => setIsModalOpen(false)} style={{flex:1, padding:12, borderRadius:12, border:'1px solid #e2e8f0', fontWeight:600, color:'#64748b'}}>
                        ยกเลิก
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}