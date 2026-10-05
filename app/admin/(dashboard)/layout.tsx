import React from 'react';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let adminUser;
  try {
    adminUser = await requireAdmin();
  } catch {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#0F1B2D] flex flex-col md:flex-row antialiased">
      {/* Sidebar (Desktop fixed 260px, Mobile Drawer) */}
      <AdminSidebar currentEmail={adminUser.email} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader currentEmail={adminUser.email} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
