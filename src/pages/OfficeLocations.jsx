import { useEffect, useState } from "react";
import StatusBadge from "../components/StatusBadge/StatusBadge";
import { getOfficeLocations } from "../data/officeLocations";
import "./OfficeLocations.css";

export default function OfficeLocations() {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    setLocations(getOfficeLocations());
  }, []);

  return (
    <div className="locations-page">
      <h1 className="locations-page__title">Lokasi Kantor</h1>

      <div className="locations-page__list">
        {locations.map((location) => (
          <div className="locations-page__card" key={location.id}>
            <div className="locations-page__header">
              <span className="locations-page__name">{location.name}</span>
              <StatusBadge variant={location.status === "active" ? "success" : "neutral"}>
                {location.status === "active" ? "Active" : "Nonaktif"}
              </StatusBadge>
            </div>

            <a
              href={location.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="locations-page__maps-link"
            >
              📍 Lokasi Google Maps
            </a>

            <a
              href={location.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="locations-page__btn"
            >
              Buka Google Maps
            </a>

            <div className="locations-page__radius">
              Radius: <strong>{location.radius} meter</strong>
            </div>

            {(location.latitude == null || location.longitude == null) && (
              <div className="locations-page__notice">
                Koordinat lokasi belum tersedia.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
