// src/components/Event/Event.js
import React, { useMemo, useCallback, useState, useEffect } from "react";
import axios from "axios";
import styles from "./Event.module.css";

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

  /** 행 단위 로딩 + 이미 저장된 이름 비활성화 */
  const [busyKey, setBusyKey] = useState(null);
  const [disabledNames, setDisabledNames] = useState(new Set());

  /** 화면에 보이는 행사명들로 1회 배치 체크 */
  useEffect(() => {
    const names = rows.map((ev) => (ev?.EVENT_NM || "").trim()).filter(Boolean);
    if (names.length === 0) {
      setDisabledNames(new Set());
      return;
    }

    const token = localStorage.getItem("accessToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios
      .post("https://seoul-mate.co.kr/contentapi/carts/check/names", names, {
        headers,
      })
      .then((res) => {
        const m = res?.data || {};
        const s = new Set(
          Object.entries(m)
            .filter(([, v]) => v === true)
            .map(([k]) => k)
        );
        setDisabledNames(s);
      })
      .catch((err) => {
        console.error("[check/names] 실패:", err);
      });
  }, [rows]);

  /** 가까운 장소 찾기 → onSavePlace 성공 시 이름 비활성화에 추가 */
  const handleFindNearest = useCallback(
    async (ev, key) => {
      try {
        setBusyKey(key);

        const res = await axios.get(
          "https://seoul-mate.co.kr/cityapi/nearest",
          {
            params: { x: ev.EVENT_X, y: ev.EVENT_Y },
          }
        );

        if (res.status === 204 || !res.data) return;

        const { source, document } = res.data || {};
        if (document && typeof onSavePlace === "function") {
          await onSavePlace(ev, document, source);
          const name = (ev.EVENT_NM || "").trim();
          if (name) {
            setDisabledNames((prev) => {
              const s = new Set(prev);
              s.add(name);
              return s;
            });
          }
        }
      } catch (err) {
        console.error("[nearest] error:", err);
      } finally {
        setBusyKey((prev) => (prev === key ? null : prev));
      }
    },
    [onSavePlace]
  );

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
                const rowKey = `${name}|${ev.EVENT_X},${ev.EVENT_Y}|${i}`;
                const isBusy = busyKey === rowKey;
                const isDisabled = disabledNames.has(
                  (ev.EVENT_NM || "").trim()
                );

                // 상태별 버튼 클래스
                const btnClass = [
                  styles.addButton,
                  isDisabled ? styles.addButtonSaved : "",
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
                          <span
                            className={`${styles.badge} ${styles.badgeNow}`}
                          >
                            진행중
                          </span>
                        )}
                        {ongoing === false && (
                          <span
                            className={`${styles.badge} ${styles.badgeDone}`}
                          >
                            종료
                          </span>
                        )}
                        {isDisabled && (
                          <span className={styles.badge}>저장됨</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        className={btnClass}
                        onClick={() => handleFindNearest(ev, rowKey)}
                        disabled={isBusy || isDisabled}
                        title="가까운 장소 찾기"
                        aria-busy={isBusy}
                      >
                        {isDisabled ? "✓" : isBusy ? "…" : "+"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className={styles.note}>
          ※ 진행 상태는 기간 기준으로 단순 계산됩니다.
        </div>
      </div>
    </div>
  );
};

export default Event;
