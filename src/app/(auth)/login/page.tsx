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
      // 1. Login กับ Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message === "Invalid login credentials") {
          throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        }
        if (authError.message === "Email not confirmed") {
            throw new Error("กรุณายืนยันอีเมลก่อนเข้าใช้งาน");
        }
        throw authError;
      }

      // ✅ 2. เช็ค Role จากตาราง profiles ว่าเป็น admin หรือไม่
      if (data.user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role') // ดึง column role มาเช็ค
            .eq('id', data.user.id)
            .single();

        // ตรวจสอบ Role และเด้งไปหน้าให้ถูก
        if (profile?.role === 'admin') {
            router.push("/admin/dashboard"); // ถ้าเป็น Admin ไปหน้า Admin
        } else {
            router.push("/dashboard");       // ถ้าเป็น User ทั่วไป ไปหน้าปกติ
        }
      }

    } catch (err: any) {
      setError(err.message || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      setIsLoading(false); // ปิด Loading เฉพาะตอน Error (ตอน Success ปล่อยค้างไว้กัน User กดซ้ำก่อนเปลี่ยนหน้า)
    } 
  };

  return (
    <div className="login-container">
      {/* Hero Section */}
      <div className="login-hero">
        <div className="hero-gradient">
          <div className="hero-pattern"></div>
          <div className="hero-overlay">
            <div className="hero-bg"></div>
          </div>
          <div className="hero-glow"></div>
        </div>

        <div className="hero-header">
          <button
            onClick={() => router.back()}
            className="btn-back"
            aria-label="ย้อนกลับ"
          >
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

      {/* Form Section */}
      <div className="login-form-wrapper">
        <div className="login-form-card">
          <form onSubmit={handleLogin} className="login-form">
            {/* Error Message */}
            {error && (
              <div className="error-message">
                <span className="material-symbols-outlined">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                อีเมล
              </label>
              <div className="form-input-wrapper">
                <span className="input-icon material-symbols-outlined">
                  badge
                </span>
                <input
                  id="email"
                  type="text"
                  className="form-input"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                รหัสผ่าน
              </label>
              <div className="form-input-wrapper">
                <span className="input-icon material-symbols-outlined">
                  lock
                </span>
                <input
                  id="password"
                  type="password" // แก้กลับเป็น password ปกติ (showPassword state ค่อยคุม type)
                  // หรือใช้ logic เดิม: type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                {/* (ปุ่ม Show Password เดิมของคุณ ถ้ามีก็ใส่ไว้ได้เลยครับ) */}
              </div>
            </div>

            {/* Forgot Password */}
            <div className="forgot-password-wrapper">
              <a href="#" className="forgot-password-link">
                ลืมรหัสผ่าน?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="btn-login"
              disabled={isLoading}
            >
              <div className="btn-shine"></div>
              <span>{isLoading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}</span>
              <span className="material-symbols-outlined">
                {isLoading ? "hourglass_empty" : "login"}
              </span>
            </button>

            {/* Divider */}
            <div className="divider">
              <div className="divider-line"></div>
              <span className="divider-text">หรือ</span>
            </div>

            {/* Register Button */}
            <button
              type="button"
              className="btn-register"
              onClick={() => router.push("/register")}
              disabled={isLoading}
            >
              <span className="material-symbols-outlined">person_add</span>
              <span>สมัครสมาชิกใหม่</span>
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p>
              © 2024 RUTS Computer Engineering.
              <br />
              All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}