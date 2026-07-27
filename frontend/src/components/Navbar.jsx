import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/landing' || location.pathname === '/home';

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex-shrink-0 flex items-center">
            <img 
              src="/convenio%20mart%20logo.webp" 
              alt="Convenio Mart Logo" 
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </Link>
          <div>
            {isLandingPage ? (
              <Link
                to="/"
                className="inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all duration-200 whitespace-nowrap"
              >
                <span className="sm:hidden">Enquire Now</span>
                <span className="hidden sm:inline">Enquire your franchise</span>
              </Link>
            ) : (
              <Link 
                to="/landing" 
                className="inline-flex items-center justify-center px-4 py-2 sm:px-5 sm:py-2.5 text-slate-600 hover:text-red-600 font-bold transition-all bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md"
              >
                Home
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
