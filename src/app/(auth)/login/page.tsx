"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import React from "react";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle(); 

        if (profileError) {
            console.error("Profile Error:", profileError.message);
            router.push("/dashboard");
            return;
        }

        if (profile?.role === 'admin') {
            router.push("/admin/dashboard");
        } else {
            router.push("/dashboard");
        }
      }

    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "เข้าสู่ระบบไม่สำเร็จ หรือรหัสผ่านไม่ถูกต้อง");
      setIsLoading(false);
    } 
  };
  
  return (
    <div className="login-container">
      {/* ================= HERO SECTION ================= */}
      <div className="login-hero">
        <div className="hero-gradient">
          <div className="hero-pattern"></div>
          <div className="hero-overlay">
            {/* 🌟 เปลี่ยน URL รูปตรงนี้เป็นรูปมหาลัยสวยๆ ได้เลยครับ */}
            <div className="hero-bg" style={{ backgroundImage: 'url("https://www.rmutsv.ac.th/ruts/wp-content/uploads/2023/05/bg1-Large.jpeg")' }}></div>
          </div>
          <div className="hero-glow"></div>
        </div>

        <div className="hero-header">
          <button onClick={() => router.back()} className="btn-back" aria-label="ย้อนกลับ">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="material-symbols-outlined">school</span>
            <span>RUTS ENGINEERING</span>
          </div>
          <h1 className="hero-title">ยินดีต้อนรับสู่ระบบ</h1>
          <p className="hero-subtitle">จองห้องเรียนออนไลน์ คณะวิศวกรรมศาสตร์</p>
        </div>
      </div>

      {/* ================= FORM SECTION ================= */}
      <div className="login-form-wrapper">
        <div className="login-form-card">
          
          <div className="form-header-mobile">
             <h2>เข้าสู่ระบบ</h2>
             <p>กรุณากรอกอีเมลและรหัสผ่านของคุณ</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {error && (
              <div className="error-message">
                <span className="material-symbols-outlined">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">อีเมล</label>
              <div className="form-input-wrapper">
                <span className="input-icon material-symbols-outlined">mail</span>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="student@rmutsv.ac.th"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <label htmlFor="password" className="form-label">รหัสผ่าน</label>
                 <a href="#" className="forgot-password-link">ลืมรหัสผ่าน?</a>
              </div>
              <div className="form-input-wrapper">
                <span className="input-icon material-symbols-outlined">lock</span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"} // 🌟 ใช้ State คุมการซ่อน/โชว์รหัส
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                
                {/* 🌟 ปุ่มตา เปิด-ปิด รหัสผ่าน */}
                <button 
                  type="button" 
                  className="toggle-password" 
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button type="submit" className="btn-login" disabled={isLoading}>
              <div className="btn-shine"></div>
              <span>{isLoading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}</span>
              <span className="material-symbols-outlined">
                {isLoading ? "hourglass_empty" : "arrow_forward"}
              </span>
            </button>

            {/* Divider */}
            <div className="divider">
              <div className="divider-line"></div>
              <span className="divider-text">นักศึกษาใหม่?</span>
            </div>

            {/* Register Button */}
            <button
              type="button"
              className="btn-register"
              onClick={() => router.push("/register")}
              disabled={isLoading}
            >
              <span className="material-symbols-outlined">person_add</span>
              <span>สร้างบัญชีผู้ใช้งาน</span>
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p>© 2024 RUTS Computer Engineering.<br />All rights reserved.</p>
          </div>

        </div>
      </div>
    </div>
  );
}