export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/online-assessment",
  "/apply",
  "/public/talent-pool/apply",
  "/recruitment/talent-pool/apply",
];

export function isPublicRoute(pathname = window.location.pathname) {
  return PUBLIC_ROUTES.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}