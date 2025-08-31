// src/hooks/useAutoRefreshToken.js
import { useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import useRefreshToken from "./useRefreshToken";

const getExpMs = (t) => { try { return jwtDecode(t).exp * 1000; } catch { return 0; } };

export default function useAutoRefreshToken({
  skewMs = 60_000,            // 만료 1분 전
  testAfterIssueSec = null,    // 테스트: 발급 후 N초
  onRefreshError,
  failCooldownMs = 30_000,     // 실패 후 쿨다운(기본 30초)
} = {}) {
  const timerRef = useRef(null);
  const inFlightRef = useRef(false);
  const bootTriedRef = useRef(false);     // AT 없을 때 부트스트랩 1회만
  const lastFailAtRef = useRef(0);        // 실패 쿨다운
  const onErrRef = useRef(onRefreshError);
  onErrRef.current = onRefreshError;

  const { refresh } = useRefreshToken();

  useEffect(() => {
    let stopped = false;

    const clear = () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };

    const scheduleFromToken = (token) => {
      if (stopped || !token) return;
      const expMs = getExpMs(token);
      const now = Date.now();

      const delay = testAfterIssueSec != null
        ? Math.max((jwtDecode(token).iat * 1000 + testAfterIssueSec * 1000) - now, 0)
        : Math.max(expMs - now - skewMs, 0);

      console.log("[autoRefresh] will refresh in", delay, "ms");
      timerRef.current = setTimeout(tick, delay);
    };

    const tick = async () => {
      if (stopped || inFlightRef.current) return;
      const now = Date.now();
      if (now - lastFailAtRef.current < failCooldownMs) {
        // 최근 실패 후 쿨다운 중이면 재시도 스킵
        const rest = failCooldownMs - (now - lastFailAtRef.current);
        console.log("[autoRefresh] cooldown", rest, "ms left");
        timerRef.current = setTimeout(start, rest);
        return;
      }

      inFlightRef.current = true;
      console.log("[autoRefresh] timer fired → refresh()");
      try {
        const newToken = await refresh();
        console.log("[autoRefresh] refresh() success");
        scheduleFromToken(newToken);
      } catch (e) {
        console.warn("[autoRefresh] refresh() failed", e);
        lastFailAtRef.current = Date.now();
        try { localStorage.removeItem("accessToken"); } catch {}
        delete axios.defaults.headers.common?.Authorization;
        onErrRef.current && onErrRef.current(e);
        // 실패 후에는 재스케줄을 쿨다운 뒤 start()에서 처리
        timerRef.current = setTimeout(start, failCooldownMs);
      } finally {
        inFlightRef.current = false;
      }
    };

    const start = async () => {
      clear();
      const token = localStorage.getItem("accessToken");

      if (!token) {
        if (bootTriedRef.current) {
          console.log("[autoRefresh] no token and bootstrap already tried → idle");
          return; // 부트스트랩 1회만
        }
        bootTriedRef.current = true;
        console.log("[autoRefresh] bootstrap refresh()");
        try {
          const newToken = await refresh();
          scheduleFromToken(newToken);
        } catch (e) {
          console.warn("[autoRefresh] bootstrap refresh failed");
          lastFailAtRef.current = Date.now();
          onErrRef.current && onErrRef.current(e);
          // 쿨다운 후 재시도(visibility/storage 이벤트로도 다시 start될 수 있음)
          timerRef.current = setTimeout(start, failCooldownMs);
        }
        return;
      }

      const exp = getExpMs(token);
      if (!exp || exp <= Date.now() + 5_000) {
        await tick(); // 임박하면 즉시 갱신
      } else {
        scheduleFromToken(token);
      }
    };

    start();

    // 탭 다시 보일 때 / 다른 탭 토큰 변경 시 재시작
    const onVisible = () => { if (document.visibilityState === "visible") start(); };
    const onStorage = (e) => { if (e.key === "accessToken") start(); };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", onStorage);

    return () => {
      stopped = true;
      clear();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
    };
    // 👇 onRefreshError는 ref로 들고가므로 의존성에 넣지 않음 (재실행 방지)
  }, [refresh, skewMs, testAfterIssueSec, failCooldownMs]);
}



//테스트 끝나고 이걸로 바꾸기 안되면 
// import { useEffect, useRef } from "react";
// import { jwtDecode } from "jwt-decode";
// import axios from "axios";
// import useRefreshToken from "./useRefreshToken"; // ← 네가 만든 훅

// const getExpMs = (t) => {
//   try { return jwtDecode(t).exp * 1000; } catch { return 0; }
// };

// export default function useAutoRefreshToken({ skewMs = 60_000, onRefreshError } = {}) {
//   const timerRef = useRef(null);
//   const inFlightRef = useRef(false);
//   const { refresh } = useRefreshToken();

//   useEffect(() => {
//     let stopped = false;

