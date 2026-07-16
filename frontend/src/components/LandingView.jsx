import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, TrendingUp, ShieldCheck, Zap, ShoppingCart, ClipboardList, MessageCircle } from 'lucide-react';

export default function LandingView() {
  const features = [
    {
      icon: <TrendingUp className="h-6 w-6 text-red-500" />,
      title: "High Returns",
      description: "Estimated monthly revenue of ₹35,000 – ₹50,000 per store with a 70% profit share."
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-red-500" />,
      title: "Low Investment",
      description: "Minimum investment of ₹15-20 Lakhs. Up to 75% bank funding arranged."
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-red-500" />,
      title: "Guaranteed Footfall",
      description: "Built-in customer base in modern residential apartment complexes."
    },
    {
      icon: <Zap className="h-6 w-6 text-red-500" />,
      title: "Tech-Enabled",
      description: "Proprietary hyper-local app for instant room delivery and subscriptions."
    }
  ];

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-5rem)] md:h-[calc(100vh-5rem)] flex items-stretch justify-center p-4 sm:p-8 md:overflow-hidden">
      <div className="max-w-6xl w-full mx-auto bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row h-auto md:h-full">

        {/* Left Side */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-center items-center md:items-start gap-4 lg:gap-6 relative bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-slate-100 opacity-50"></div>

          <div className="relative z-10 w-full flex flex-col justify-center">
            <img
              src="/logo.jpeg"
              alt="Convenio Mart Store"
              className="w-full max-h-[30vh] lg:max-h-56 rounded-2xl shadow-xl object-cover border-4 border-white transform transition-transform hover:scale-[1.02] duration-300"
            />
          </div>

          <div className="relative z-10 w-full text-center md:text-left">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2 leading-tight">
              Convenio  <span className="text-red-600">Mart</span>
            </h1>
            <p className="text-sm lg:text-base text-slate-600">Premium Mini-Supermarket Franchise Opportunity</p>
          </div>


        </div>

        {/* Right Side */}
        <div className="w-full md:w-1/2 p-6 lg:p-12 flex flex-col justify-center items-center gap-4 lg:gap-6 bg-white overflow-hidden">

          <div className="w-full max-w-lg mb-2 lg:mb-4">
            <h2 className="text-xl lg:text-2xl font-extrabold text-slate-800 mb-4 text-center">Why Partner With Us?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-red-100 hover:shadow-sm transition-all duration-300">
                  <div className="bg-white p-1.5 rounded-full shadow-sm shrink-0">{feature.icon}</div>
                  <h3 className="font-bold text-slate-800 text-sm leading-tight">{feature.title}</h3>
                </div>
              ))}
            </div>
          </div>
          <Link
            to="/enquire"
            className="w-full max-w-sm flex items-center justify-center gap-3 px-8 py-5 text-center text-lg font-bold rounded-2xl text-white bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <ClipboardList className="h-6 w-6" />
            Apply Now
          </Link>

          <a
            href="https://wa.me/918072557159?text=Hi%20Convenio%20Mart,%20I%20am%20interested%20in%20franchise%20details."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-sm flex items-center justify-center gap-3 px-8 py-5 text-center text-lg font-bold rounded-2xl text-white bg-[#25D366] hover:bg-[#128C7E] shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <MessageCircle className="h-6 w-6" />
            Chat on WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}
