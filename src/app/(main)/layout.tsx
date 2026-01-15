import BottomNav from "@/components/layout/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ✅ จุดสำคัญ 1: ต้องใส่ className="main-container" 
    // เพื่อให้มันไปดึงค่า max-width: 480px มาจาก globals.css
    <div className="main-container">
      
      {/* ✅ จุดสำคัญ 2: ส่วนเนื้อหา (Children) 
         - minHeight: 100vh -> ให้พื้นหลังเต็มจอเสมอ
         - paddingBottom: 90px -> ดันเนื้อหาขึ้นหนีปุ่มเมนูล่าง
      */}
      <div style={{ minHeight: '100vh', paddingBottom: '90px' }}>
        {children}
      </div>

      {/* ปุ่มเมนูล่าง */}
      <BottomNav />
    </div>
  );
}