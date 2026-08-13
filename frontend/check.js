import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://edpzalqhhsjlkoqnuyzc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkcHphbHFoaHNqbGtvcW51eXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTI1MzIsImV4cCI6MjA5OTY2ODUzMn0.3jp56LJI3t8sQYYqn324Ll1drf25hKyLcUegNlD4_6Q'
);

async function run() {
  const { data } = await supabase.from('templates').select('*');
  console.log('Templates in DB:', data.length);
  data.forEach(t => console.log(t.type, t.name));
}

run();
