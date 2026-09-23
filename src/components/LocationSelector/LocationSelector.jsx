import "./LocationSelector.css";

/**
 * Menampilkan daftar lokasi kantor untuk dipilih staff (MODEL A).
 * @param {Array} locations - daftar office locations
 * @param {(location:Object)=>void} onSelect
 */
export default function LocationSelector({ locations, onSelect }) {
  return (
    <div className="location-selector">
      <h2 className="location-selector__title">Di mana kamu melakukan absensi?</h2>

      <div className="location-selector__list">
        {locations.map((location) => (
          <div className="location-selector__card" key={location.id}>
            <div className="location-selector__info">
              <span className="location-selector__pin" aria-hidden="true">
                📍
              </span>
              <div>
                <div className="location-selector__name">{location.name}</div>
                <div className="location-selector__subtitle">
                  Radius {location.radius} meter
                </div>
              </div>
            </div>

            <button
              type="button"
              className="location-selector__btn"
              onClick={() => onSelect(location)}
            >
              Pilih Lokasi
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
