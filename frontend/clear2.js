import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://edpzalqhhsjlkoqnuyzc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkcHphbHFoaHNqbGtvcW51eXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTI1MzIsImV4cCI6MjA5OTY2ODUzMn0.3jp56LJI3t8sQYYqn324Ll1drf25hKyLcUegNlD4_6Q'
);

async function run() {
  const { data, error: selectError } = await supabase.from('templates').select('id');
  if (selectError) {
    console.error('Select error:', selectError);
    return;
  }
  
  const ids = data.map(d => d.id);
  console.log('Found IDs:', ids.length);
  
  for (const id of ids) {
    const { error: delError } = await supabase.from('templates').delete().eq('id', id);
    if (delError) console.error('Delete error:', delError);
  }
  
  console.log('Cleared all templates.');
}

run();
