// src/components/Event/Event.js
import React, { useMemo, useCallback, useState, useEffect } from "react";
import axios from "axios";          // cityapi(근처 장소) 전용
import api from "../../api/api";    // contentapi 전용 인스턴스
import styles from "./Event.module.css";
import requireLogin from "../../utils/requireLogin";

/** 환경변수(선택) */
const CITYAPI_BASE =
  import.meta.env?.VITE_CITYAPI_BASE ||
  process.env.REACT_APP_CITYAPI_BASE ||
  "https://seoul-mate.co.kr/cityapi";

/** yyyy-mm-dd~yyyy-mm-dd → 진행중 여부 */
const isOngoing = (periodStr) => {
  if (!periodStr || typeof periodStr !== "string") return null;
  const [s, e] = periodStr.split("~").map((x) => x?.trim());
  if (!s || !e) return null;
  const start = new Date(s);
  const end = new Date(e);
  end.setHours(23, 59, 59, 999);
  const now = new Date();
  return now >= start && now <= end;
};

const Event = ({ event = [], onSavePlace }) => {
  /** 최대 50개만 노출 */
  const rows = useMemo(() => {
    const list = Array.isArray(event) ? event : event?.EVENT_STTS;
    return Array.isArray(list) ? list.slice(0, 50) : [];
  }, [event]);

  /** 저장여부, 로딩 표시 */
  const [busyKey, setBusyKey] = useState(null);
  const [savedNames, setSavedNames] = useState(new Set());

  /** 현재 표시되는 이벤트들이 이미 저장돼있는지 일괄 체크 (api 인스턴스 사용) */
  useEffect(() => {
    const names = rows.map((ev) => (ev?.EVENT_NM || "").trim()).filter(Boolean);
    if (names.length === 0) {
      setSavedNames(new Set());
      return;
    }

    api
      .post("/carts/check/names", names)   // ✅ baseURL은 src/api/api.js
      .then((res) => {
        const m = res?.data || {};
        const s = new Set(
          Object.entries(m)
            .filter(([, v]) => v === true)
            .map(([k]) => k)
        );
        setSavedNames(s);
      })
      .catch((err) => {
        console.error("[check/names] 실패:", err);
      });
  }, [rows]);

  /** 근처 장소 검색 (axios 그대로 유지) */
  const findNearest = useCallback(async (ev) => {
    const res = await axios.get(`${CITYAPI_BASE}/nearest`, {
      params: { x: ev.EVENT_X, y: ev.EVENT_Y },
    });
    if (res.status === 204 || !res.data) return null;
    return res.data; // { source, document }
  }, []);

  // 저장/삭제 토글
  const handleToggle = useCallback(
    async (ev, key) => {
      // ⛔ 로그인 필수: 실패 시 요청 차단 + 알림
      if (!requireLogin()) return;

      try {
        setBusyKey(key);
        const name = (ev.EVENT_NM || "").trim();
        if (!name) return;

        const already = savedNames.has(name);

        if (already) {
          // === 삭제 ===
          await api.delete("/carts/name", { data: { name } });
          setSavedNames((prev) => {
            const next = new Set(prev);
            next.delete(name);
            return next;
          });
        } else {
          // === 추가 ===
          const nearest = await findNearest(ev); // public cityapi (무인증)
          if (!nearest) return;
          const { source, document } = nearest;

          if (document && typeof onSavePlace === "function") {
            // 내부에서 contentapi 호출(인증 필요)
            await onSavePlace(ev, document, source);
          }

          setSavedNames((prev) => {
            const next = new Set(prev);
            next.add(name);
            return next;
          });
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          alert("로그인이 필요합니다.");
        } else {
          console.error("[toggle] error:", err);
          alert("처리 중 오류가 발생했습니다.");
        }
      } finally {
        setBusyKey((prev) => (prev === key ? null : prev));
      }
    },
    [savedNames, findNearest, onSavePlace]
  );

  const makeRowKey = (ev, i) => {
    const id =
      ev.id ??
      ev.EVENT_ID ??
      ev.place_id ??
      ev.URL ??
      (ev.EVENT_X && ev.EVENT_Y ? `${ev.EVENT_X},${ev.EVENT_Y}` : null);
    const name = (ev.EVENT_NM || "").trim();
    return `ev-${id ?? name ?? i}-${i}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>문화행사</h3>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>행사명</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
        </table>

        <table className={styles.table}>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className={styles.empty}>
                  데이터 없음
                </td>
              </tr>
            ) : (
              rows.map((ev, i) => {
                const name = ev.EVENT_NM || "-";
                const period = ev.EVENT_PERIOD || "-";
                const url = ev.URL || null;
                const thumb = ev.THUMBNAIL || null;
                const ongoing = isOngoing(period);
                const rowKey = makeRowKey(ev, i);
                const isBusy = busyKey === rowKey;
                const isSaved = savedNames.has((ev.EVENT_NM || "").trim());

                const btnClass = [
                  styles.addButton,
                  isSaved ? styles.addButtonSaved : "",
                  isBusy ? styles.addButtonBusy : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <tr key={rowKey}>
                    <td>
                      {thumb ? (
                        <img
                          className={styles.thumb}
                          src={thumb}
                          alt={name}
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles.thumbPlaceholder}>No Image</div>
                      )}
                    </td>
                    <td className={styles.eventName}>
                      <div className={styles.nameRow}>
                        {url ? (
                          <a
                            className={styles.link}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            title={name}
                          >
                            {name}
                          </a>
                        ) : (
                          <span className={styles.namePlain}>{name}</span>
                        )}
                        {ongoing === true && (
                          <span className={`${styles.badge} ${styles.badgeNow}`}>진행중</span>
                        )}
                        {ongoing === false && (
                          <span className={`${styles.badge} ${styles.badgeDone}`}>종료</span>
                        )}
                        {isSaved && <span className={styles.badge}>저장됨</span>}
                      </div>
                    </td>
                    <td>
                      <button
                        className={btnClass}
                        onClick={() => handleToggle(ev, rowKey)}
                        disabled={isBusy}
                        title={isSaved ? "저장 취소" : "가까운 장소 찾아 저장"}
                        aria-pressed={isSaved}
                        aria-busy={isBusy}
                      >
                        {isBusy ? "…" : isSaved ? "✓" : "+"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className={styles.note}>※ 진행 상태는 기간 기준으로 단순 계산됩니다.</div>
      </div>
    </div>
  );
};

export default Event;
