function SelectedPlaces({ selectedPlaces, onRemove }) {
  return (
    <div style={{ width: "30%" }}>
      <h4>추가된 장소</h4>
      {selectedPlaces.length === 0 ? (
        <p style={{ color: "#888" }}>선택된 장소가 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {selectedPlaces.map((place) => (
            <li
              key={place.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <span>{place.name}</span>
              <button onClick={() => onRemove(place.id)}>삭제</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SelectedPlaces;
