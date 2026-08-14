import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://edpzalqhhsjlkoqnuyzc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkcHphbHFoaHNqbGtvcW51eXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTI1MzIsImV4cCI6MjA5OTY2ODUzMn0.3jp56LJI3t8sQYYqn324Ll1drf25hKyLcUegNlD4_6Q'
);

const templates = [
  { is_system: true, status_trigger: 'INTERESTED', type: 'EMAIL', name: 'Send Franchise Brochure', body: '<p>Hi [Name],</p><p>Thank you for your interest in the Convenio Mart Franchise. As discussed, please find the franchise brochure attached.</p><p>Let us know if you have any questions or when you\'re ready to proceed to the next step.</p><p>Best regards,<br>Convenio Mart Franchise Team</p>', attachment_url: '' },
  { is_system: true, status_trigger: 'READY_TO_PAY', type: 'EMAIL', name: 'Send Payment Details', body: '<p>Hi [Name],</p><p>The next step is to process the franchise fee payment. Please transfer the amount to the following account:</p><p><strong>Bank:</strong> State Bank of India<br><strong>A/c:</strong> 38472938475<br><strong>IFSC:</strong> SBIN0001234</p><p>Best regards,<br>Convenio Mart Franchise Team</p>', attachment_url: '' },
  { is_system: true, status_trigger: 'APPROVED', type: 'EMAIL', name: 'Welcome & Approval', body: '<p>Hi [Name],</p><p>Congratulations! Your payment has been verified and your franchise application is officially approved.</p><p>Welcome to the Convenio Mart family! Our onboarding team will contact you shortly regarding agreement signing and training.</p><p>Best regards,<br>Convenio Mart Franchise Team</p>', attachment_url: '' },
  { is_system: true, status_trigger: 'CALL_LATER', type: 'EMAIL', name: 'Schedule Call Back & Confirm', body: '<p>Hi [Name],</p><p>As per our discussion, we have scheduled a call back with you on <strong>[Date]</strong>. Please let us know if this time works best for you or if you need to adjust!</p><p>Best regards,<br>Convenio Mart Franchise Team</p>', attachment_url: '' },
  { is_system: true, status_trigger: 'NO_RESPONSE', type: 'EMAIL', name: 'Follow Up - No Response', body: '<p>Hi [Name],</p><p>We tried to reach you recently regarding the Convenio Mart franchise opportunity but couldn\'t connect. Are you still interested?</p><p>Let us know a good time to reach you.</p><p>Best regards,<br>Convenio Mart Franchise Team</p>', attachment_url: '' },
  { is_system: true, status_trigger: 'INTERESTED', type: 'WHATSAPP', name: 'Send Franchise Brochure', body: 'Hi [Name]! 👋 Thank you for your interest in Convenio Mart. We\'ve sent the franchise brochure to your email. Let us know when you\'re ready to proceed!', attachment_url: '' },
  { is_system: true, status_trigger: 'READY_TO_PAY', type: 'WHATSAPP', name: 'Send Payment Details', body: 'Hi [Name]! You are now ready to make the franchise payment. Please transfer the amount to:\nBank: State Bank of India\nA/c: 38472938475\nIFSC: SBIN0001234', attachment_url: '' },
  { is_system: true, status_trigger: 'APPROVED', type: 'WHATSAPP', name: 'Welcome & Approval', body: 'Congratulations [Name]! 🎉 Your payment is verified and your Convenio Mart franchise is APPROVED! Welcome to the family. Our onboarding team will call you shortly.', attachment_url: '' },
  { is_system: true, status_trigger: 'CALL_LATER', type: 'WHATSAPP', name: 'Schedule Call Back & Confirm', body: 'Hi [Name], as per our conversation, we have scheduled a call back with you on [Date]. Please let us know if this time works best for you or if you need to adjust! 🕒', attachment_url: '' },
  { is_system: true, status_trigger: 'NO_RESPONSE', type: 'WHATSAPP', name: 'Follow Up - No Response', body: 'Hi [Name], we tried to reach you recently regarding the Convenio Mart franchise opportunity but couldn\'t connect. Are you still interested? Let us know a good time to reach you. 📞', attachment_url: '' }
];

async function run() {
  const { data, error } = await supabase.from('templates').insert(templates).select();
  if (error) console.error(error);
  else console.log('Successfully seeded 10 templates', data.length);
}

run();
