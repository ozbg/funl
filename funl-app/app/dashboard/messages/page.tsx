import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MessageDashboard } from '@/components/messaging/MessageDashboard';

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get business info
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!business) {
    redirect('/dashboard/settings'); // Redirect to complete profile
  }

  return <MessageDashboard businessId={business.id} />;
}