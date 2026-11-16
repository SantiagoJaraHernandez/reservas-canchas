export function parseJwt(token) {
  try {
    if (!token) return null;

    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function getAuthUser() {
  const token = localStorage.getItem("token");
  const payload = parseJwt(token);


  if (!payload) return null;

  return {
    id: payload.userId || payload.id || payload.sub || "",
    email: payload.email || "",
    role: payload.role || "USER",
  };
}

export function isAdminUser() {
  const user = getAuthUser();
  return user?.role === "ADMIN";
}