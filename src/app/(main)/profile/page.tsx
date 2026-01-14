"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  // --- UI States ---
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- Modal States (สำหรับเปิด/ปิดหน้าต่างแก้ไข) ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- Data States ---
  const [user, setUser] = useState<any>(null); // เก็บข้อมูล Auth User
  const [userData, setUserData] = useState({
    name: "",
    studentId: "",
    email: "",
    phone: "",
    department: "วิศวกรรมคอมพิวเตอร์",
    role: "นักศึกษา",
    avatar: "/images/student.jpg"
  });

  // --- Form States (ข้อมูลที่กำลังพิมพ์แก้ไข) ---
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    studentId: ""
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  // 1. ฟังก์ชันดึงข้อมูลจาก Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // 1.1 เช็ค Login
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setUser(user); // เก็บ user ไว้ใช้ตอน update

        // 1.2 ดึงข้อมูล Profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
        }

        // 1.3 อัปเดต State
        if (profile) {
          const loadedData = {
            name: profile.full_name || "ไม่ระบุชื่อ",
            studentId: profile.student_id || "-",
            email: user.email || "-",
            phone: profile.phone || "", // ใช้ค่าว่างถ้าไม่มี
            department: "วิศวกรรมคอมพิวเตอร์",
            role: profile.role === 'admin' ? 'ผู้ดูแลระบบ' : 'นักศึกษา',
            avatar: profile.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"
          };
          
          setUserData(loadedData);
          
          // เตรียมข้อมูลลงฟอร์มแก้ไขรอไว้เลย
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

  // 2. ฟังก์ชันเตรียมข้อมูลก่อนเปิด Modal แก้ไข
  const handleEditClick = () => {
    // รีเซ็ตฟอร์มให้ตรงกับข้อมูลปัจจุบัน
    setEditForm({
      name: userData.name,
      phone: userData.phone,
      studentId: userData.studentId
    });
    setShowEditModal(true);
  };

  // 3. ฟังก์ชันบันทึกข้อมูล (Update Profile)
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // ส่งข้อมูลไปอัปเดตที่ Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.name,
          phone: editForm.phone,
          student_id: editForm.studentId
        })
        .eq('id', user.id);

      if (error) throw error;

      // อัปเดตหน้าจอทันทีโดยไม่ต้องโหลดใหม่
      setUserData({ 
        ...userData, 
        name: editForm.name,
        phone: editForm.phone,
        studentId: editForm.studentId
      });
      
      setShowEditModal(false);
      alert("บันทึกข้อมูลสำเร็จ!");

    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 4. ฟังก์ชันเปลี่ยนรหัสผ่าน
  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      alert("เปลี่ยนรหัสผ่านสำเร็จ!");
      setShowPasswordModal(false);
      setPasswordForm({ newPassword: "", confirmPassword: "" });

    } catch (error: any) {
      alert("เปลี่ยนรหัสผ่านไม่สำเร็จ: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 5. ฟังก์ชัน Logout
  const handleLogout = async () => {
    if (confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      await supabase.auth.signOut();
      router.push("/login");
    }
  };

  const handleViewBookings = () => {
    console.log("View bookings clicked");
  };

  // UI ตอนโหลด
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '10px' }}>
        <div className="spinner" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid var(--ruts-navy)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: '#64748b' }}>กำลังโหลดข้อมูลโปรไฟล์...</p>
        <style jsx>{` @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } `}</style>
      </div>
    );
  }

  return (
    <div className="profile-page">

      {/* Header */}
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
          <button className="icon-btn">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>

        <div className="profile-hero">
          {/* คลิกที่รูปเพื่อแก้ไขได้ */}
          <div className="avatar-container" onClick={handleEditClick}>
            <div 
              className="avatar" 
              style={{ 
                backgroundImage: `url(${userData.avatar})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            ></div>
            <div className="avatar-edit-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                edit
              </span>
            </div>
          </div>
          
          <h2 className="user-name">{userData.name}</h2>
          
          <div className="user-meta">
            <span className="role-badge">{userData.role}</span>
            <span className="user-meta-divider">•</span>
            <span className="user-meta-text">รหัส: {userData.studentId}</span>
          </div>
          
          <p className="user-department">{userData.department}</p>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="quick-actions-container">
        <div className="quick-actions">
          <button className="action-btn" onClick={handleEditClick}>
            <div className="action-icon-wrapper">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                edit_square
              </span>
            </div>
            <span className="action-label">แก้ไขข้อมูล</span>
          </button>
          
          <div className="divider-vertical"></div>
          
          <button className="action-btn" onClick={() => setShowPasswordModal(true)}>
            <div className="action-icon-wrapper">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                lock_reset
              </span>
            </div>
            <span className="action-label">เปลี่ยนรหัส</span>
          </button>
          
          <div className="divider-vertical"></div>
          
          <button className="action-btn" onClick={handleViewBookings}>
            <div className="action-icon-wrapper">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                calendar_month
              </span>
            </div>
            <span className="action-label">การจองของฉัน</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="profile-content">
        <section className="section">
          <h3 className="section-header">
            <span className="material-symbols-outlined section-icon">person</span>
            ข้อมูลบัญชี
          </h3>
          
          <div className="card">
            <div className="card-row">
              <div className="card-row-content">
                <div className="card-icon-wrapper">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>mail</span>
                </div>
                <div className="card-text-wrapper">
                  <span className="card-label">อีเมล</span>
                  <span className="card-value">{userData.email}</span>
                </div>
              </div>
            </div>

            <div className="card-row">
              <div className="card-row-content">
                <div className="card-icon-wrapper">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>call</span>
                </div>
                <div className="card-text-wrapper">
                  <span className="card-label">เบอร์โทรศัพท์</span>
                  <span className="card-value">{userData.phone || "-"}</span>
                </div>
              </div>
            </div>

            <div className="card-row">
              <div className="card-row-content">
                <div className="card-icon-wrapper">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>school</span>
                </div>
                <div className="card-text-wrapper">
                  <span className="card-label">สาขาวิชา</span>
                  <span className="card-value">{userData.department}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Settings & Others */}
        <section className="section">
          <h3 className="section-header">
            <span className="material-symbols-outlined section-icon">tune</span>
            การตั้งค่าแอปพลิเคชัน
          </h3>
          
          <div className="card">
            <div className="card-row">
              <div className="card-row-content">
                <div className="card-icon-wrapper">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
                </div>
                <span className="card-value">การแจ้งเตือน</span>
              </div>
              <label className="toggle-wrapper">
                <input
                  type="checkbox"
                  className="toggle-input"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                />
                <div className="toggle-slider"></div>
              </label>
            </div>

            <div className="card-row">
              <div className="card-row-content">
                <div className="card-icon-wrapper">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dark_mode</span>
                </div>
                <span className="card-value">โหมดกลางคืน</span>
              </div>
              <label className="toggle-wrapper">
                <input
                  type="checkbox"
                  className="toggle-input"
                  checked={darkModeEnabled}
                  onChange={(e) => setDarkModeEnabled(e.target.checked)}
                />
                <div className="toggle-slider"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Additional Info */}
        <section className="section">
          <h3 className="section-header">
            <span className="material-symbols-outlined section-icon">info</span>
            ข้อมูลเพิ่มเติม
          </h3>
          
          <div className="card">
            <button className="card-row-button">
              <div className="card-row-content">
                <div className="card-icon-wrapper">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>help</span>
                </div>
                <span className="card-value">ศูนย์ช่วยเหลือ</span>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#64748b' }}>chevron_right</span>
            </button>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
            ออกจากระบบ
          </button>

          <p className="version-info">
            RUTS Classroom App Version 2.0.1<br />
            Computer Engineering Department
          </p>
        </section>
      </main>

      {/* ================= MODALS SECTION ================= */}

      {/* 1. Modal แก้ไขข้อมูลส่วนตัว */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>แก้ไขข้อมูลส่วนตัว</h3>
              <button onClick={() => setShowEditModal(false)} className="close-btn">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={saveProfile}>
              <div className="form-group">
                <label>ชื่อ-นามสกุล</label>
                <input 
                  type="text" 
                  className="modal-input" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>รหัสนักศึกษา</label>
                <input 
                  type="text" 
                  className="modal-input" 
                  value={editForm.studentId}
                  onChange={(e) => setEditForm({...editForm, studentId: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>เบอร์โทรศัพท์</label>
                <input 
                  type="tel" 
                  className="modal-input" 
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  placeholder="08x-xxx-xxxx"
                />
              </div>
              <button type="submit" className="save-btn" disabled={isSaving}>
                {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal เปลี่ยนรหัสผ่าน */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>เปลี่ยนรหัสผ่าน</h3>
              <button onClick={() => setShowPasswordModal(false)} className="close-btn">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={savePassword}>
              <div className="form-group">
                <label>รหัสผ่านใหม่</label>
                <input 
                  type="password" 
                  className="modal-input" 
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>ยืนยันรหัสผ่านใหม่</label>
                <input 
                  type="password" 
                  className="modal-input" 
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="save-btn" disabled={isSaving}>
                {isSaving ? "กำลังเปลี่ยนรหัส..." : "ยืนยันการเปลี่ยนรหัส"}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}