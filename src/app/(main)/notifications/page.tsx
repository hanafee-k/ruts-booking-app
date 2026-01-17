"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/layout/BottomNav";
import "./notifications.css";

// Interface
interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  is_read: boolean;
  created_at: string;
}

// Helper Time Ago (เช่น "2 นาทีที่แล้ว")
const timeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "เมื่อสักครู่";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  return `${days} วันที่แล้ว`;
};

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Data
  useEffect(() => {
    const fetchNotifs = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (data) setNotifs(data as any);
      }
      setLoading(false);
    };

    fetchNotifs();
  }, [supabase]);

  // Mark all as read (เมื่อเข้ามาหน้านี้ 3 วิ ให้ถือว่าอ่านแล้ว)
  useEffect(() => {
    if (notifs.some(n => !n.is_read)) {
      const timer = setTimeout(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);
          
          // Update UI state local
          setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notifs, supabase]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return 'check_circle';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'notifications';
    }
  };

  return (
    <div className="notif-page">
      <header className="notif-header">
        <button className="btn-back" onClick={() => router.back()}>
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <div className="notif-title">
          <h1>การแจ้งเตือน</h1>
        </div>
      </header>

      <main className="notif-list">
        {loading ? (
          <div style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}>กำลังโหลด...</div>
        ) : notifs.length > 0 ? (
          notifs.map((item) => (
            <div key={item.id} className={`notif-card ${!item.is_read ? 'unread' : ''}`}>
              {!item.is_read && <div className="unread-dot"></div>}
              
              <div className={`notif-icon-box type-${item.type}`}>
                <span className="material-symbols-outlined">{getIcon(item.type)}</span>
              </div>
              
              <div className="notif-content">
                <div className="notif-head">
                  <h4>{item.title}</h4>
                  <span className="notif-time">{timeAgo(item.created_at)}</span>
                </div>
                <p className="notif-msg">{item.message}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <span className="material-symbols-outlined" style={{fontSize:48, marginBottom:12}}>notifications_off</span>
            <p>ยังไม่มีการแจ้งเตือนใหม่</p>
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
}