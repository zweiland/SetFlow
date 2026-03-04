import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Cache for client credentials token
let clientToken: string | null = null;
let clientTokenExpires = 0;

async function getClientCredentialsToken(): Promise<string> {
  if (clientToken && Date.now() < clientTokenExpires) {
    return clientToken;
  }

  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET");
  }

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Spotify token error: ${res.status}`);
  }

  const data = await res.json();
  clientToken = data.access_token;
  clientTokenExpires = Date.now() + (data.expires_in - 60) * 1000;
  return clientToken!;
}

async function handleSearch(query: string, limit: number): Promise<Response> {
  const token = await getClientCredentialsToken();
  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: String(limit),
  });

  const res = await fetch(`${SPOTIFY_API_BASE}/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return new Response(JSON.stringify({ error: "Spotify search failed" }), {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleRefreshUserToken(
  userId: string,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<Response> {
  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: connection, error } = await supabase
    .from("spotify_connections")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !connection) {
    return new Response(
      JSON.stringify({ error: "No Spotify connection found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: connection.refresh_token,
    }),
  });

  if (!res.ok) {
    return new Response(
      JSON.stringify({ error: "Failed to refresh Spotify token" }),
      {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const tokens = await res.json();
  const expiresAt = new Date(
    Date.now() + tokens.expires_in * 1000
  ).toISOString();

  await supabase
    .from("spotify_connections")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? connection.refresh_token,
      token_expires_at: expiresAt,
    })
    .eq("user_id", userId);

  return new Response(
    JSON.stringify({
      access_token: tokens.access_token,
      expires_at: expiresAt,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, query, limit = 20, user_id } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    switch (action) {
      case "search":
        if (!query) {
          return new Response(
            JSON.stringify({ error: "query is required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        return await handleSearch(query, Math.min(limit, 50));

      case "refresh-user-token":
        if (!user_id) {
          return new Response(
            JSON.stringify({ error: "user_id is required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        return await handleRefreshUserToken(
          user_id,
          supabaseUrl,
          serviceRoleKey
        );

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
