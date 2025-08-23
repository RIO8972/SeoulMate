import { useState, useMemo, useEffect } from "react";
import "./style.css";
import Header from "../../components/Header";
import StepCategory from "./steps/StepCategory";
import StepDate from "./steps/StepDate";
import StepLocation from "./steps/StepLocation";
import StepImage from "./steps/StepImage";
import StepDescription from "./steps/StepDescription";
import StepCost from "./steps/StepCost";
import axios from "axios";

/* ---------- 카테고리 ↔ 키워드 유틸 ---------- */
const ALL_CATEGORY_LABELS = [
  "맛집",
  "음식점",
  "카페",
  "디저트",
  "자연",
  "산책",
  "야경",
  "감성",
  "명소",
  "힐링",
  "쇼핑",
  "실내",
  "전시",
  "팝업",
  "공연",
  "영화관",
  "액티비티",
  "드라이브",
];

// "# 맛집 · 디저트" → ["맛집","디저트"]
const deriveCatsFromKeyword = (kw) => {
  if (!kw) return [];
  return String(kw)
    .replace(/^#\s*/, "")
    .split("·")
    .map((s) => s.trim())
    .filter((s) => s && ALL_CATEGORY_LABELS.includes(s));
};

// ["맛집","디저트"] → "맛집 · 디저트"
const buildKeyword = (cats) =>
  (Array.isArray(cats) ? cats : []).filter(Boolean).join(" · ");
/* ------------------------------------------- */

function ReviewForm({
  mode = "create", // "create" | "edit"
  initialData, // 수정 시 초기값
  onSubmit, // 수정 모드에서 호출할 콜백
  onCancel, // 취소 버튼 핸들러
  submitLabel, // (선택) 강제 버튼 라벨
  cancelLabel, // (선택) 취소 버튼 라벨
  /** 상세 → 수정 이동 시 전달되는 프리필 */
  prefill, // { keyword?: string, place?: { id,name,lat,lng,address,category,stay } }
}) {
  const [step, setStep] = useState(1);

  // 초기값 병합
  const initialForm = useMemo(() => {
    const base = {
      categories: [],
      date: "",
      time: "",
      region: "",
      places: [],
      images: [],
      title: "",
      intro: "",
      detail: "",
      cost: 0,
      ...(initialData || {}),
    };

    const initialCats =
      Array.isArray(base.categories) && base.categories.length
        ? base.categories
        : deriveCatsFromKeyword(base.keyword);

    return {
      ...base,
      categories: initialCats,
      keyword: buildKeyword(initialCats) || base.keyword || "",
    };
  }, [initialData]);

  const [formData, setFormData] = useState(initialForm);

  // initialData가 나중에 도착해도 폼 상태 동기화
  const [isDirty, setIsDirty] = useState(false);
  useEffect(() => {
    setFormData(initialForm);
    setIsDirty(false);
  }, [initialForm]);

  // ✅ prefill 반영: 3단계로 점프 + 장소 자동 추가(중복 방지) + 키워드 보정
  useEffect(() => {
    if (!prefill) return;

    // 장소 단계로 이동
    setStep(3);

    setFormData((prev) => {
      const next = { ...prev };

      // 키워드/카테고리 보정
      const preCat = prefill.keyword?.trim();
      if (preCat && !next.categories.includes(preCat)) {
        next.categories = [...next.categories, preCat];
        next.keyword = buildKeyword(next.categories);
      }

      // 장소 1건 자동 추가 (중복 검사)
      const p = prefill.place;
      const exists = p
        ? (next.places || []).some(
            (x) =>
              (x.id && p.id && x.id === p.id) ||
              (Number(x.lat) === Number(p.lat) &&
                Number(x.lng) === Number(p.lng))
          )
        : true;

      if (p && !exists) {
        next.places = [
          ...next.places,
          {
            id: p.id || `prefill-${Date.now()}`,
            name: p.name || "장소",
            lat: p.lat,
            lng: p.lng,
            address: p.address || "",
            category: p.category || preCat || "",
            stay: p.stay || 60,
          },
        ];
      }

      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  // dirty 체크 포함 업데이트 유틸 (categories 변경 시 keyword 동기화)
  const updateFormData = (updater) => {
    setFormData((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;

      if (next && next.categories && next.categories !== prev.categories) {
        next.keyword = buildKeyword(next.categories);
      }

      if (!isDirty) {
        try {
          if (JSON.stringify(next) !== JSON.stringify(initialForm)) {
            setIsDirty(true);
          }
        } catch {
          setIsDirty(true);
        }
      }
      return next;
    });
  };

  const totalSteps = 6;
  const next = () => setStep((p) => Math.min(totalSteps, p + 1));
  const prev = () => setStep((p) => Math.max(1, p - 1));
  const progress = (step / totalSteps) * 100;

  // date + time → datetime
  const buildDateTime = (date, time) => {
    if (!date && !time) return null;
    if (date && time) return `${date}T${time}:00`;
    if (date && !time) return `${date}T00:00:00`;
    return null;
  };

  /************************ 리뷰 백서버로 전송 (작성 모드) ******************************/
  const handleSave = () => {
    const form = new FormData();

    // JSON DTO
    const dto = {
      categories: formData.categories,
      cost: formData.cost,
      date: formData.date,
      datetime: formData.datetime,
      detail: formData.detail,
      intro: formData.intro,
      region: formData.region,
      time: formData.time,
      title: formData.title,
      places: formData.places, // [{placeId, name, lat, …}, …]
      keyword: buildKeyword(formData.categories), // 카테고리 → 키워드
    };
    form.append(
      "dto",
      new Blob([JSON.stringify(dto)], { type: "application/json" })
    );

    // 파일만 전송 (문자열 URL 제외)
    (Array.isArray(formData.images) ? formData.images : []).forEach((item) => {
      if (item instanceof File || item instanceof Blob) {
        form.append("images", item);
      }
    });

    const token = localStorage.getItem("accessToken");
    axios
      .post("http://localhost:8080/reviews/test/img", form, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          // Content-Type은 브라우저가 자동 설정
        },
      })
      .then(() => {
        alert("form데이터 전송이 완료되었습니다!");
      })
      .catch((err) => {
        console.error("업로드 실패:", err);
        alert("업로드 중 오류가 발생했습니다.");
      });
  };
  /**************************************************************************/

  // 완료/수정 공통 핸들러
  const handleFinish = () => {
    const payload = {
      ...formData,
      datetime: buildDateTime(formData.date, formData.time),
      keyword: buildKeyword(formData.categories), // 보정
    };

    if (mode === "edit") {
      onSubmit?.(payload);
    } else {
      handleSave();
    }
  };

  // 취소: 작성폼이면 경고 후 취소, 수정폼은 바로 취소
  const handleCancel = () => {
    if (mode === "create" && isDirty) {
      const ok = window.confirm("작성 중인 내용이 삭제됩니다. 취소하시겠어요?");
      if (!ok) return;
    }
    if (onCancel) onCancel();
    else window.history.back();
  };

  // 버튼 라벨: 작성=완료 / 수정=수정 (submitLabel이 있으면 우선)
  const submitText = submitLabel ?? (mode === "edit" ? "수정" : "완료");

  return (
    <div className="review-form-wrapper">
      <Header />

      <div className="review-form">
        {step === 1 && (
          <StepCategory data={formData} setData={updateFormData} />
        )}
        {step === 2 && <StepDate data={formData} setData={updateFormData} />}
        {step === 3 && (
          <StepLocation
            data={formData}
            setData={updateFormData}
            /** ✅ StepLocation 기본값: 지도 중심/검색 초기화 등에 활용 */
            defaultKeyword={prefill?.keyword}
            defaultPlace={prefill?.place}
            className="map-panel" // 넓은 지도 스타일 (CSS에 정의)
          />
        )}
        {step === 4 && <StepImage data={formData} setData={updateFormData} />}
        {step === 5 && (
          <StepDescription data={formData} setData={updateFormData} />
        )}
        {step === 6 && <StepCost data={formData} setData={updateFormData} />}
      </div>

      {/* 진행 상태 바 + 버튼 */}
      <div className="review-footer">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* 좌 취소 / 우 이전·다음(완료·수정) */}
        <div className="review-button-bar">
          <div className="left">
            <button
              type="button"
              className="review-button cancel"
              onClick={handleCancel}
            >
              {cancelLabel || "취소"}
            </button>
          </div>

          <div className="right">
            {step > 1 && (
              <button
                type="button"
                className="review-button back"
                onClick={prev}
              >
                이전
              </button>
            )}

            {step < totalSteps ? (
              <button
                type="button"
                className="review-button next"
                onClick={next}
              >
                다음
              </button>
            ) : (
              <button
                type="button"
                className="review-button next"
                onClick={handleFinish}
              >
                {submitText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewForm;
