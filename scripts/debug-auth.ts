async function debugAuth() {
  const BASE = "http://localhost:3000";

  // Step 1: CSRF
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const csrfBody = await csrfRes.json() as { csrfToken: string };
  const rawCsrfCookie = csrfRes.headers.get("set-cookie") ?? "";
  console.log("CSRF token:", csrfBody.csrfToken);
  console.log("CSRF set-cookie:", rawCsrfCookie.slice(0, 120));

  const csrfCookies = rawCsrfCookie.split(",").map(c => c.split(";")[0].trim()).join("; ");

  // Step 2: Sign in
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": csrfCookies,
    },
    body: new URLSearchParams({
      username: "gery.admin",
      password: "password123",
      csrfToken: csrfBody.csrfToken,
      redirect: "false",
      json: "true",
    }).toString(),
    redirect: "manual",
  });

  console.log("\nLogin status:", loginRes.status);
  console.log("Login set-cookie:", loginRes.headers.get("set-cookie")?.slice(0, 200) ?? "(none)");
  console.log("Location:", loginRes.headers.get("location") ?? "(none)");

  const body = await loginRes.text();
  console.log("Body:", body.slice(0, 300));
}

debugAuth().catch(console.error);
