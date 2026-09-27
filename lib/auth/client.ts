/**
 * Client-side Staff Authentication Utilities
 *
 * Provides helpers to attach signed HMAC session tokens from browser storage
 * (sessionStorage / localStorage) to outgoing HTTP requests to staff API endpoints.
 */

export function getStaffAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  const token =
    sessionStorage.getItem("sahara_staff_token") ||
    localStorage.getItem("sahara_staff_token");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}
