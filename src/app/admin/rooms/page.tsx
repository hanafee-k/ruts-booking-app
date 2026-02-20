"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import "../admin.css";

interface Room {
    id: number;
    name: string;
    building: string;
    capacity: number;
    image_url: string;
    status: string; // 'active' | 'maintenance'
}

export default function AdminRoomsPage() {
    const supabase = createClient();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    // --- 1. ดึงข้อมูลห้อง ---
    const fetchRooms = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error("Error fetching rooms:", error);
        } else if (data) {
            setRooms(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    // --- 2. ฟังก์ชันลบห้อง ---
    const handleDelete = async (id: number) => {
        if (!confirm("⚠️ คุณแน่ใจหรือไม่ที่จะลบห้องนี้? ข้อมูลการจองทั้งหมดของห้องนี้จะหายไป")) return;

        const { error } = await supabase.from('rooms').delete().eq('id', id);

        if (error) {
            alert("ลบไม่สำเร็จ: " + error.message);
        } else {
            // ลบออกจาก State ทันที ไม่ต้องโหลดใหม่
            setRooms(prev => prev.filter(r => r.id !== id));
            alert("ลบห้องเรียบร้อยแล้ว");
        }
    };

    // แก้ไขฟังก์ชันนี้เพื่อดู Error
    const handleToggleStatus = async (room: Room) => {
        const newStatus = room.status === 'active' ? 'maintenance' : 'active';

        // ลอง log ดูค่าที่จะส่ง
        console.log("Updating room:", room.id, "to status:", newStatus);

        const { data, error } = await supabase
            .from('rooms')
            .update({ status: newStatus })
            .eq('id', room.id)
            .select(); // สำคัญ! ใส่ .select() เพื่อดูว่า Database ตอบกลับมาไหม

        if (error) {
            console.error("Supabase Error:", error); // 👈 ดูตรงนี้ใน Console (F12)
            alert("บันทึกไม่สำเร็จ: " + error.message);
        } else {
            console.log("Update Success:", data);
            // อัปเดตหน้าจอเมื่อชัวร์ว่า Database เปลี่ยนแล้ว
            setRooms(prev => prev.map(r => r.id === room.id ? { ...r, status: newStatus } : r));
        }
    };

    return (
        <div style={{ paddingBottom: 100 }}>
            {/* Header */}
            <div className="page-header"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center', 
                    gap: '16px', 
                    marginBottom: '24px'
                }}
            >
                {/* ฝั่งซ้าย: ข้อความ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', whiteSpace: 'nowrap', lineHeight: '1.2' }}>
                        จัดการห้อง
                    </h1>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
                        ห้องทั้งหมด {rooms.length} ห้อง
                    </span>
                </div>

                {/* ฝั่งขวา: ปุ่ม */}
                <Link
                    href="/admin/rooms/create"
                    className="btn-primary"
                    style={{
                        display: 'flex',
                        alignItems: 'center', 
                        gap: '8px', 
                        textDecoration: 'none',
                        padding: '10px 20px',
                        whiteSpace: 'nowrap',
                        height: 'fit-content', 
                        borderRadius: '8px'
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
                    <span>เพิ่มห้อง</span>
                </Link>
            </div>

            {/* Room List Cards */}
            <div className="room-list-container">
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i} className="room-card-skeleton"></div>)
                ) : rooms.length > 0 ? (
                    rooms.map((room) => (
                        <div key={room.id} className="room-card-item" style={{ opacity: room.status === 'maintenance' ? 0.85 : 1 }}>

                            {/* ส่วนรูปภาพ & Badge สถานะ */}
                            <div className="room-card-image">
                                <img
                                    src={room.image_url || "https://placehold.co/400x250?text=No+Image"}
                                    alt={room.name}
                                    style={{ filter: room.status === 'maintenance' ? 'grayscale(100%)' : 'none' }}
                                />
                                <span
                                    className={`status-badge ${room.status === 'active' ? 'approved' : 'rejected'}`}
                                    style={{
                                        position: 'absolute', top: 12, right: 12,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    {room.status === 'active' ? 'พร้อมใช้งาน' : 'ปิดปรับปรุง'}
                                </span>
                            </div>

                            {/* ส่วนเนื้อหา */}
                            <div className="room-card-content">
                                <h3 className="room-card-title">{room.name}</h3>

                                <div className="room-card-info">
                                    <div className="info-item">
                                        <span className="material-symbols-outlined icon">apartment</span>
                                        <span>{room.building}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="material-symbols-outlined icon">group</span>
                                        <span>{room.capacity} ที่นั่ง</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="room-card-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>

                                    {/* 1. ปุ่มแก้ไข (ลิงก์ไปหน้า Edit) */}
                                    <Link href={`/admin/rooms/${room.id}`} style={{ textDecoration: 'none' }}>
                                        <button className="btn-action-card edit" style={{ width: '100%', justifyContent: 'center' }}>
                                            <span className="material-symbols-outlined">edit</span> แก้ไข
                                        </button>
                                    </Link>

                                    {/* 2. ปุ่มสลับสถานะ (Quick Toggle) */}
                                    <button
                                        className="btn-action-card"
                                        onClick={() => handleToggleStatus(room)}
                                        style={{
                                            backgroundColor: room.status === 'active' ? '#fff7ed' : '#dcfce7',
                                            color: room.status === 'active' ? '#c2410c' : '#15803d',
                                            border: `1px solid ${room.status === 'active' ? '#ffedd5' : '#bbf7d0'}`,
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <span className="material-symbols-outlined">
                                            {room.status === 'active' ? 'block' : 'check_circle'}
                                        </span>
                                        {room.status === 'active' ? 'ปิดห้อง' : 'เปิดห้อง'}
                                    </button>

                                    {/* 3. ปุ่มลบ */}
                                    <button
                                        className="btn-action-card delete"
                                        onClick={() => handleDelete(room.id)}
                                        style={{ width: 'auto', padding: '0 12px' }}
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-sub)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 8 }}>meeting_room</span>
                        <p>ยังไม่มีข้อมูลห้องในระบบ</p>
                    </div>
                )}
            </div>
        </div>
    );
}