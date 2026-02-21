"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import "../admin.css";

// 1. Import Library PDF & Graph
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function AdminDashboard() {
  const supabase = createClient();
  
  // State ข้อมูลดิบ
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State ตัวเลขสรุป
  const [stats, setStats] = useState({
    pending: 0, 
    approved: 0,
    totalUsers: 0,
    peakTime: "-"
  });

  // Graph Filter
  const [graphFilter, setGraphFilter] = useState({
    start: "",
    end: ""
  });

  // 🌟 State สำหรับ Filter ห้องยอดฮิต
  const [topRoomFilter, setTopRoomFilter] = useState("month"); // 'month' | 'all'

  // Modal Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDate, setExportDate] = useState({ start: "", end: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, title, start_time, end_time, status, rooms(name), profiles(full_name, student_id)')
      .order('start_time', { ascending: false });

    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (bookings) {
      setAllBookings(bookings);

      const pending = bookings.filter(b => b.status === 'pending').length;
      const approved = bookings.filter(b => b.status === 'approved').length;
      
      const times = bookings.map(b => b.start_time.split('T')[1]?.substring(0,2));
      const mode = times.sort((a,b) => times.filter(v => v===a).length - times.filter(v => v===b).length).pop();

      setStats({ 
        pending, 
        approved, 
        totalUsers: userCount || 0,
        peakTime: mode ? `${mode}:00` : "-" 
      });
    }
    setLoading(false);
  };

  // 📊 Logic สร้างข้อมูลกราฟเส้น
  const graphData = useMemo(() => {
    if (allBookings.length === 0) return [];

    const dataMap = new Map<string, number>();
    
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    let endDate = new Date();

    if (graphFilter.start) startDate = new Date(graphFilter.start);
    if (graphFilter.end) endDate = new Date(graphFilter.end);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dataMap.set(dateStr, 0);
    }

    allBookings.forEach(b => {
        const dateStr = b.start_time.split('T')[0];
        if (dataMap.has(dateStr)) {
            dataMap.set(dateStr, (dataMap.get(dateStr) || 0) + 1);
        }
    });

    return Array.from(dataMap.entries()).map(([date, count]) => ({
        name: new Date(date).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' }),
        fullDate: date,
        bookings: count
    }));

  }, [allBookings, graphFilter]);

  // 🌟 Logic คำนวณ "ห้องยอดฮิต"
  const topRoomsData = useMemo(() => {
    if (allBookings.length === 0) return [];

    let filtered = allBookings;
    
    // กรองตามเดือนนี้ (ถ้าเลือก Filter 'month')
    if (topRoomFilter === 'month') {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      filtered = allBookings.filter(b => {
        const d = new Date(b.start_time);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    }

    // นับจำนวนการจองแต่ละห้อง
    const roomMap = new Map();
    filtered.forEach(b => {
      if (b.status === 'cancelled') return; // ไม่นับคิวที่ยกเลิก
      const roomName = b.rooms?.name || "ไม่ระบุห้อง";
      roomMap.set(roomName, (roomMap.get(roomName) || 0) + 1);
    });

    // เรียงลำดับจากมากไปน้อย และดึงมาแค่ 5 อันดับแรก
    const sorted = Array.from(roomMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // หาค่ามากสุดเพื่อเอาไปทำ % ความยาวของหลอดกราฟ
    const maxCount = sorted.length > 0 ? sorted[0].count : 1;

    return sorted.map(item => ({
      ...item,
      percentage: (item.count / maxCount) * 100
    }));

  }, [allBookings, topRoomFilter]);

  // Helper Filter Export
  const getFilteredExportData = () => {
    let data = [...allBookings];
    if (exportDate.start) data = data.filter(b => b.start_time >= `${exportDate.start}T00:00:00`);
    if (exportDate.end) data = data.filter(b => b.start_time <= `${exportDate.end}T23:59:59`);
    return data;
  };

  const handleExportCSV = () => {
    const bookings = getFilteredExportData();
    if (bookings.length === 0) return alert("ไม่พบข้อมูล");
    
    let csvContent = "\uFEFFID,Room,User,Student ID,Date,Time,Status,Purpose\n";
    bookings.forEach((b: any) => {
      csvContent += [
        b.id, b.rooms?.name || "-", b.profiles?.full_name || "-", `"${b.profiles?.student_id || "-"}"`,
        new Date(b.start_time).toLocaleDateString('th-TH'),
        `${new Date(b.start_time).toLocaleTimeString('th-TH')} - ${new Date(b.end_time).toLocaleTimeString('th-TH')}`,
        b.status, `"${b.title || ""}"`
      ].join(",") + "\r\n";
    });

    const link = document.createElement("a");
    link.href = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    link.download = `report_${exportDate.start || 'all'}.csv`;
    link.click();
    setShowExportModal(false);
  };

  const handleExportPDF = () => {
    const bookings = getFilteredExportData();
    if (bookings.length === 0) return alert("ไม่พบข้อมูล");

    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Booking Report", 14, 22);
    doc.setFontSize(11); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    const rows = bookings.map((b: any) => [
      b.id, b.rooms?.name || "-", b.profiles?.full_name || "-",
      new Date(b.start_time).toLocaleDateString('th-TH'),
      new Date(b.start_time).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'}),
      b.status
    ]);

    autoTable(doc, {
      head: [["ID", "Room", "User", "Date", "Time", "Status"]],
      body: rows, startY: 40,
      headStyles: { fillColor: [0, 40, 85] },
    });
    doc.save(`report_${exportDate.start || 'all'}.pdf`);
    setShowExportModal(false);
  };

  return (
    <div style={{position: 'relative', paddingBottom: 100, overflowX: 'hidden'}}>
      
      {/* Header */}
      <div className="page-header">
        <div>
           <h1>ภาพรวมระบบ</h1>
           <span style={{fontSize:'0.85rem', color:'var(--text-sub)'}}>Admin Dashboard</span>
        </div>
        <button className="btn-action" style={{width:'auto', padding:'8px 12px', background:'var(--ruts-navy)', color:'white', gap:6}} onClick={() => { setExportDate({start:'', end:''}); setShowExportModal(true); }}>
           <span className="material-symbols-outlined" style={{fontSize:18}}>download</span>
           <span style={{fontSize:'0.75rem', fontWeight:600}}>Export</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'24px'}}>
        <Link href="/admin/bookings" className="table-card" style={{padding:'16px', display:'flex', flexDirection:'column', borderLeft:'4px solid var(--orange)', textDecoration:'none'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
             <span style={{fontSize:'0.75rem', color:'var(--text-sub)', fontWeight:600}}>รออนุมัติ</span>
             <span className="material-symbols-outlined" style={{fontSize:20, color:'var(--orange)'}}>pending_actions</span>
          </div>
          <div style={{fontSize:'1.75rem', fontWeight:800, color:'var(--text-main)'}}>{stats.pending}</div>
        </Link>
        <div className="table-card" style={{padding:'16px', display:'flex', flexDirection:'column', borderLeft:'4px solid var(--red)'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
             <span style={{fontSize:'0.75rem', color:'var(--text-sub)', fontWeight:600}}>ช่วงคนเยอะสุด</span>
             <span className="material-symbols-outlined" style={{fontSize:20, color:'var(--red)'}}>access_time_filled</span>
          </div>
          <div style={{fontSize:'1.75rem', fontWeight:800, color:'var(--text-main)'}}>{stats.peakTime}</div>
        </div>
      </div>

      {/* SECTION กราฟ */}
      <div className="table-card" style={{padding:'20px', marginBottom:'24px', overflow:'hidden'}}>
         <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', flexWrap:'wrap', gap:8}}>
            <h3 style={{fontSize:'1rem', fontWeight:700, color:'var(--ruts-navy)', margin:0}}>สถิติการใช้งาน</h3>
            
            <div style={{display:'flex', gap:6, background:'#f1f5f9', padding:4, borderRadius:8, maxWidth:'100%', overflowX:'auto'}}>
                <input 
                    type="date" 
                    className="form-input" 
                    style={{padding:'4px 8px', fontSize:'0.75rem', height:30, width: 105, minWidth:100}} 
                    value={graphFilter.start}
                    onChange={(e) => setGraphFilter({...graphFilter, start: e.target.value})}
                />
                <span style={{alignSelf:'center', fontSize:12}}>-</span>
                <input 
                    type="date" 
                    className="form-input" 
                    style={{padding:'4px 8px', fontSize:'0.75rem', height:30, width: 105, minWidth:100}}
                    value={graphFilter.end}
                    onChange={(e) => setGraphFilter({...graphFilter, end: e.target.value})}
                />
            </div>
         </div>
         
         <div style={{width: '100%', height: 200, marginLeft: -10}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFB81C" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FFB81C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748b'}} 
                    interval="preserveStartEnd"
                />
                <YAxis hide />
                <Tooltip 
                    contentStyle={{borderRadius:8, border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}
                    itemStyle={{color:'#002855', fontWeight:700}}
                />
                <Area 
                    type="monotone" 
                    dataKey="bookings" 
                    stroke="#F59E0B" 
                    fillOpacity={1} 
                    fill="url(#colorBookings)" 
                    strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* 🌟 SECTION ใหม่: ห้องยอดฮิต (Leaderboard) */}
      <div className="table-card" style={{padding:'20px', marginBottom:'24px'}}>
         <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
            <h3 style={{fontSize:'1rem', fontWeight:700, color:'var(--ruts-navy)', margin:0}}>
               <span className="material-symbols-outlined" style={{fontSize: 20, verticalAlign: 'middle', marginRight: 6, color: 'var(--orange)'}}>emoji_events</span>
               ห้องที่ถูกจองมากที่สุด
            </h3>
            
            {/* Dropdown เลือก เดือนนี้ vs ทั้งหมด */}
            <select 
              className="form-select" 
              style={{padding:'4px 8px', width:'auto', fontSize:'0.75rem', borderRadius:'8px'}}
              value={topRoomFilter}
              onChange={(e) => setTopRoomFilter(e.target.value)}
            >
              <option value="month">เดือนนี้</option>
              <option value="all">ทั้งหมด (All Time)</option>
            </select>
         </div>

         <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
           {topRoomsData.length > 0 ? (
             topRoomsData.map((room, index) => (
               <div key={room.name} style={{display:'flex', alignItems:'center', gap:'12px'}}>
                  {/* กล่องตัวเลขลำดับ 1, 2, 3... */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: index === 0 ? '#FFB81C' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : '#f1f5f9', 
                    color: index < 3 ? 'white' : '#64748b', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: '0.85rem', fontWeight: 800
                  }}>
                    {index + 1}
                  </div>
                  
                  {/* แถบกราฟแนวนอน */}
                  <div style={{flex: 1}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                      <span style={{fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)'}}>{room.name}</span>
                      <span style={{fontSize: '0.8rem', fontWeight: 700, color: 'var(--ruts-navy)'}}>{room.count} ครั้ง</span>
                    </div>
                    <div style={{height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden'}}>
                      <div style={{
                        height: '100%', 
                        background: index === 0 ? 'var(--ruts-navy)' : 'var(--blue)', 
                        width: `${room.percentage}%`, 
                        borderRadius: 4, 
                        transition: 'width 0.5s ease'
                      }}></div>
                    </div>
                  </div>
               </div>
             ))
           ) : (
             <div style={{textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.85rem', background: '#f8fafc', borderRadius: '12px'}}>
               <span className="material-symbols-outlined" style={{fontSize: 32, marginBottom: 8, opacity: 0.5}}>event_busy</span>
               <br/>ไม่มีข้อมูลการจองในหมวดหมู่นี้
             </div>
           )}
         </div>
      </div>

      {/* Quick Actions */}
      <h3 style={{fontSize:'1rem', fontWeight:700, color:'var(--ruts-navy)', marginBottom:'12px'}}>จัดการด่วน</h3>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
          <Link href="/admin/bookings" className="table-card" style={{padding:'16px', display:'flex', alignItems:'center', gap:'12px', textDecoration:'none'}}>
              <div style={{width:40, height:40, borderRadius:8, background:'#e0f2fe', color:'var(--blue)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                  <span className="material-symbols-outlined">event_available</span>
              </div>
              <div style={{fontSize:'0.85rem', fontWeight:700}}>อนุมัติจอง</div>
          </Link>
          <Link href="/admin/rooms" className="table-card" style={{padding:'16px', display:'flex', alignItems:'center', gap:'12px', textDecoration:'none'}}>
              <div style={{width:40, height:40, borderRadius:8, background:'#fff7ed', color:'var(--orange)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                  <span className="material-symbols-outlined">meeting_room</span>
              </div>
              <div style={{fontSize:'0.85rem', fontWeight:700}}>จัดการห้อง</div>
          </Link>
          <Link href="/admin/users" className="table-card" style={{padding:'16px', display:'flex', alignItems:'center', gap:'12px', textDecoration:'none'}}>
              <div style={{width:40, height:40, borderRadius:8, background:'#fef2f2', color:'var(--red)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                  <span className="material-symbols-outlined">person_off</span>
              </div>
              <div style={{fontSize:'0.85rem', fontWeight:700}}>ผู้ใช้งาน</div>
          </Link>
      </div>

      {/* MODAL Export */}
      {showExportModal && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
            <div style={{background:'white', borderRadius:16, padding:24, width:'100%', maxWidth:340, display:'flex', flexDirection:'column', gap:16, boxShadow:'0 10px 25px rgba(0,0,0,0.2)'}}>
                <h3 style={{textAlign:'center', fontWeight:700, margin:0}}>ออกรายงาน (Export)</h3>
                
                <div style={{display:'flex', flexDirection:'column', gap:12}}>
                    <div style={{display:'flex', flexDirection:'column', gap:4}}>
                        <label style={{fontSize:'0.8rem', color:'#64748b'}}>ตั้งแต่วันที่</label>
                        <input type="date" className="form-input" style={{width:'100%'}} value={exportDate.start} onChange={e => setExportDate({...exportDate, start: e.target.value})} />
                    </div>
                    <div style={{display:'flex', flexDirection:'column', gap:4}}>
                        <label style={{fontSize:'0.8rem', color:'#64748b'}}>ถึงวันที่</label>
                        <input type="date" className="form-input" style={{width:'100%'}} value={exportDate.end} onChange={e => setExportDate({...exportDate, end: e.target.value})} />
                    </div>
                </div>

                <div style={{display:'flex', flexDirection:'column', gap:8, marginTop:8}}>
                    <button onClick={handleExportCSV} style={{padding:14, borderRadius:12, background:'#f0fdf4', border:'1px solid #dcfce7', display:'flex', gap:12, color:'#166534', alignItems:'center', width:'100%'}}>
                        <span className="material-symbols-outlined">table_view</span> <b>Excel (CSV)</b>
                    </button>
                    <button onClick={handleExportPDF} style={{padding:14, borderRadius:12, background:'#fff7ed', border:'1px solid #ffedd5', display:'flex', gap:12, color:'#9a3412', alignItems:'center', width:'100%'}}>
                        <span className="material-symbols-outlined">picture_as_pdf</span> <b>PDF Document</b>
                    </button>
                </div>
                
                <button onClick={() => setShowExportModal(false)} style={{padding:12, color:'#64748b', fontWeight:600, width:'100%'}}>ยกเลิก</button>
            </div>
        </div>
      )}
    </div>
  );
}