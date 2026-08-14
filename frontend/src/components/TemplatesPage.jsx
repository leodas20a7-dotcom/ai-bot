import React, { useState } from 'react';
import { Mail, MessageSquare, Plus, Save, Trash2, Edit2, FileText, X } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { saveTemplate, deleteTemplate } from '../lib/api';
import { useDialog } from './Dialog';
import { useTemplates } from '../context/TemplateContext';

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState('EMAIL'); // EMAIL or WHATSAPP
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const { templates, isLoading, refreshTemplates } = useTemplates();
  const { showToast, showConfirm } = useDialog();

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editingTemplate,
        isSystem: editingTemplate.is_system || editingTemplate.isSystem,
        statusTrigger: editingTemplate.status_trigger || editingTemplate.statusTrigger
      };
      
      await saveTemplate(payload);
      await refreshTemplates();
      
      setIsEditing(false);
      setEditingTemplate(null);
      showToast('Template saved successfully', 'success');
    } catch(err) {
      console.error(err);
      showToast('Failed to save template', 'error');
    }
  };

  const handleDelete = async (id) => {
    const templateToDelete = templates.find(t => t.id === id);
    if (templateToDelete?.is_system) {
      showToast('System templates cannot be deleted.', 'warning');
      return;
    }
    const ok = await showConfirm('Are you sure you want to delete this template?', {
      danger: true, confirmLabel: 'Yes, Delete'
    });
    if (ok) {
      try {
        await deleteTemplate(id);
        await refreshTemplates();
        showToast('Template deleted.', 'success');
      } catch(err) {
        console.error(err);
        showToast('Failed to delete template', 'error');
      }
    }
  };

  const handleInsertTag = (tag) => {
    setEditingTemplate({
      ...editingTemplate,
      body: editingTemplate.body + tag
    });
  };

  const filteredTemplates = templates.filter(t => t.type === activeTab);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">Communication Templates</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Create and manage your one-click email and WhatsApp formats.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => {
              setEditingTemplate({ type: activeTab, name: '', body: '', attachment_url: '' });
              setIsEditing(true);
            }}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg w-full sm:w-auto shrink-0"
          >
            <Plus className="h-4 w-4" /> New Template
          </button>
        )}
      </div>

      {!isEditing ? (
        <>
          <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shrink-0 w-full sm:w-max">
            <button 
              onClick={() => setActiveTab('EMAIL')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold transition-colors ${activeTab === 'EMAIL' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Mail className="h-4 w-4" /> Email Formats
            </button>
            <button 
              onClick={() => setActiveTab('WHATSAPP')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold transition-colors border-l border-slate-100 ${activeTab === 'WHATSAPP' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <MessageSquare className="h-4 w-4" /> WhatsApp Formats
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.length > 0 ? filteredTemplates.map(template => (
              <div key={template.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{template.name}</h3>
                    {template.is_system && (
                      <span className="inline-block mt-1 bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                        System Trigger: {template.status_trigger}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingTemplate(template); setIsEditing(true); }} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {!template.is_system && (
                      <button onClick={() => handleDelete(template.id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 whitespace-pre-wrap flex-1 mb-4 font-mono overflow-hidden">
                  {template.type === 'EMAIL' ? (
                    <div dangerouslySetInnerHTML={{ __html: template.body.length > 150 ? template.body.substring(0, 150) + '...' : template.body }} />
                  ) : (
                    template.body.length > 150 ? template.body.substring(0, 150) + '...' : template.body
                  )}
                </div>

                {template.attachment_url && (
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg mt-auto">
                    <FileText className="h-4 w-4" /> Includes Document Attachment
                  </div>
                )}
              </div>
            )) : (
              <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-2xl border-dashed">
                <p className="text-slate-500 font-medium">No {activeTab.toLowerCase()} templates found. Create one to get started!</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-800">{editingTemplate.id ? 'Edit Template' : 'New Template'}</h2>
            <button onClick={() => { setIsEditing(false); setEditingTemplate(null); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSaveTemplate} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Template Type</label>
                <select 
                  value={editingTemplate.type}
                  onChange={(e) => setEditingTemplate({...editingTemplate, type: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl p-3 bg-slate-50 font-medium outline-none focus:border-red-500 focus:bg-white transition-colors"
                >
                  <option value="EMAIL">Email</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Short Heading / Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Send Franchise Brochure"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:border-red-500 transition-colors font-medium text-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between items-center">
                <span>Message Body</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {['[Name]', '[Location]', '[Investment_Capacity]', '[Admin_Name]', '[Date]'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertTag(tag)}
                    className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1 rounded-md transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
              {editingTemplate.type === 'EMAIL' ? (
                <div className="mb-4">
                  <ReactQuill 
                    theme="snow" 
                    value={editingTemplate.body} 
                    onChange={(content) => setEditingTemplate({...editingTemplate, body: content})}
                    className="bg-white rounded-xl overflow-hidden"
                  />
                </div>
              ) : (
                <textarea 
                  required
                  rows={8}
                  placeholder="Hi [Name],&#10;&#10;Here is the information you requested..."
                  value={editingTemplate.body}
                  onChange={(e) => setEditingTemplate({...editingTemplate, body: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:border-red-500 transition-colors font-mono text-sm text-slate-700"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Document URL (Optional)</label>
              <div className="flex items-center relative">
                <FileText className="absolute left-3 h-5 w-5 text-slate-400" />
                <input 
                  type="url" 
                  placeholder="https://link-to-your-pdf-brochure.com"
                  value={editingTemplate.attachment_url}
                  onChange={(e) => setEditingTemplate({...editingTemplate, attachment_url: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl p-3 pl-10 outline-none focus:border-red-500 transition-colors font-medium text-slate-700"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">If provided, this link will be automatically appended to the message.</p>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => { setIsEditing(false); setEditingTemplate(null); }}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md"
              >
                <Save className="h-4 w-4" /> Save Template
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
