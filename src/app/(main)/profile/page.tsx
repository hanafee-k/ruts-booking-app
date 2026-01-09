"use client";

import { useState } from "react";
import BottomNav from "@/components/layout/BottomNav";

export default function ProfilePage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Mock user data
  const [userData, setUserData] = useState({
    name: "นายสมศักดิ์ รักเรียน",
    studentId: "63543206015-6",
    email: "somsak@ruts.ac.th",
    phone: "081-234-5678",
    department: "วิศวกรรมคอมพิวเตอร์",
    role: "นักศึกษา",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDXI_ZA6ZufZYN9XRvG7THCtvcresRVeJwHePv4UeGR0BPmCB0hSVz7S1QDLA_VwjbgC5vMuh_0Q0ZHOqP8kPQdQayFWVJF3wHvJube6AeLAYtmPPy7ZQo8z3r8ZCyLv0qzcIwkmaqv_5vPwe57c1aEW0CLGmofjZ60zz-OAmdBmgjTGai9Mxh2tI_uk_NmHnlkP_9T1vMd6L4tancOwYiDMriL4guExNkgVzxJU_vw0WejVtbqT3wdvFIoooPV4S-EA9RZSZgN4RY"
  });

  const handleLogout = () => {
    if (confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      // Implement logout logic here
      console.log("Logging out...");
      // window.location.href = "/login";
    }
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    console.log("Edit profile clicked");
  };

  const handleChangePassword = () => {
    console.log("Change password clicked");
  };

  const handleViewBookings = () => {
    console.log("View bookings clicked");
  };

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
          <div className="avatar-container" onClick={handleEditProfile}>
            <div 
              className="avatar" 
              style={{ backgroundImage: `url(${userData.avatar})` }}
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
          <button className="action-btn" onClick={handleEditProfile}>
            <div className="action-icon-wrapper">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                edit_square
              </span>
            </div>
            <span className="action-label">แก้ไขข้อมูล</span>
          </button>
          
          <div className="divider-vertical"></div>
          
          <button className="action-btn" onClick={handleChangePassword}>
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
        {/* Personal Information */}
        <section className="section">
          <h3 className="section-header">
            <span className="material-symbols-outlined section-icon">person</span>
            ข้อมูลบัญชี
          </h3>
          
          <div className="card">
            <div className="card-row">
              <div className="card-row-content">
                <div className="card-icon-wrapper">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    mail
                  </span>
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
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    call
                  </span>
                </div>
                <div className="card-text-wrapper">
                  <span className="card-label">เบอร์โทรศัพท์</span>
                  <span className="card-value">{userData.phone}</span>
                </div>
              </div>
            </div>

            <div className="card-row">
              <div className="card-row-content">
                <div className="card-icon-wrapper">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    school
                  </span>
                </div>
                <div className="card-text-wrapper">
                  <span className="card-label">สาขาวิชา</span>
                  <span className="card-value">{userData.department}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* App Settings */}
        <section className="section">
          <h3 className="section-header">
            <span className="material-symbols-outlined section-icon">tune</span>
            การตั้งค่าแอปพลิเคชัน
          </h3>
          
          <div className="card">
            <div className="card-row">
              <div className="card-row-content">
                <div className="card-icon-wrapper">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    notifications
                  </span>
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

            <button className="card-row-button">
              <div className="card-row-content">
                <div className="card-icon-wrapper">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    language
                  </span>
                </div>
                <span className="card-value">ภาษา</span>
              </div>
              <div className="card-row-right">
                <span className="card-row-right-text">ไทย</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  chevron_right
                </span>
              </div>
            </button>

            <div className="card-row">
              <div className="card-row-content">
                <div className="card-icon-wrapper">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    dark_mode
                  </span>
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
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    help
                  </span>
                </div>
                <span className="card-value">ศูนย์ช่วยเหลือ</span>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#64748b' }}>
                chevron_right
              </span>
            </button>

            <button className="card-row-button">
              <div className="card-row-content">
                <div className="card-icon-wrapper">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    description
                  </span>
                </div>
                <span className="card-value">ข้อกำหนดการใช้งาน</span>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#64748b' }}>
                chevron_right
              </span>
            </button>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              logout
            </span>
            ออกจากระบบ
          </button>

          <p className="version-info">
            RUTS Classroom App Version 2.0.1<br />
            Computer Engineering Department
          </p>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}