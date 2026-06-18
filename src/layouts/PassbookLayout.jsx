import { Outlet } from 'react-router-dom';

export default function PassbookLayout() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50">
      {/* Minimal Header for Branch Staff */}
      <header className="w-full bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl text-blue-900">Aarthika Internal</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">BRANCH PORTAL</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span>Staff ID: OP-492</span>
          <button className="text-red-600 font-medium hover:underline">Secure Logout</button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow w-full max-w-7xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
