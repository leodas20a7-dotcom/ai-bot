import React, { useState } from 'react';
import { CheckCircle2, Send, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function FormView() {
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    city: '',
    message: ''
  });
  const [status, setStatus] = useState('');

  const features = [
    "Low Investment",
    "High Returns",
    "Complete Support",
    "Proven Business Model"
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([
          { 
            name: formData.fullName,
            mobile: formData.mobile,
            email: formData.email,
            city: formData.city,
            message: formData.message,
            source: 'Website Form'
          }
        ]);

      if (error) throw error;
      setStatus("success");
    } catch (error) {
      console.error("Error submitting lead:", error);
      setStatus("error");
      alert("Failed to submit. Please try again.");
    }
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-5rem)] flex items-stretch justify-center p-4 sm:p-8 relative">
      
      <div className="max-w-6xl w-full mx-auto bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row h-auto">
        
        {/* Left Side - Dark Panel */}
        <div className="hidden lg:flex w-5/12 bg-slate-900 text-white p-6 lg:p-8 flex-col justify-center relative overflow-hidden">
          {/* Background Overlay */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20"></div>
          
          <div className="relative z-10 w-full my-auto">
            <h1 className="text-3xl lg:text-4xl font-extrabold mb-4 leading-tight">
              Take the First Step Towards <span className="text-red-500">Ownership</span>
            </h1>
            <p className="text-base text-slate-300 mb-8">
              Fill the form and our team will get in touch with you.
            </p>

            <div className="grid grid-cols-1 gap-3">
              {features.map((feature, idx) => (
                <div key={idx} className="bg-slate-800 bg-opacity-50 p-3 rounded-xl border border-slate-700 flex items-center gap-3 backdrop-blur-sm">
                  <CheckCircle2 className="text-red-500 h-5 w-5 flex-shrink-0" />
                  <span className="font-semibold text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-7/12 bg-white px-6 py-6 lg:px-12 flex flex-col overflow-hidden">
        <div className="w-full max-w-2xl mx-auto my-auto">
          {status === 'success' ? (
            <div className="text-center p-6 bg-green-50 rounded-2xl border border-green-100">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-green-800 mb-2">Application Submitted!</h2>
              <p className="text-green-600 mb-4 text-sm">
                Thank you for your interest in Convenio Mart. Our franchise expert will contact you shortly.
              </p>
              <button 
                onClick={() => setStatus('')}
                className="text-green-700 font-bold hover:text-green-800 underline text-sm"
              >
                Submit another application
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    name="mobile"
                    required
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City / Location *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    placeholder="Chennai, Adyar"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message (Optional)</label>
                <textarea
                  name="message"
                  rows="2"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none"
                  placeholder="Tell us why you want to partner with us..."
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
              >
                {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
