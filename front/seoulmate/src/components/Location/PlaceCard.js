import styles from "./PlaceCard.module.css";

function PlaceCard({ place, onAdd }) {
  return (
    <div className={styles.card}>
      <div className={styles.thumbnail}>
        <img
          src={`/images/${place.name}.jpg`}
          alt={place.name}
          onError={(e) => (e.target.src = "/images/default.jpg")}
        />
      </div>
      <div className={styles.content}>
        <h4 className={styles.name}>{place.name}</h4>
        <div className={styles.meta}>
          <span>❤️ {place.likes || 3459}</span>
          <span>⭐ {place.rating || 4.5}</span>
        </div>
        <button className={styles.addButton} onClick={() => onAdd(place)}>
          + 추가
        </button>
      </div>
    </div>
  );
}

export default PlaceCard;
