import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseClient = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "authorization, x-client-info, apikey, content-type"
    );
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Authentication failed");

    const { data: userProfile, error: profileError } = await supabaseClient
      .from("users")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || userProfile.role !== "Admin")
      throw new Error("Unauthorized: Admin access required");

    const userData = req.body;

    const accessCode = Math.floor(1000 + Math.random() * 9000).toString();
    const tempPassword = `temp_${accessCode}_${Date.now()}`;

    const { data: authData, error: createAuthError } =
      await supabaseClient.auth.admin.createUser({
        email: userData.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role,
        },
      });

    if (createAuthError || !authData.user)
      throw new Error("Failed to create authentication account");

    const { data: profileData, error: profileInsertError } =
      await supabaseClient
        .from("users")
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
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      throw new Error("Failed to create user profile");
    }

    return res.status(200).json({
      success: true,
      user: profileData,
      access_code: accessCode,
      message: "User created successfully",
    });
  } catch (error: unknown) {
    console.error("Error in create-user API:", error);

    let message = "Unexpected error";

    if (error instanceof Error) {
      message = error.message;
    }

    return res.status(400).json({ success: false, error: message });
  }
}
