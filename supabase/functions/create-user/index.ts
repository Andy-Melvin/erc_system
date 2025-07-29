import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  full_name: string;
  gender: 'Male' | 'Female';
  email: string;
  phone?: string;
  family_category?: string;
  family_name?: string;
  role: 'Admin' | 'Père' | 'Mère' | 'Youth Committee' | 'Pastor';
  bio?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '');
    
    try {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        throw new Error('Authentication failed');
      }

      // Check if user is admin
      const { data: userProfile, error: profileError } = await supabaseClient
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Failed to verify user profile');
      }

      if (!userProfile || userProfile.role !== 'Admin') {
        console.error('User role:', userProfile?.role);
        throw new Error('Unauthorized: Admin access required');
      }

      console.log('Admin verification successful for user:', user.id);
    } catch (error) {
      console.error('Authentication/authorization error:', error);
      throw error;
    }

    const userData: CreateUserRequest = await req.json();

    // Generate a 4-digit access code
    const accessCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Create auth user
    const tempPassword = `temp_${accessCode}_${Date.now()}`;
    const { data: authData, error: createAuthError } = await supabaseClient.auth.admin.createUser({
      email: userData.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role,
      }
    });

    if (createAuthError || !authData.user) {
      console.error('Auth creation error:', createAuthError);
      throw new Error('Failed to create authentication account');
    }

    // Insert user profile
    const { data: profileData, error: profileInsertError } = await supabaseClient
      .from('users')
      .insert({
        auth_user_id: authData.user.id,
        full_name: userData.full_name,
        gender: userData.gender,
        email: userData.email,
        phone: userData.phone,
        family_category: userData.family_category,
        family_name: userData.family_name,
        role: userData.role,
        access_code: accessCode,
        bio: userData.bio,
      })
      .select()
      .single();

    if (profileInsertError) {
      console.error('Profile creation error:', profileInsertError);
      // Clean up auth user if profile creation fails
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      throw new Error('Failed to create user profile');
    }

    console.log('User created successfully:', profileData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: profileData,
        access_code: accessCode,
        message: 'User created successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in create-user function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      }),
      {
        status: 400,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);