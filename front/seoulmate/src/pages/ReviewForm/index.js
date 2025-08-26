// src/pages/Review/ReviewForm.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./style.css";
import Header from "../../components/Header";
import StepCategory from "./steps/StepCategory";
import StepDate from "./steps/StepDate";
import StepLocation from "./steps/StepLocation";
import StepImage from "./steps/StepImage";
import StepDescription from "./steps/StepDescription";
import StepCost from "./steps/StepCost";
// import axios from "axios";
import api from "../../api/api";

/* ---------- 카테고리 ↔ 키워드 유틸 ---------- */
const ALL_CATEGORY_LABELS = [
  "맛집","음식점","카페","디저트","자연","산책","야경","감성","명소","힐링",
  "쇼핑","실내","전시","팝업","공연","영화관","액티비티","드라이브",
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
const buildKeyword = (cats) => (Array.isArray(cats) ? cats : []).filter(Boolean).join(" · ");
/* ------------------------------------------- */

function ReviewForm({
  mode = "create",
  initialData,
  onSubmit,
  onCancel,
  submitLabel,
  cancelLabel,
  prefill,
}) {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const initialForm = useMemo(() => {
    const base = {
      categories: [],
      date: "",
      time: "",
      region: "",
      places: [],
      selectedPlaces: [],
      existingImages: [],
      newImages: [],
      deleteImgs: [],
      title: "",
      intro: "",
      detail: "",
      cost: 0,
      ...(initialData || {}),
    };

    if (!Array.isArray(base.selectedPlaces) || base.selectedPlaces.length === 0) {
      base.selectedPlaces = Array.isArray(base.places) ? [...base.places] : [];
    } else if (!Array.isArray(base.places) || base.places.length === 0) {
      base.places = [...base.selectedPlaces];
    }

    const initialCats =
      Array.isArray(base.categories) && base.categories.length
        ? base.categories
        : deriveCatsFromKeyword(base.keyword);

    const normalizedExisting =
      Array.isArray(base.images)
        ? base.images
            .map((it) => {
              if (typeof it === "string") return { id: null, url: it };
              if (it && typeof it === "object") {
                return { id: it.id ?? null, url: it.url ?? it.imgUrl ?? it.src ?? "" };
              }
              return null;
            })
            .filter(Boolean)
        : [];

    return {
      ...base,
      categories: initialCats,
      keyword: buildKeyword(initialCats) || base.keyword || "",
      existingImages: normalizedExisting,
      newImages: [],
      deleteImgs: [],
    };
  }, [initialData]);

  const [formData, setFormData] = useState(initialForm);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormData(initialForm);
    setIsDirty(false);
  }, [initialForm]);

  useEffect(() => {
    if (!prefill) return;
    setStep(3);
    setFormData((prev) => {
      const next = { ...prev };
      const preCat = prefill.keyword?.trim();
      if (preCat && !next.categories.includes(preCat)) {
        next.categories = [...next.categories, preCat];
        next.keyword = buildKeyword(next.categories);
      }
      const p = prefill.place;
      const exists = p
        ? (next.selectedPlaces || []).some(
            (x) =>
              (x.id && p.id && x.id === p.id) ||
              (Number(x.lat) === Number(p.lat) && Number(x.lng) === Number(p.lng))
          )
        : true;

      if (p && !exists) {
        const toAdd = {
          id: p.id || `prefill-${Date.now()}`,
          placeId: p.placeId || p.id || `prefill-${Date.now()}`,
          name: p.name || "장소",
          lat: Number(p.lat),
          lng: Number(p.lng),
          address: p.address || "",
          category: p.category || preCat || "",
          stay: p.stay || 60,
          url: p.url || "",
        };
        next.selectedPlaces = [...(next.selectedPlaces || []), toAdd];
        next.places = [...next.selectedPlaces];
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const updateFormData = (updater) => {
    setFormData((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;

      if (next && next.categories && next.categories !== prev.categories) {
        next.keyword = buildKeyword(next.categories);
      }
      if (next && Array.isArray(next.selectedPlaces) && next.selectedPlaces !== prev.selectedPlaces) {
        next.places = next.selectedPlaces;
      }
      if (next && Array.isArray(next.places) && next.places !== prev.places) {
        if (!Array.isArray(next.selectedPlaces) || next.selectedPlaces.length !== next.places.length) {
          next.selectedPlaces = next.places;
        }
      }

      if (!isDirty) {
        try {
          if (JSON.stringify(next) !== JSON.stringify(initialForm)) setIsDirty(true);
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

  const buildDateTime = (date, time) => {
    if (!date && !time) return null;
    if (date && time) return `${date}T${time}:00`;
    if (date && !time) return `${date}T00:00:00`;
    return null;
  };

  const getPlacesToSend = (fd) =>
    (fd.selectedPlaces?.length ? fd.selectedPlaces : fd.places) || [];

  // ====== 저장(생성) ======
  const handleSave = async () => {
    const placesToSend = getPlacesToSend(formData);

    const placesDto = placesToSend.map((p, i) => ({
      placeId: String(p.placeId ?? p.id ?? `p-${i}`),
      name: p.name ?? "",
      lat: String(p.lat ?? p.y ?? ""),
      lng: String(p.lng ?? p.x ?? ""),
      address: p.address ?? p.road_address_name ?? p.address_name ?? "",
      url: p.url ?? p.place_url ?? "",
    }));

    const form = new FormData();
    form.append(
      "dto",
      new Blob(
        [
          JSON.stringify({
            categories: formData.categories,
            cost: Number(formData.cost ?? 0),
            date: formData.date,
            time: formData.time,
            region: formData.region,
            title: formData.title,
            intro: formData.intro,
            detail: formData.detail,
            datetime: buildDateTime(formData.date, formData.time),
            places: placesDto,
          }),
        ],
        { type: "application/json" }
      )
    );

    (formData.newImages || []).forEach((file) => form.append("images", file));

    try {
      // baseURL 사용 → "/reviews" 만 전송
      const { data } = await api.post("/reviews", form); // 인터셉터로 AT 자동 주입
      const newId = Number(data);
      if (!Number.isFinite(newId)) {
        alert("생성된 리뷰 ID를 받지 못했습니다.");
        return;
      }
      alert("form데이터 전송이 완료되었습니다!");
      navigate(`/reviews/${newId}`);
    } catch (err) {
      console.error("업로드 실패:", err);
      alert("업로드 중 오류가 발생했습니다.");
    }
  };

  const handleFinish = () => {
    const placesToSend = getPlacesToSend(formData);

    const payload = {
      ...formData,
      datetime: buildDateTime(formData.date, formData.time),
      keyword: buildKeyword(formData.categories),
      places: placesToSend,
      selectedPlaces: placesToSend,
      newImages: formData.newImages || [],
      deleteImgs: formData.deleteImgs || [],
    };

    if (mode === "edit") {
      onSubmit?.(payload);
    } else {
      handleSave();
    }
  };

  const handleCancel = () => {
    if (mode === "create" && isDirty) {
      const ok = window.confirm("작성 중인 내용이 삭제됩니다. 취소하시겠어요?");
      if (!ok) return;
    }
    if (onCancel) onCancel();
    else window.history.back();
  };

  const submitText = submitLabel ?? (mode === "edit" ? "수정" : "완료");

  return (
    <div className="review-form-wrapper">
      <Header />

      <div className="review-form">
        {step === 1 && <StepCategory data={formData} setData={updateFormData} />}
        {step === 2 && <StepDate data={formData} setData={updateFormData} />}

        {step === 3 && (
          <StepLocation
            data={formData}
            setData={updateFormData}
            defaultKeyword={prefill?.keyword}
            defaultPlace={prefill?.place}
            className="map-panel"
          />
        )}

        {step === 4 && <StepImage data={formData} setData={updateFormData} mode={mode} />}
        {step === 5 && <StepDescription data={formData} setData={updateFormData} />}
        {step === 6 && <StepCost data={formData} setData={updateFormData} />}
      </div>

      <div className="review-footer">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="review-button-bar">
          <div className="left">
            <button type="button" className="review-button cancel" onClick={handleCancel}>
              {cancelLabel || "취소"}
            </button>
          </div>

          <div className="right">
            {step > 1 && (
              <button type="button" className="review-button back" onClick={prev}>
                이전
              </button>
            )}
            {step < totalSteps ? (
              <button type="button" className="review-button next" onClick={next}>
                다음
              </button>
            ) : (
              <button type="button" className="review-button next" onClick={handleFinish}>
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
