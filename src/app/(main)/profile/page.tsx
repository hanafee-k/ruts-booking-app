"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import { createClient } from "@/lib/supabase/client";
import "./profile.css";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  // --- UI States ---
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- Modal States ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // ✅ เพิ่ม State สำหรับหน้าดูรูปโปรไฟล์ (Full Screen)
  const [showAvatarView, setShowAvatarView] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // --- Data States ---
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState({
    name: "",
    studentId: "",
    email: "",
    phone: "",
    department: "วิศวกรรมคอมพิวเตอร์",
    role: "นักศึกษา",
    avatar: "/images/student.jpg"
  });

  // --- Form States ---
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    studentId: ""
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  // 1. Fetch Profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setUser(user);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          const loadedData = {
            name: profile.full_name || "ไม่ระบุชื่อ",
            studentId: profile.student_id || "-",
            email: user.email || "-",
            phone: profile.phone || "",
            department: "วิศวกรรมคอมพิวเตอร์",
            role: profile.role === 'admin' ? 'ผู้ดูแลระบบ' : 'นักศึกษา',
            avatar: profile.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"
          };
          
          setUserData(loadedData);
          setEditForm({
            name: loadedData.name,
            phone: loadedData.phone,
            studentId: loadedData.studentId
          });
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router, supabase]);

  // ฟังก์ชันอัปโหลดรูป
  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      setIsUploading(true);
      
      // ✅ ปิดหน้าดูรูป เพื่อกลับมาหน้าหลักโชว์ Loading
      setShowAvatarView(false); 

      // 1. Upload
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update DB
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUserData({ ...userData, avatar: publicUrl });
      alert("อัปโหลดรูปโปรไฟล์สำเร็จ!");

    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditClick = () => {
    setEditForm({ name: userData.name, phone: userData.phone, studentId: userData.studentId });
    setShowEditModal(true);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
          full_name: editForm.name,
          phone: editForm.phone,
          student_id: editForm.studentId
        }).eq('id', user.id);
      if (error) throw error;
      setUserData({ ...userData, name: editForm.name, phone: editForm.phone, studentId: editForm.studentId });
      setShowEditModal(false);
      alert("บันทึกข้อมูลสำเร็จ!");
    } catch (error: any) { alert("เกิดข้อผิดพลาด: " + error.message); } 
    finally { setIsSaving(false); }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { alert("รหัสผ่านไม่ตรงกัน"); return; }
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (error) throw error;
      alert("เปลี่ยนรหัสผ่านสำเร็จ!"); setShowPasswordModal(false); setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (error: any) { alert("เปลี่ยนรหัสผ่านไม่สำเร็จ: " + error.message); } 
    finally { setIsSaving(false); }
  };

  const handleLogout = async () => {
    if (confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      await supabase.auth.signOut();
      router.push("/login");
    }
  };

  if (loading) return <div style={{padding:'40px', textAlign:'center'}}>กำลังโหลด...</div>;

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="header-bg-overlay">
           <div className="header-blob-1"></div>
           <div className="header-blob-2"></div>
        </div>
        
        <div className="header-top">
          <button className="icon-btn" onClick={() => window.history.back()}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="header-title">โปรไฟล์ส่วนตัว</h1>
          <button className="icon-btn"><span className="material-symbols-outlined">settings</span></button>
        </div>

        <div className="profile-hero">
          
          {/* ✅ 1. แก้ไข: กดที่รูป -> เปิดหน้า Avatar View (setShowAvatarView) */}
          <div className="avatar-container" onClick={() => setShowAvatarView(true)}>
            <div 
              className="avatar" 
              style={{ 
                backgroundImage: `url(${userData.avatar})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: isUploading ? 0.5 : 1
              }}
            ></div>
            
            {/* Loading Indicator */}
            {isUploading && (
               <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', zIndex:10}}>
                  <span className="material-symbols-outlined" style={{animation:'spin 1s linear infinite', color: 'var(--ruts-navy)'}}>refresh</span>
                  <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
               </div>
            )}

            <div className="avatar-edit-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                photo_camera
              </span>
            </div>
          </div>
          
          {/* Input File (ซ่อนไว้เหมือนเดิม) */}
          <input 
            type="file" 
            id="avatar-upload" 
            accept="image/*" 
            style={{ display: 'none' }} 
            onChange={handleAvatarChange}
          />
          
          <h2 className="user-name">{userData.name}</h2>
          <div className="user-meta">
            <span className="role-badge">{userData.role}</span>
            <span className="user-meta-divider">•</span>
            <span className="user-meta-text">รหัส: {userData.studentId}</span>
          </div>
          <p className="user-department">{userData.department}</p>
        </div>
      </header>

      {/* Quick Actions (ส่วนเดิม) */}
      <div className="quick-actions-container">
        <div className="quick-actions">
          <button className="action-btn" onClick={handleEditClick}>
            <div className="action-icon-wrapper"><span className="material-symbols-outlined" style={{ fontSize: '24px' }}>edit_square</span></div>
            <span className="action-label">แก้ไขข้อมูล</span>
          </button>
          <div className="divider-vertical"></div>
          <button className="action-btn" onClick={() => setShowPasswordModal(true)}>
            <div className="action-icon-wrapper"><span className="material-symbols-outlined" style={{ fontSize: '24px' }}>lock_reset</span></div>
            <span className="action-label">เปลี่ยนรหัส</span>
          </button>
          <div className="divider-vertical"></div>
          <button className="action-btn">
            <div className="action-icon-wrapper"><span className="material-symbols-outlined" style={{ fontSize: '24px' }}>calendar_month</span></div>
            <span className="action-label">การจองของฉัน</span>
          </button>
        </div>
      </div>

      <main className="profile-content">
        {/* ... (Content ส่วนเดิม คงไว้เหมือนเดิม) ... */}
        <section className="section">
          <h3 className="section-header"><span className="material-symbols-outlined section-icon">person</span> ข้อมูลบัญชี</h3>
          <div className="card">
            <div className="card-row">
              <div className="card-row-content">
                <div className="card-icon-wrapper"><span className="material-symbols-outlined">mail</span></div>
                <div className="card-text-wrapper"><span className="card-label">อีเมล</span><span className="card-value">{userData.email}</span></div>
              </div>
            </div>
            <div className="card-row">
              <div className="card-row-content">
                <div className="card-icon-wrapper"><span className="material-symbols-outlined">call</span></div>
                <div className="card-text-wrapper"><span className="card-label">เบอร์โทรศัพท์</span><span className="card-value">{userData.phone || "-"}</span></div>
              </div>
            </div>
            <div className="card-row">
              <div className="card-row-content">
                <div className="card-icon-wrapper"><span className="material-symbols-outlined">school</span></div>
                <div className="card-text-wrapper"><span className="card-label">สาขาวิชา</span><span className="card-value">{userData.department}</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">

          <h3 className="section-header"><span className="material-symbols-outlined section-icon">tune</span> การตั้งค่า</h3>
          <div className="card">
            <div className="card-row">
              <div className="card-row-content">
                 <div className="card-icon-wrapper"><span className="material-symbols-outlined">notifications</span></div>
                 <span className="card-value">การแจ้งเตือน</span>
              </div>

              <label className="toggle-wrapper">
                <input type="checkbox" className="toggle-input" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)}/>
                <div className="toggle-slider"></div>
              </label>

            </div>
            <div className="card-row">
              <div className="card-row-content">
                 <div className="card-icon-wrapper"><span className="material-symbols-outlined">dark_mode</span></div>
                 <span className="card-value">โหมดกลางคืน</span>
              </div>

              <label className="toggle-wrapper">
                <input type="checkbox" className="toggle-input" checked={darkModeEnabled} onChange={(e) => setDarkModeEnabled(e.target.checked)}/>
                <div className="toggle-slider"></div>
              </label>
            </div>
          </div>
        </section>

        <section className="section">
           <button className="logout-button" onClick={handleLogout}>
             <span className="material-symbols-outlined">logout</span> ออกจากระบบ
           </button>
           <p className="version-info">RUTS Classroom App Version 2.0.1</p>
        </section>
      </main>

      {/* Modals เดิม (Edit & Password) */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header"><h3>แก้ไขข้อมูลส่วนตัว</h3><button onClick={() => setShowEditModal(false)} className="close-btn"><span className="material-symbols-outlined">close</span></button></div>
            <form onSubmit={saveProfile}>
              <div className="form-group"><label>ชื่อ-นามสกุล</label><input type="text" className="modal-input" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} required /></div>
              <div className="form-group"><label>รหัสนักศึกษา</label><input type="text" className="modal-input" value={editForm.studentId} onChange={(e) => setEditForm({...editForm, studentId: e.target.value})} required /></div>
              <div className="form-group"><label>เบอร์โทรศัพท์</label><input type="tel" className="modal-input" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} /></div>
              <button type="submit" className="save-btn" disabled={isSaving}>{isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</button>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
             <div className="modal-header"><h3>เปลี่ยนรหัสผ่าน</h3><button onClick={() => setShowPasswordModal(false)} className="close-btn"><span className="material-symbols-outlined">close</span></button></div>
            <form onSubmit={savePassword}>
               <div className="form-group"><label>รหัสผ่านใหม่</label><input type="password" className="modal-input" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} required minLength={6} /></div>
              <div className="form-group"><label>ยืนยันรหัสผ่านใหม่</label><input type="password" className="modal-input" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} required minLength={6} /></div>
              <button type="submit" className="save-btn" disabled={isSaving}>{isSaving ? "กำลังเปลี่ยน..." : "ยืนยัน"}</button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ✅ 2. เพิ่มใหม่: Full Screen Avatar View (หน้าดูรูป) */}
      {/* ======================================================== */}
      {showAvatarView && (
        <div className="avatar-view-overlay">
          {/* Header ปุ่มปิด */}
          <div className="avatar-view-header">
            <button className="avatar-view-close" onClick={() => setShowAvatarView(false)}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>close</span>
            </button>
          </div>
          
          {/* รูปภาพขนาดใหญ่ */}
          <div className="avatar-view-content">
            <div 
              className="avatar-view-image"
              style={{ backgroundImage: `url(${userData.avatar})` }}
            ></div>
          </div>

          {/* ปุ่มด้านล่าง (Action Buttons) */}
          <div className="avatar-view-footer">
            <button 
              className="avatar-action-btn"
              onClick={() => {
                // กดปุ่มนี้ -> ไปคลิก Input File จริงๆ เพื่อเลือกรูป
                document.getElementById('avatar-upload')?.click();
              }}
            >
              เปลี่ยนรูปภาพ
            </button>
            <button 
              className="avatar-action-btn"
              onClick={() => alert("ระบบกรอบรูปกำลังพัฒนา...")}
            >
              เปลี่ยนกรอบ
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}



