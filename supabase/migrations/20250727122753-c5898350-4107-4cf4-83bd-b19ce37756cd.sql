-- Create custom user profiles table for additional user information
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Male', 'Female')),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  family_category TEXT CHECK (family_category IN ('Joseph Family', 'Daniel Family', 'Isaac Family', 'David Family', 'Ezra Family')),
  family_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Père', 'Mère', 'Youth Committee', 'Pastor')),
  access_code TEXT NOT NULL CHECK (LENGTH(access_code) = 4),
  bio TEXT,
  profile_picture TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create family members table
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  dob DATE,
  contact TEXT,
  gender TEXT CHECK (gender IN ('Male', 'Female')),
  education TEXT,
  employment TEXT,
  bcc_class TEXT,
  grad_year INTEGER,
  grad_mode TEXT,
  parental_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create spiritual activities table
CREATE TABLE public.spiritual_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'Planned' CHECK (status IN ('Planned', 'Ongoing', 'Completed', 'Cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create social activities table
CREATE TABLE public.social_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'Planned' CHECK (status IN ('Planned', 'Ongoing', 'Completed', 'Cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table for file storage
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for real-time communication
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create delegated access table
CREATE TABLE public.delegated_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  can_submit_reports BOOLEAN DEFAULT FALSE,
  can_view_analytics BOOLEAN DEFAULT FALSE,
  can_manage_calendar BOOLEAN DEFAULT FALSE,
  granted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_group TEXT CHECK (target_group IN ('All', 'Young', 'Mature', 'Committee', 'Parents')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calendar events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  event_type TEXT CHECK (event_type IN ('Spiritual', 'Social', 'Meeting', 'Training')),
  target_group TEXT CHECK (target_group IN ('All', 'Young', 'Mature', 'Committee', 'Parents')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('Program', 'Leadership', 'Communication', 'General')),
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recommendations table
CREATE TABLE public.recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prayer chain schedule table
CREATE TABLE public.prayer_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_category TEXT NOT NULL CHECK (family_category IN ('Joseph Family', 'Daniel Family', 'Isaac Family', 'David Family', 'Ezra Family')),
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spiritual_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegated_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_schedule ENABLE ROW LEVEL SECURITY;

-- Create function to get current user profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS public.users AS $$
  SELECT * FROM public.users WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spiritual_activities_updated_at
  BEFORE UPDATE ON public.spiritual_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_activities_updated_at
  BEFORE UPDATE ON public.social_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delegated_access_updated_at
  BEFORE UPDATE ON public.delegated_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at
  BEFORE UPDATE ON public.recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prayer_schedule_updated_at
  BEFORE UPDATE ON public.prayer_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS POLICIES

-- Users table policies
CREATE POLICY "Admin can view all users" 
  ON public.users FOR SELECT 
  USING (public.get_current_user_role() = 'Admin');

CREATE POLICY "Users can view their own profile" 
  ON public.users FOR SELECT 
  USING (auth_user_id = auth.uid());

CREATE POLICY "Parents can view family members" 
  ON public.users FOR SELECT 
  USING (
    public.get_current_user_role() IN ('Père', 'Mère') 
    AND family_category = (SELECT family_category FROM public.users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Youth Committee and Pastor can view aggregate data" 
  ON public.users FOR SELECT 
  USING (public.get_current_user_role() IN ('Youth Committee', 'Pastor'));

CREATE POLICY "Admin can insert users" 
  ON public.users FOR INSERT 
  WITH CHECK (public.get_current_user_role() = 'Admin');

CREATE POLICY "Admin can update users" 
  ON public.users FOR UPDATE 
  USING (public.get_current_user_role() = 'Admin');

CREATE POLICY "Users can update their own profile" 
  ON public.users FOR UPDATE 
  USING (auth_user_id = auth.uid());

-- Family members policies
CREATE POLICY "Parents can manage their family members" 
  ON public.family_members FOR ALL 
  USING (
    family_id IN (
      SELECT id FROM public.users 
      WHERE auth_user_id = auth.uid() 
      OR (family_category = (SELECT family_category FROM public.users WHERE auth_user_id = auth.uid()) 
          AND public.get_current_user_role() IN ('Père', 'Mère'))
    )
  );

CREATE POLICY "Admin can view all family members" 
  ON public.family_members FOR SELECT 
  USING (public.get_current_user_role() = 'Admin');

CREATE POLICY "Youth Committee and Pastor can view family statistics" 
  ON public.family_members FOR SELECT 
  USING (public.get_current_user_role() IN ('Youth Committee', 'Pastor'));

-- Activities policies (spiritual and social)
CREATE POLICY "Family can manage their activities" 
  ON public.spiritual_activities FOR ALL 
  USING (
    family_id IN (
      SELECT id FROM public.users 
      WHERE auth_user_id = auth.uid() 
      OR (family_category = (SELECT family_category FROM public.users WHERE auth_user_id = auth.uid()) 
          AND public.get_current_user_role() IN ('Père', 'Mère'))
    )
  );

CREATE POLICY "Family can manage their social activities" 
  ON public.social_activities FOR ALL 
  USING (
    family_id IN (
      SELECT id FROM public.users 
      WHERE auth_user_id = auth.uid() 
      OR (family_category = (SELECT family_category FROM public.users WHERE auth_user_id = auth.uid()) 
          AND public.get_current_user_role() IN ('Père', 'Mère'))
    )
  );

CREATE POLICY "Youth Committee and Pastor can view all activities" 
  ON public.spiritual_activities FOR SELECT 
  USING (public.get_current_user_role() IN ('Youth Committee', 'Pastor'));

CREATE POLICY "Youth Committee and Pastor can view all social activities" 
  ON public.social_activities FOR SELECT 
  USING (public.get_current_user_role() IN ('Youth Committee', 'Pastor'));

-- Documents policies
CREATE POLICY "Family can manage their documents" 
  ON public.documents FOR ALL 
  USING (
    family_id IN (
      SELECT id FROM public.users 
      WHERE auth_user_id = auth.uid() 
      OR (family_category = (SELECT family_category FROM public.users WHERE auth_user_id = auth.uid()) 
          AND public.get_current_user_role() IN ('Père', 'Mère'))
    )
  );

CREATE POLICY "Admin can view all documents" 
  ON public.documents FOR SELECT 
  USING (public.get_current_user_role() = 'Admin');

-- Messages policies
CREATE POLICY "Users can view their messages" 
  ON public.messages FOR SELECT 
  USING (sender_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) 
         OR receiver_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can send messages" 
  ON public.messages FOR INSERT 
  WITH CHECK (sender_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their received messages" 
  ON public.messages FOR UPDATE 
  USING (receiver_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Announcements policies
CREATE POLICY "Committee and above can manage announcements" 
  ON public.announcements FOR ALL 
  USING (public.get_current_user_role() IN ('Admin', 'Youth Committee', 'Pastor'));

CREATE POLICY "All users can view relevant announcements" 
  ON public.announcements FOR SELECT 
  USING (
    target_group = 'All' 
    OR (target_group = 'Parents' AND public.get_current_user_role() IN ('Père', 'Mère'))
    OR (target_group = 'Committee' AND public.get_current_user_role() IN ('Youth Committee', 'Pastor'))
    OR target_group = 'Young' 
    OR target_group = 'Mature'
  );

-- Calendar events policies
CREATE POLICY "Committee and above can manage calendar" 
  ON public.calendar_events FOR ALL 
  USING (public.get_current_user_role() IN ('Admin', 'Youth Committee', 'Pastor'));

CREATE POLICY "All users can view relevant events" 
  ON public.calendar_events FOR SELECT 
  USING (
    target_group = 'All' 
    OR (target_group = 'Parents' AND public.get_current_user_role() IN ('Père', 'Mère'))
    OR (target_group = 'Committee' AND public.get_current_user_role() IN ('Youth Committee', 'Pastor'))
    OR target_group = 'Young' 
    OR target_group = 'Mature'
  );

-- Feedback policies
CREATE POLICY "Users can submit feedback" 
  ON public.feedback FOR INSERT 
  WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view their own feedback" 
  ON public.feedback FOR SELECT 
  USING (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Committee and above can view all feedback" 
  ON public.feedback FOR SELECT 
  USING (public.get_current_user_role() IN ('Admin', 'Youth Committee', 'Pastor'));

-- Recommendations policies
CREATE POLICY "Pastor can manage all recommendations" 
  ON public.recommendations FOR ALL 
  USING (public.get_current_user_role() = 'Pastor');

CREATE POLICY "Families can view their recommendations" 
  ON public.recommendations FOR SELECT 
  USING (
    family_id IN (
      SELECT id FROM public.users 
      WHERE auth_user_id = auth.uid() 
      OR (family_category = (SELECT family_category FROM public.users WHERE auth_user_id = auth.uid()) 
          AND public.get_current_user_role() IN ('Père', 'Mère'))
    )
  );

-- Prayer schedule policies
CREATE POLICY "Admin and Pastor can manage prayer schedule" 
  ON public.prayer_schedule FOR ALL 
  USING (public.get_current_user_role() IN ('Admin', 'Pastor'));

CREATE POLICY "All users can view prayer schedule" 
  ON public.prayer_schedule FOR SELECT 
  USING (true);

-- Create storage buckets for documents and files
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('documents', 'documents', false),
  ('reports', 'reports', false),
  ('profiles', 'profiles', true);

-- Storage policies for documents bucket
CREATE POLICY "Families can upload their documents" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Families can view their documents" 
  ON storage.objects FOR SELECT 
  USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admin can view all documents" 
  ON storage.objects FOR SELECT 
  USING (
    bucket_id = 'documents' 
    AND public.get_current_user_role() = 'Admin'
  );

-- Storage policies for reports bucket
CREATE POLICY "Families can upload reports" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Families can view their reports" 
  ON storage.objects FOR SELECT 
  USING (
    bucket_id = 'reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Committee and above can view all reports" 
  ON storage.objects FOR SELECT 
  USING (
    bucket_id = 'reports' 
    AND public.get_current_user_role() IN ('Admin', 'Youth Committee', 'Pastor')
  );

-- Storage policies for profiles bucket (public)
CREATE POLICY "Users can upload their profile pictures" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'profiles' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Profile pictures are publicly viewable" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'profiles');

-- Insert default prayer schedule
INSERT INTO public.prayer_schedule (family_category, day_of_week, start_time, end_time) VALUES
  ('Joseph Family', 'Monday', '12:00:00', '14:00:00'),
  ('Joseph Family', 'Monday', '18:00:00', '19:00:00'),
  ('Daniel Family', 'Tuesday', '12:00:00', '14:00:00'),
  ('Daniel Family', 'Tuesday', '18:00:00', '19:00:00'),
  ('Isaac Family', 'Wednesday', '12:00:00', '14:00:00'),
  ('Isaac Family', 'Wednesday', '18:00:00', '19:00:00'),
  ('David Family', 'Thursday', '12:00:00', '14:00:00'),
  ('David Family', 'Thursday', '18:00:00', '19:00:00'),
  ('Ezra Family', 'Friday', '12:00:00', '14:00:00'),
  ('Ezra Family', 'Friday', '18:00:00', '19:00:00');

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spiritual_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recommendations;