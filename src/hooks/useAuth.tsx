/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  family_category?: string;
  family_name?: string;
  access_code: string;
  profile_picture?: string;
  bio?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signInWithAccessCode: (
    email: string,
    accessCode: string
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (session?.user) {
        // Try to fetch user profile by auth_user_id
        let userProfile, error;
        {
          const result = await supabase
            .from("users")
            .select("*")
            .eq("auth_user_id", session.user.id)
            .single();
          userProfile = result.data;
          error = result.error;
        }

        if (!userProfile) {
          // Fallback: try to find by email
          const { data: userByEmail, error: emailError } = await supabase
            .from("users")
            .select("*")
            .eq("email", session.user.email)
            .single();

          if (userByEmail) {
            await supabase
              .from("users")
              .update({ auth_user_id: session.user.id })
              .eq("id", userByEmail.id);

            // Fetch again by auth_user_id
            const { data: linkedProfile } = await supabase
              .from("users")
              .select("*")
              .eq("auth_user_id", session.user.id)
              .single();

            userProfile = linkedProfile;
          }
        }

        if (userProfile) {
          setUser({
            id: userProfile.id,
            email: userProfile.email,
            full_name: userProfile.full_name,
            role: userProfile.role,
            family_category: userProfile.family_category,
            family_name: userProfile.family_name,
            access_code: userProfile.access_code,
            profile_picture: userProfile.profile_picture,
            bio: userProfile.bio,
          });
        } else {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithAccessCode = async (email: string, accessCode: string) => {
    try {
      setLoading(true);

      // First, verify the access code exists in our users table
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("access_code", accessCode)
        .single();

      if (userError || !userRecord) {
        return { error: "Invalid email or access code" };
      }

      // Check if auth user exists, if not create one
      let authUserId = userRecord.auth_user_id;

      if (!authUserId) {
        // Create auth user with a consistent password based on access code
        const consistentPassword = `${accessCode}`;

        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email,
            password: consistentPassword,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                full_name: userRecord.full_name,
                role: userRecord.role,
              },
            },
          }
        );

        if (authError || !authData.user) {
          return { error: "Failed to create authentication account" };
        }

        authUserId = authData.user.id;

        // Update the users table with the auth_user_id
        const { error: updateError } = await supabase
          .from("users")
          .update({ auth_user_id: authUserId })
          .eq("id", userRecord.id);

        if (updateError) {
          console.error("Error linking auth user:", updateError);
        }

        // Sign in with the consistent password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: consistentPassword,
        });

        if (signInError) {
          return { error: "Authentication failed" };
        }
      } else {
        // User already has auth account, sign in with consistent password
        const consistentPassword = `${accessCode}`;

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: consistentPassword,
        });

        if (signInError) {
          // If sign in fails, the password might be different, try to update it
          try {
            const { error: adminError } =
              await supabase.auth.admin.updateUserById(authUserId, {
                password: consistentPassword,
              });

            if (!adminError) {
              const { error: retrySignInError } =
                await supabase.auth.signInWithPassword({
                  email,
                  password: consistentPassword,
                });

              if (retrySignInError) {
                return { error: "Authentication failed" };
              }
            } else {
              return { error: "Authentication setup failed" };
            }
          } catch (adminUpdateError) {
            // If admin update fails, try creating a new auth session
            return {
              error: "Authentication failed. Please contact administrator.",
            };
          }
        }
      }

      toast({
        title: "Login Successful",
        description: `Welcome back, ${userRecord.full_name}!`,
      });

      return {};
    } catch (error) {
      console.error("Sign in error:", error);
      return { error: "An unexpected error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id);

      if (error) {
        return { error: error.message };
      }

      // Update local user state
      setUser((prev) => (prev ? { ...prev, ...updates } : null));

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      return {};
    } catch (error) {
      console.error("Update profile error:", error);
      return { error: "Failed to update profile" };
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithAccessCode,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
