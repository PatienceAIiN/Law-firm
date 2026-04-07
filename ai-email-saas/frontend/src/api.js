const base =
  import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ""
    ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
    : "";

async function parseJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
}

export async function apiGet(path) {
  const res = await fetch(`${base}${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data?.error || res.statusText || "Request failed");
  return data;
}

export async function apiPost(path, body) {
  const headers = {
    Accept: "application/json",
  };
  const options = {
    method: "POST",
    credentials: "include",
    headers,
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${base}${path}`, options);
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data?.error || res.statusText || "Request failed");
  return data;
}
