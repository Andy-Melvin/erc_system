-- Seed data for initial users
-- This file should be run after the migration to populate the database with test users

-- Insert initial users (without auth_user_id initially - will be created on first login)
INSERT INTO public.users (
  full_name,
  gender,
  email,
  phone,
  family_category,
  family_name,
  role,
  access_code,
  bio
) VALUES 
  -- Admin user
  (
    'System Administrator',
    'Male',
    'admin@church.com',
    '+1234567890',
    'Joseph Family',
    'Admin Family',
    'Admin',
    '1234',
    'System administrator with full access to all features'
  ),
  
  -- Pastor user
  (
    'Pastor John Smith',
    'Male',
    'pastor@church.com',
    '+1234567891',
    'Daniel Family',
    'Smith Family',
    'Pastor',
    '5678',
    'Senior pastor responsible for church oversight and spiritual guidance'
  ),
  
  -- Youth Committee member
  (
    'Youth Coordinator',
    'Female',
    'youth@church.com',
    '+1234567892',
    'Isaac Family',
    'Coordinator Family',
    'Youth Committee',
    '9012',
    'Youth committee coordinator managing youth activities and programs'
  ),
  
  -- Parent users
  (
    'Père Joseph',
    'Male',
    'pere.joseph@church.com',
    '+1234567893',
    'Joseph Family',
    'Joseph Family',
    'Père',
    '3456',
    'Father in the Joseph family, responsible for family coordination'
  ),
  
  (
    'Mère Marie',
    'Female',
    'mere.marie@church.com',
    '+1234567894',
    'David Family',
    'David Family',
    'Mère',
    '7890',
    'Mother in the David family, responsible for family coordination'
  ),
  
  -- Additional test users
  (
    'Père Daniel',
    'Male',
    'pere.daniel@church.com',
    '+1234567895',
    'Daniel Family',
    'Daniel Family',
    'Père',
    '2345',
    'Father in the Daniel family'
  ),
  
  (
    'Mère Sarah',
    'Female',
    'mere.sarah@church.com',
    '+1234567896',
    'Ezra Family',
    'Ezra Family',
    'Mère',
    '6789',
    'Mother in the Ezra family'
  ),
  
  (
    'Youth Leader',
    'Male',
    'youth.leader@church.com',
    '+1234567897',
    'Isaac Family',
    'Leader Family',
    'Youth Committee',
    '4567',
    'Youth leader assisting with committee activities'
  );

-- Insert some family members for testing
INSERT INTO public.family_members (
  family_id,
  name,
  dob,
  contact,
  gender,
  education,
  employment,
  bcc_class,
  grad_year,
  grad_mode,
  parental_status
) VALUES 
  (
    (SELECT id FROM public.users WHERE email = 'pere.joseph@church.com'),
    'Junior Joseph',
    '2010-05-15',
    '+1234567898',
    'Male',
    'High School',
    'Student',
    'Class A',
    2028,
    'Regular',
    'Living with parents'
  ),
  
  (
    (SELECT id FROM public.users WHERE email = 'mere.marie@church.com'),
    'Sophie David',
    '2008-03-22',
    '+1234567899',
    'Female',
    'High School',
    'Student',
    'Class B',
    2026,
    'Regular',
    'Living with parents'
  );

-- Insert some announcements
INSERT INTO public.announcements (
  title,
  content,
  target_group,
  created_by
) VALUES 
  (
    'Welcome to YouthTrack',
    'Welcome to our new youth coordination platform! This system will help us better organize and track our church youth activities.',
    'All',
    (SELECT id FROM public.users WHERE email = 'admin@church.com')
  ),
  
  (
    'Youth Meeting This Weekend',
    'We will have our monthly youth meeting this Saturday at 2 PM. All youth members are encouraged to attend.',
    'Young',
    (SELECT id FROM public.users WHERE email = 'youth@church.com')
  ),
  
  (
    'Parent-Teacher Conference',
    'Parent-teacher conferences will be held next week. Please check your email for scheduling details.',
    'Parents',
    (SELECT id FROM public.users WHERE email = 'pastor@church.com')
  );

-- Insert some calendar events
INSERT INTO public.calendar_events (
  title,
  description,
  start_date,
  end_date,
  event_type,
  target_group,
  created_by
) VALUES 
  (
    'Youth Bible Study',
    'Weekly Bible study session for youth members',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '2 hours',
    'Spiritual',
    'Young',
    (SELECT id FROM public.users WHERE email = 'youth@church.com')
  ),
  
  (
    'Family Picnic',
    'Annual family picnic at the church grounds',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days' + INTERVAL '4 hours',
    'Social',
    'All',
    (SELECT id FROM public.users WHERE email = 'admin@church.com')
  ),
  
  (
    'Committee Meeting',
    'Monthly youth committee planning meeting',
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '3 days' + INTERVAL '1 hour',
    'Meeting',
    'Committee',
    (SELECT id FROM public.users WHERE email = 'pastor@church.com')
  ); 