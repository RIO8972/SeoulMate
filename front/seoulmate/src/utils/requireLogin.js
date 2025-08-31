// 간단 가드: 토큰 없거나 이상하면 false
export default function requireLogin() {
  let at = null;
  try { at = localStorage.getItem("accessToken"); } catch {}
  if (!at || at === "null" || at === "undefined" || at.length < 10) {
    alert("로그인이 필요합니다.");
    return false;
  }
  // (선택) JWT 만료 체크
  try {
    const payload = JSON.parse(atob(at.split(".")[1] || ""));
    if (payload?.exp && payload.exp * 1000 < Date.now()) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      return false;
    }
  } catch {}
  return true;
}
