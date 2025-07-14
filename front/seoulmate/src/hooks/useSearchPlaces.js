//주석 추가
import { useEffect, useState } from "react";
import axios from "axios";

function useSearchPlaces(query) {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    if (!query) return setPlaces([]);

    const fetchData = async () => {
      try {
        const res = await axios.get(
          "https://seoul-mate.co.kr/cityapi/search/kakao",
          {
            params: { query },
          }
        );
        setPlaces(res.data.documents || []);
      } catch (err) {
        console.error("장소 검색 실패:", err);
        setPlaces([]);
      }
    };

    fetchData();
  }, [query]);

  return places;
}

export default useSearchPlaces;
