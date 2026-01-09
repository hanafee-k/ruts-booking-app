import { redirect } from "next/navigation";

export default function RootPage() {
  // เมื่อเข้าหน้าแรก ให้ดีดไปที่หน้า Login ทันที
  redirect("/login");
}