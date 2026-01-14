"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    studentId: "",
    fullName: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 1. Validation
    if (formData.password !== formData.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      setLoading(false);
      return;
    }

    try {
      // 2. สมัครสมาชิกกับ Supabase
      // เพิ่ม options data ไปด้วยเผื่อ Trigger อยากดึงไปใช้ (Best Practice)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            student_id: formData.studentId
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 3. บันทึก Profile (ใช้ UPSERT แทน INSERT)
        // เพื่อแก้ปัญหาข้อมูลชนกับ Trigger ที่สร้างให้อัตโนมัติ
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ 
            id: authData.user.id, // ต้องระบุ ID เสมอ
            student_id: formData.studentId,
            full_name: formData.fullName,
            role: 'student'
          });

        if (profileError) {
            console.error("Profile Error:", profileError);
            throw new Error("สร้างบัญชีสำเร็จ แต่บันทึกข้อมูลส่วนตัวไม่ผ่าน: " + profileError.message);
        }

        alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
        router.push("/login");
      }

    } catch (error: any) {
      setError(error.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-container">
      <div className="login-hero">
        <div className="hero-gradient">
          <div className="hero-pattern"></div>
          <div className="hero-overlay"><div className="hero-bg"></div></div>
          <div className="hero-glow"></div>
        </div>
        <div className="hero-header">
          <button onClick={() => router.back()} className="btn-back">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">สมัครสมาชิกใหม่</h1>
          <p className="hero-subtitle">กรอกข้อมูลเพื่อเข้าใช้งานระบบ</p>
        </div>
      </div>

      <div className="login-form-wrapper">
        <div className="login-form-card">
          <form onSubmit={handleSubmit} className="login-form">
            
            {error && (
              <div className="error-message">
                <span className="material-symbols-outlined">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* ชื่อ-นามสกุล */}
            <div className="form-group">
              <label className="form-label">ชื่อ-นามสกุล</label>
              <div className="form-input-wrapper">
                <span className="input-icon material-symbols-outlined">person</span>
                <input 
                  name="fullName"
                  type="text" 
                  className="form-input" 
                  placeholder="สมชาย ใจดี" 
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* รหัสนักศึกษา */}
            <div className="form-group">
              <label className="form-label">รหัสนักศึกษา</label>
              <div className="form-input-wrapper">
                <span className="input-icon material-symbols-outlined">badge</span>
                <input 
                  name="studentId"
                  type="text" 
                  className="form-input" 
                  placeholder="รหัสนักศึกษา" 
                  required
                  value={formData.studentId}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* อีเมล */}
            <div className="form-group">
              <label className="form-label">อีเมล</label>
              <div className="form-input-wrapper">
                <span className="input-icon material-symbols-outlined">mail</span>
                <input 
                  name="email"
                  type="email" 
                  className="form-input" 
                  placeholder="example@gmail.com" 
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* รหัสผ่าน */}
            <div className="form-group">
              <label className="form-label">รหัสผ่าน (ขั้นต่ำ 6 ตัว)</label>
              <div className="form-input-wrapper">
                <span className="input-icon material-symbols-outlined">lock</span>
                <input 
                  name="password"
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••" 
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* ยืนยันรหัสผ่าน */}
            <div className="form-group">
              <label className="form-label">ยืนยันรหัสผ่าน</label>
              <div className="form-input-wrapper">
                <span className="input-icon material-symbols-outlined">lock_reset</span>
                <input 
                  name="confirmPassword"
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••" 
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              <div className="btn-shine"></div>
              <span>{loading ? "กำลังบันทึก..." : "ยืนยันการสมัคร"}</span>
              <span className="material-symbols-outlined">
                {loading ? "hourglass_empty" : "check_circle"}
              </span>
            </button>

            <div className="divider">
               <div className="divider-line"></div>
               <span className="divider-text">มีบัญชีอยู่แล้ว?</span>
            </div>

            <Link href="/login" className="btn-register" style={{textDecoration:'none'}}>
                <span className="material-symbols-outlined">login</span>
                <span>เข้าสู่ระบบ</span>
            </Link>

          </form>
          <div className="login-footer">
            <p>© 2024 RUTS Computer Engineering.<br/>All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}