const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uvpdoadafkkywirjblsb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cGRvYWRhZmtreXdpcmpibHNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNDAxMTAsImV4cCI6MjEwNDcxNjExMH0.9gJXa-NCPXW1LObVNiJRQomG3kS4RQC228wgkVn1Ong';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { error } = await supabase
    .from('reports')
    .update({ status: 'Pending' })
    .eq('status', 'In Progress');
    
  if (error) console.error(error);
  else console.log('Updated reports to Pending');
}
run();
