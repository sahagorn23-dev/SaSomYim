export async function verifyLiffToken(idToken: string): Promise<string> {
  const liffChannelId = process.env.LIFF_CHANNEL_ID;
  if (!liffChannelId) {
    throw new Error("LIFF_CHANNEL_ID is not set in environment variables");
  }

  const response = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: liffChannelId,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("LIFF verify error response:", errorBody);
    throw new Error("Failed to verify LIFF token");
  }

  const data = await response.json();

  if (data.aud !== liffChannelId) {
    throw new Error("Invalid audience (aud)");
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (data.exp < currentTimestamp) {
    throw new Error("Token has expired");
  }

  if (!data.sub) {
    throw new Error("Token does not contain a subject (sub)");
  }

  return data.sub;
}