//     const clear = () => {
//       if (timerRef.current) {
//         clearTimeout(timerRef.current);
//         timerRef.current = null;
//       }
//     };

//     const scheduleFromToken = (token) => {
//       if (stopped || !token) return;
//       const expMs = getExpMs(token);
//       const delay = Math.max(expMs - Date.now() - skewMs, 0);
//       timerRef.current = setTimeout(tick, delay);
//     };

//     const tick = async () => {
//       if (stopped || inFlightRef.current) return;
//       inFlightRef.current = true;
//       try {
//         const newToken = await refresh();     // ✅ RT→AT 재발급 (Authorization 제거는 훅이 처리)
//         scheduleFromToken(newToken);          // 새 토큰 기준 재스케줄
//       } catch (e) {
//         // 방어적 정리
//         try { localStorage.removeItem("accessToken"); } catch {}
//         delete axios.defaults.headers.common?.Authorization;
//         if (onRefreshError) onRefreshError(e);
//       } finally {
//         inFlightRef.current = false;
//       }
//     };

//     const start = async () => {
//       clear();
//       const token = localStorage.getItem("accessToken");

//       // 토큰이 없으면: 한번 즉시 refresh 시도
//       if (!token) {
//         try {
//           const newToken = await refresh();
//           scheduleFromToken(newToken);
//         } catch (e) {
//           if (onRefreshError) onRefreshError(e);
//         }
//         return;
//       }

//       // 토큰이 있지만 만료 임박/만료라면 즉시 재발급
//       const expMs = getExpMs(token);
//       if (!expMs || expMs <= Date.now() + 5_000) {
//         await tick();
//       } else {
//         scheduleFromToken(token);
//       }
//     };

//     start();

//     // 탭 다시 보일 때/다른 탭에서 토큰 변경 시 재스케줄
//     const onVisible = () => { if (document.visibilityState === "visible") start(); };
//     const onStorage = (e) => { if (e.key === "accessToken") start(); };

//     document.addEventListener("visibilitychange", onVisible);
//     window.addEventListener("storage", onStorage);

//     return () => {
//       stopped = true;
//       clear();
//       document.removeEventListener("visibilitychange", onVisible);
//       window.removeEventListener("storage", onStorage);
//     };
//   }, [refresh, skewMs, onRefreshError]);
// }



// import { useEffect, useRef } from "react";
// import { jwtDecode } from "jwt-decode";

// const isValid = (t) => {
//   if (!t) return false;
//   try { return jwtDecode(t).exp * 1000 > Date.now() + 5000; } catch { return false; }
// };
// const msUntilExpiry = (t) => {
//   try { return jwtDecode(t).exp * 1000 - Date.now(); } catch { return 0; }
// };

// export default function useAutoRefreshToken({ accessToken, refresh, logout, skewMs = 10_000 }) {
//   const timerRef = useRef(null);

//   useEffect(() => {
//     const clear = () => {
//       if (timerRef.current) {
//         clearTimeout(timerRef.current);
//         timerRef.current = null;
//       }
//     };

//     const schedule = () => {
//       if (!accessToken) return;
//       const leftMs = msUntilExpiry(accessToken);
//       const delay = Math.max(leftMs - skewMs, 0);

//       timerRef.current = setTimeout(async () => {
//         try {
//           await refresh();
//           schedule(); // 새 토큰으로 다시 예약
//         } catch {
//           await logout();
//         }
//       }, delay);
//     };

//     clear();

//     if (!accessToken) return;

//     if (isValid(accessToken)) {
//       schedule();
//     } else {
//       (async () => {
//         try {
//           await refresh();
//           schedule();
//         } catch {
//           await logout();
//         }
//       })();
//     }

//     return clear;
//   }, [accessToken, refresh, logout, skewMs]);
// }

// import { useEffect, useRef } from "react";
// import { jwtDecode } from "jwt-decode";

// const isValid = (t) => {
//   if (!t) return false;
//   try { return jwtDecode(t).exp * 1000 > Date.now() + 5000; } catch { return false; }
// };
// const msUntilExpiry = (t) => {
//   try { return jwtDecode(t).exp * 1000 - Date.now(); } catch { return 0; }
// };

// export default function useAutoRefreshToken({ accessToken, refresh, logout, skewMs = 50_000 }) {
//   const timerRef = useRef(null);

//   useEffect(() => {
//     const clear = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };

//     const schedule = () => {
//       if (!accessToken) return;
//       const delay = Math.max(msUntilExpiry(accessToken) - skewMs, 0);
//       timerRef.current = setTimeout(async () => {
//         try { await refresh(); schedule(); } catch { await logout(); }
//       }, delay);
//     };

//     clear();

//     if (!accessToken) return;
//     if (isValid(accessToken)) schedule();
//     else {
//       (async () => { try { await refresh(); schedule(); } catch { await logout(); } })();
//     }
//     return clear;
//   }, [accessToken, refresh, logout, skewMs]);
// }
