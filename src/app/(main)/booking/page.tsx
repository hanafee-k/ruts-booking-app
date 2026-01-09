"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";

interface BookingFormData {
  title: string;
  date: string;
  timeSlot: string;
  participants: number;
  additionalNotes: string;
  needProjector: boolean;
}

export default function BookingPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState<BookingFormData>({
    title: "",
    date: "2023-10-24",
    timeSlot: "09:00 - 11:00",
    participants: 4,
    additionalNotes: "",
    needProjector: true,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = "กรุณากรอกหัวข้อการจอง";
    }

    if (!formData.date) {
      newErrors.date = "กรุณาเลือกวันที่";
    }

    if (!formData.timeSlot) {
      newErrors.timeSlot = "กรุณาเลือกเวลา";
    }

    if (formData.participants < 1) {
      newErrors.participants = "จำนวนผู้เข้าร่วมต้องมากกว่า 0";
    }

    if (formData.participants > 42) {
      newErrors.participants = "จำนวนผู้เข้าร่วมต้องไม่เกิน 42 คน";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Here you would typically send data to your API
      console.log("Booking data:", formData);
      
      // Show success message or redirect
      alert("การจองสำเร็จ!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Booking error:", error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle participant count change
  const updateParticipants = (delta: number) => {
    setFormData((prev) => ({
      ...prev,
      participants: Math.max(1, Math.min(42, prev.participants + delta)),
    }));
  };

  // Calculate booking duration
  const calculateDuration = (): number => {
    const [start, end] = formData.timeSlot.split(" - ");
    const startHour = parseInt(start.split(":")[0]);
    const endHour = parseInt(end.split(":")[0]);
    return endHour - startHour;
  };

  return (
    
    <div className="booking-page">
      {/* Header */}
      <div className="booking-header">
        <button
          className="btn-back"
          onClick={() => router.back()}
          aria-label="กลับ"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="booking-title">รายละเอียดการจอง</h2>
      </div>

      {/* Main Content */}
      <div className="booking-content">
        {/* Room Card */}
        <div className="room-card">
          <div className="room-image">
            <div className="room-image-overlay"></div>
            <span className="room-status">ว่าง</span>
          </div>
          <div className="room-info">
            <div className="room-header">
              <div>
                <h3 className="room-name">ห้องปฏิบัติการคอมพิวเตอร์ 401</h3>
                <p className="room-location">
                  <span className="material-symbols-outlined">location_on</span>
                  ตึก 4 ชั้น 4, คณะวิศวกรรมศาสตร์
                </p>
              </div>
              <div className="room-capacity">
                <div className="avatar">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div className="avatar-count">+40</div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="form-section">
          <div className="section-header">
            <div className="section-indicator"></div>
            <h3>ข้อมูลการจอง</h3>
          </div>

          <div className="form-fields">
            {/* Title Field */}
            <label className="form-field">
              <p className="form-label">
                หัวข้อการจอง <span className="required">*</span>
              </p>
              <div className="input-wrapper">
                <input
                  type="text"
                  className={`form-input ${errors.title ? "error" : ""}`}
                  placeholder="เช่น ติวหนังสือ, ประชุมโปรเจกต์"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
                <span className="input-icon">
                  <span className="material-symbols-outlined">edit</span>
                </span>
              </div>
              {errors.title && (
                <span className="error-message">{errors.title}</span>
              )}
            </label>

            {/* Date and Time Fields */}
            <div className="form-row">
              <label className="form-field">
                <p className="form-label">
                  วันที่ <span className="required">*</span>
                </p>
                <button
                  className={`form-select ${errors.date ? "error" : ""}`}
                  onClick={() => {
                    // In production, open a date picker
                    const newDate = prompt("กรอกวันที่ (YYYY-MM-DD):", formData.date);
                    if (newDate) setFormData({ ...formData, date: newDate });
                  }}
                >
                  <span>{new Date(formData.date).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}</span>
                  <span className="material-symbols-outlined">calendar_today</span>
                </button>
                {errors.date && (
                  <span className="error-message">{errors.date}</span>
                )}
              </label>

              <label className="form-field">
                <p className="form-label">
                  เวลา <span className="required">*</span>
                </p>
                <button
                  className={`form-select ${errors.timeSlot ? "error" : ""}`}
                  onClick={() => {
                    // In production, open a time picker
                    const newTime = prompt("กรอกช่วงเวลา (เช่น 09:00 - 11:00):", formData.timeSlot);
                    if (newTime) setFormData({ ...formData, timeSlot: newTime });
                  }}
                >
                  <span>{formData.timeSlot}</span>
                  <span className="material-symbols-outlined">schedule</span>
                </button>
                {errors.timeSlot && (
                  <span className="error-message">{errors.timeSlot}</span>
                )}
              </label>
            </div>

            {/* Participants Counter */}
            <label className="form-field">
              <p className="form-label">จำนวนผู้เข้าร่วม</p>
              <div className={`counter-wrapper ${errors.participants ? "error" : ""}`}>
                <button
                  className="counter-btn counter-btn-minus"
                  onClick={() => updateParticipants(-1)}
                  disabled={formData.participants <= 1}
                  aria-label="ลดจำนวน"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span className="counter-value">{formData.participants}</span>
                <button
                  className="counter-btn counter-btn-plus"
                  onClick={() => updateParticipants(1)}
                  disabled={formData.participants >= 42}
                  aria-label="เพิ่มจำนวน"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
              {errors.participants && (
                <span className="error-message">{errors.participants}</span>
              )}
            </label>

            {/* Additional Notes */}
            <label className="form-field">
              <p className="form-label">รายละเอียดเพิ่มเติม (ถ้ามี)</p>
              <textarea
                className="form-textarea"
                placeholder="ระบุอุปกรณ์ที่ต้องการเพิ่ม หรือหมายเหตุอื่นๆ"
                value={formData.additionalNotes}
                onChange={(e) =>
                  setFormData({ ...formData, additionalNotes: e.target.value })
                }
                rows={4}
              />
            </label>

            {/* Projector Toggle */}
            <div className="toggle-field">
              <div className="toggle-info">
                <span className="toggle-title">ต้องการโปรเจคเตอร์</span>
                <span className="toggle-subtitle">สาย HDMI และอุปกรณ์เชื่อมต่อ</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={formData.needProjector}
                  onChange={(e) =>
                    setFormData({ ...formData, needProjector: e.target.checked })
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="booking-footer">
        <div className="booking-summary">
          <span className="summary-label">ระยะเวลาจอง</span>
          <span className="summary-value">{calculateDuration()} ชม.</span>
        </div>
        <button
          className="btn-submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <span>{isSubmitting ? "กำลังจอง..." : "ยืนยันการจอง"}</span>
          {!isSubmitting && (
            <span className="material-symbols-outlined">arrow_forward</span>
          )}
        </button>
      </div>
    </div>
  );
}