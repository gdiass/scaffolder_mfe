import { Outlet } from 'react-router-dom';


export function AuthLayout() {

  return (
    <div className="min-h-screen flex bg-canvas text-body font-sans antialiased">
      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page Content */}
        <main id="main-container" className="flex-1 container mx-auto max-w-6xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
