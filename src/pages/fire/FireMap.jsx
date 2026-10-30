import { useEffect, useState, useMemo, Fragment } from "react";
import {
  getParcel,
  getMyParcels,
} from "../../api/parcels";

import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Circle,
  Popup,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* =========================================================
   ICÔNES DYNAMIQUES DE FEU (SELON INTENSITÉ FRP)
========================================================= */

const createFireIcon = (frp = 0) => {
  const intensity = Number(frp) || 0;
  const isHigh = intensity >= 50;
  const isMed = intensity >= 15 && intensity < 50;

  const size = isHigh ? 38 : isMed ? 32 : 28;
  const haloColor = isHigh ? "rgba(220, 38, 38, 0.45)" : isMed ? "rgba(234, 88, 12, 0.35)" : "rgba(245, 158, 11, 0.25)";

  return new L.DivIcon({
    className: "",
    html: `
      <div style="
        font-size: ${size - 6}px;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: ${haloColor};
        box-shadow: 0 0 10px ${haloColor};
        animation: pulse 2s infinite ease-in-out;
        cursor: pointer;
      ">
        🔥
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

/* =========================================================
   NORMALISATION DE LA GÉOMÉTRIE
========================================================= */

const normalizeGeometry = (parcel) => {
  let geometry =
    parcel?.geometry ??
    parcel?.geom ??
    null;

  if (!geometry) {
    return null;
  }

  if (typeof geometry === "string") {
    try {
      geometry = JSON.parse(geometry);
    } catch (error) {
      console.error("❌ Impossible de parser la géométrie :", error);
      return null;
    }
  }

  if (geometry.type && geometry.coordinates) {
    return geometry;
  }

  if (geometry.geometry?.type && geometry.geometry?.coordinates) {
    return geometry.geometry;
  }

  return null;
};

/* =========================================================
   CONVERSION GEOJSON → COORDONNÉES LEAFLET
========================================================= */

const geometryToPositions = (geometry) => {
  if (!geometry) return [];

  if (geometry.type === "Polygon") {
    const ring = geometry.coordinates?.[0];
    if (!Array.isArray(ring)) return [];

    return ring
      .map(([longitude, latitude]) => [Number(latitude), Number(longitude)])
      .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
  }

  if (geometry.type === "MultiPolygon") {
    const polygons = [];
    geometry.coordinates?.forEach((polygon) => {
      const ring = polygon?.[0];
      if (!Array.isArray(ring)) return;

      const positions = ring
        .map(([longitude, latitude]) => [Number(latitude), Number(longitude)])
        .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

      if (positions.length >= 3) {
        polygons.push(positions);
      }
    });

    return polygons;
  }

  return [];
};

/* =========================================================
   CALCUL DU CENTRE DE LA PARCELLE & BADGE MENACÉ
========================================================= */

const getParcelCentroid = (positions) => {
  if (!positions || positions.length === 0) return null;
  const pts =
    Array.isArray(positions[0]) && Array.isArray(positions[0][0])
      ? positions[0]
      : positions;

  let sumLat = 0;
  let sumLng = 0;
  let count = 0;
  pts.forEach(([lat, lng]) => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      sumLat += lat;
      sumLng += lng;
      count++;
    }
  });

  return count > 0 ? [sumLat / count, sumLng / count] : null;
};

const createParcelBadgeIcon = (parcelName, isThreatened, distanceM) => {
  const distStr = distanceM ? `${Math.round(distanceM)}m` : "";
  const bgColor = isThreatened ? "#dc2626" : "#047857";
  const shadowColor = isThreatened
    ? "rgba(220, 38, 38, 0.45)"
    : "rgba(4, 120, 87, 0.35)";
  const dotColor = isThreatened ? "#fef08a" : "#a7f3d0";

  return new L.DivIcon({
    className: "",
    html: `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: ${bgColor};
        color: white;
        padding: 2.5px 7.5px;
        border-radius: 9999px;
        font-size: 10.5px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 3px 10px ${shadowColor}, 0 0 0 1.5px white;
        cursor: pointer;
        transform: translate(-50%, -50%);
        pointer-events: auto;
      ">
        <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${dotColor};"></span>
        <span>${parcelName || "Parcelle"}</span>
        ${
          isThreatened && distStr
            ? `<span style="background: rgba(0,0,0,0.25); padding: 0.5px 4px; border-radius: 5px; font-size: 9.5px; font-weight: 700;">${distStr}</span>`
            : ""
        }
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -10],
  });
};

const prepareParcel = (parcel) => {
  const geometry = normalizeGeometry(parcel);
  return {
    ...parcel,
    geometry,
  };
};

/* =========================================================
   AJUSTEMENT AUTOMATIQUE DE L'EMPRISE (FIT BOUNDS)
========================================================= */

const FitMapToData = ({ fires, parcels }) => {
  const map = useMap();

  useEffect(() => {
    const points = [];

    fires?.forEach((fire) => {
      const latitude = Number(fire?.latitude ?? fire?.fire_latitude);
      const longitude = Number(fire?.longitude ?? fire?.fire_longitude);

      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        points.push([latitude, longitude]);
      }
    });

    parcels?.forEach((parcel) => {
      const geometry = parcel.geometry;
      if (!geometry) return;

      if (geometry.type === "Polygon") {
        const ring = geometry.coordinates?.[0];
        ring?.forEach(([longitude, latitude]) => {
          const lat = Number(latitude);
          const lng = Number(longitude);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            points.push([lat, lng]);
          }
        });
      }

      if (geometry.type === "MultiPolygon") {
        geometry.coordinates?.forEach((polygon) => {
          const ring = polygon?.[0];
          ring?.forEach(([longitude, latitude]) => {
            const lat = Number(latitude);
            const lng = Number(longitude);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
              points.push([lat, lng]);
            }
          });
        });
      }
    });

    if (points.length === 0) return;

    try {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 14,
      });
    } catch (error) {
      console.error("❌ Erreur ajustement carte :", error);
    }
  }, [fires, parcels, map]);

  return null;
};

/* =========================================================
   CENTRAGE INTERACTIF SUR LA CIBLE SÉLECTIONNÉE
========================================================= */

const CenterOnTarget = ({ target }) => {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    const lat = Number(target.latitude ?? target.fire_latitude);
    const lon = Number(target.longitude ?? target.fire_longitude);

    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      map.flyTo([lat, lon], 14, {
        duration: 1.2,
      });
    }
  }, [target, map]);

  return null;
};

/* =========================================================
   COMPOSANT PRINCIPAL FIRE MAP
========================================================= */

const FireMap = ({
  fires = [],
  radiusKm = 5,
  focusedTarget = null,
}) => {
  const [parcels, setParcels] = useState([]);
  const [parcelDetails, setParcelDetails] = useState(null);
  const [selectedParcelId, setSelectedParcelId] = useState(null);
  const [parcelLoading, setParcelLoading] = useState(false);

  // Fonds de cartes et contrôles d'affichage
  const [baseMap, setBaseMap] = useState("osm"); // "osm" | "satellite" | "topo"
  const [showBufferRings, setShowBufferRings] = useState(true);
  const [showOnlyThreatened, setShowOnlyThreatened] = useState(false);
  const [showFires, setShowFires] = useState(true);

  /* =======================================================
     MAPPAGE DE TOUTES LES PARCELLES MENACÉES
  ======================================================= */
  const threatenedParcelMap = useMemo(() => {
    const map = new Map();
    fires.forEach((fire) => {
      // 1. Parcelle principale la plus proche
      if (fire.parcel_id) {
        const existing = map.get(fire.parcel_id);
        if (!existing || Number(fire.distance_m) < Number(existing.distance_m)) {
          map.set(fire.parcel_id, fire);
        }
      }

      // 2. Toutes les autres parcelles contenues dans affected_parcels
      if (Array.isArray(fire.affected_parcels)) {
        fire.affected_parcels.forEach((ap) => {
          if (ap.parcel_id) {
            const existing = map.get(ap.parcel_id);
            if (!existing || Number(ap.distance_m) < Number(existing.distance_m)) {
              map.set(ap.parcel_id, {
                ...fire,
                distance_m: ap.distance_m,
              });
            }
          }
        });
      }
    });
    return map;
  }, [fires]);

  /* =======================================================
     CHARGEMENT DES PARCELLES ENREGISTRÉES
  ======================================================= */
  useEffect(() => {
    let mounted = true;

    const loadParcels = async () => {
      try {
        const result = await getMyParcels();
        const rawParcels = Array.isArray(result) ? result : result?.data;

        if (!Array.isArray(rawParcels)) return;

        const preparedParcels = rawParcels.map(prepareParcel);

        if (mounted) {
          setParcels(preparedParcels);
        }
      } catch (error) {
        console.error(
          "❌ Erreur chargement parcelles :",
          error.response?.data || error.message
        );
        if (mounted) setParcels([]);
      }
    };

    loadParcels();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     CLIC SUR UNE PARCELLE (AFFICHAGE IMMÉDIAT ET FIABLE)
  ======================================================= */
  const handleParcelClick = async (parcel) => {
    setSelectedParcelId(parcel.uuid);
    // Définir immédiatement les détails à partir de la parcelle locale (garantit que rien n'est vide)
    setParcelDetails({ data: parcel });

    const coopId = parcel.cooperative_id || parcel.cooperative?.uuid;
    if (coopId && parcel.uuid) {
      try {
        setParcelLoading(true);
        const result = await getParcel(coopId, parcel.uuid);
        if (result?.data) {
          setParcelDetails(result);
        }
      } catch (error) {
        console.warn(
          "Détails complémentaires non disponibles, utilisation des données locales :",
          error.response?.data || error.message
        );
      } finally {
        setParcelLoading(false);
      }
    }
  };

  /* =======================================================
     CENTRE INITIAL DE LA CARTE
  ======================================================= */
  const center = useMemo(() => {
    const firstFire = fires?.[0];
    const firstLatitude = Number(firstFire?.latitude ?? firstFire?.fire_latitude);
    const firstLongitude = Number(firstFire?.longitude ?? firstFire?.fire_longitude);
    if (Number.isFinite(firstLatitude) && Number.isFinite(firstLongitude)) {
      return [firstLatitude, firstLongitude];
    }

    const firstParcel = parcels?.[0];
    if (firstParcel?.geometry) {
      const geometry = firstParcel.geometry;
      if (geometry.type === "Polygon") {
        const coordinate = geometry.coordinates?.[0]?.[0];
        if (coordinate) {
          return [Number(coordinate[1]), Number(coordinate[0])];
        }
      }
    }

    return [-18.8792, 47.5079]; // Antananarivo par défaut
  }, [fires, parcels]);

  // Filtrage des parcelles affichées
  const displayedParcels = useMemo(() => {
    if (!showOnlyThreatened) return parcels;
    return parcels.filter((p) => threatenedParcelMap.has(p.uuid));
  }, [parcels, showOnlyThreatened, threatenedParcelMap]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      {/* =====================================================
          CONTRÔLES FLOTTANTS DE COUCHES & FOND DE CARTE
      ===================================================== */}
      <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
        {/* Choix du fond de carte */}
        <div className="flex overflow-hidden rounded-xl bg-white/95 dark:bg-slate-900/95 p-1 shadow-md backdrop-blur border border-gray-200 dark:border-slate-700 text-xs font-semibold">
          {[
            { id: "osm", label: "Plan" },
            { id: "satellite", label: "Satellite" },
            { id: "topo", label: "Relief" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setBaseMap(item.id)}
              className={`rounded-lg cursor-pointer px-2.5 py-1.5 transition ${
                baseMap === item.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Toggles des calques */}
        <div className="rounded-xl bg-white/95 dark:bg-slate-900/95 p-2.5 shadow-md backdrop-blur border border-gray-200 dark:border-slate-700 text-xs space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showBufferRings}
              onChange={(e) => setShowBufferRings(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 dark:border-slate-700 text-red-600 focus:ring-red-500"
            />
            <span>Zones tampons ({radiusKm} km)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showOnlyThreatened}
              onChange={(e) => setShowOnlyThreatened(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Menacées seulement ({threatenedParcelMap.size})</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showFires}
              onChange={(e) => setShowFires(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 dark:border-slate-700 text-red-600 focus:ring-red-500"
            />
            <span>Foyers de feu ({fires.length})</span>
          </label>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="h-[560px] w-full"
      >
        {baseMap === "osm" ? (
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : baseMap === "satellite" ? (
          <TileLayer
            attribution="&copy; Esri & contributors"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        ) : (
          <TileLayer
            attribution="&copy; OpenTopoMap contributors"
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          />
        )}

        <FitMapToData fires={fires} parcels={displayedParcels} />
        {focusedTarget && <CenterOnTarget target={focusedTarget} />}

        {/* =================================================
            PARCELLES (AVEC DISTINCTION ZONE DE DANGER)
        ================================================= */}
        {displayedParcels.map((parcel) => {
          const geometry = parcel.geometry;
          if (!geometry) return null;

          const isSelected = selectedParcelId === parcel.uuid;
          const threatInfo = threatenedParcelMap.get(parcel.uuid);
          const isThreatened = Boolean(threatInfo);

          const parcelStyle = {
            color: isSelected
              ? isThreatened
                ? "#7f1d1d"
                : "#064e3b"
              : isThreatened
              ? "#dc2626"
              : "#047857",
            fillColor: isSelected
              ? isThreatened
                ? "#ef4444"
                : "#10b981"
              : isThreatened
              ? "#ef4444"
              : "#10b981",
            fillOpacity: isSelected
              ? isThreatened
                ? 0.75
                : 0.6
              : isThreatened
              ? 0.65
              : 0.45,
            weight: isSelected ? 4 : isThreatened ? 3.5 : 2.5,
            dashArray: isThreatened ? "5, 4" : undefined,
          };

          let positions = [];
          let polygons = [];
          let centroid = null;

          if (geometry.type === "Polygon") {
            positions = geometryToPositions(geometry);
            if (positions.length < 3) return null;
            centroid = getParcelCentroid(positions);
          } else if (geometry.type === "MultiPolygon") {
            polygons = geometryToPositions(geometry);
            if (polygons.length === 0) return null;
            centroid = getParcelCentroid(polygons[0]);
          } else {
            return null;
          }

          return (
            <Fragment key={parcel.uuid}>
              {/* Polygone(s) de la parcelle */}
              {geometry.type === "Polygon" ? (
                <Polygon
                  positions={positions}
                  pathOptions={parcelStyle}
                  eventHandlers={{
                    click: () => handleParcelClick(parcel),
                  }}
                >
                  <Popup>
                    <ParcelPopup
                      parcel={parcel}
                      parcelDetails={parcelDetails}
                      parcelLoading={parcelLoading}
                      selectedParcelId={selectedParcelId}
                      threatInfo={threatInfo}
                      radiusKm={radiusKm}
                      centroid={centroid}
                    />
                  </Popup>
                </Polygon>
              ) : (
                polygons.map((polyPositions, polygonIndex) => (
                  <Polygon
                    key={`${parcel.uuid}-${polygonIndex}`}
                    positions={polyPositions}
                    pathOptions={parcelStyle}
                    eventHandlers={{
                      click: () => handleParcelClick(parcel),
                    }}
                  >
                    <Popup>
                      <ParcelPopup
                        parcel={parcel}
                        parcelDetails={parcelDetails}
                        parcelLoading={parcelLoading}
                        selectedParcelId={selectedParcelId}
                        threatInfo={threatInfo}
                        radiusKm={radiusKm}
                        centroid={centroid}
                      />
                    </Popup>
                  </Polygon>
                ))
              )}

              {/* Marqueur/Badge flottant pour TOUTES les parcelles (menacées ou sécurisées) pour garantir une visibilité parfaite même à très petite superficie */}
              {centroid && (
                <Marker
                  key={`parcel-badge-${parcel.uuid}`}
                  position={centroid}
                  icon={createParcelBadgeIcon(
                    parcel.name,
                    isThreatened,
                    threatInfo?.distance_m
                  )}
                  eventHandlers={{
                    click: () => handleParcelClick(parcel),
                  }}
                >
                  <Popup>
                    <ParcelPopup
                      parcel={parcel}
                      parcelDetails={parcelDetails}
                      parcelLoading={parcelLoading}
                      selectedParcelId={selectedParcelId}
                      threatInfo={threatInfo}
                      radiusKm={radiusKm}
                      centroid={centroid}
                    />
                  </Popup>
                </Marker>
              )}
            </Fragment>
          );
        })}

        {/* =================================================
            CERCLES DE ZONE TAMPON AUTOUR DES FOYERS
        ================================================= */}
        {showBufferRings &&
          fires.map((fire, index) => {
            const latitude = Number(fire.latitude ?? fire.fire_latitude);
            const longitude = Number(fire.longitude ?? fire.fire_longitude);

            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
              return null;
            }

            const fireKey =
              fire.external_id ??
              `fire-circle-${fire.parcel_id}-${latitude}-${longitude}-${index}`;

            return (
              <Circle
                key={fireKey}
                center={[latitude, longitude]}
                radius={Number(radiusKm) * 1000}
                interactive={false}
                pathOptions={{
                  color: "#dc2626",
                  fillColor: "#ef4444",
                  fillOpacity: 0.08,
                  weight: 1.5,
                  dashArray: "5, 5",
                  interactive: false,
                }}
              />
            );
          })}

        {/* =================================================
            MARQUEURS DES FEUX NASA FIRMS (DIFFÉRENCIÉS FRP)
        ================================================= */}
        {showFires &&
          fires.map((fire, index) => {
            const latitude = Number(fire.latitude ?? fire.fire_latitude);
            const longitude = Number(fire.longitude ?? fire.fire_longitude);

            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
              return null;
            }

            const fireKey =
              fire.external_id ??
              `fire-${fire.parcel_id}-${latitude}-${longitude}-${index}`;

            const formattedDate =
              fire.detected_at || fire.fire_detected_at
                ? new Date(
                    fire.detected_at || fire.fire_detected_at
                  ).toLocaleString("fr-FR")
                : `${fire.acq_date || ""} ${fire.acq_time || ""}`.trim() ||
                  "N/A";

            const frpVal = fire.frp ?? fire.fire_frp ?? 0;
            const affectedCount = Array.isArray(fire.affected_parcels)
              ? fire.affected_parcels.length
              : fire.parcel_id
              ? 1
              : 0;

            return (
              <Marker
                key={fireKey}
                position={[latitude, longitude]}
                icon={createFireIcon(frpVal)}
              >
                <Popup>
                  <div className="min-w-[270px] text-sm">
                    <div className="mb-2 flex items-center justify-between border-b pb-2">
                      <h3 className="flex items-center gap-1.5 font-bold text-red-700">
                        {/* <span>🔥</span> */}
                        <span>Foyer de chaleur actif</span>
                      </h3>
                      <span className="rounded bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                        NASA FIRMS NRT
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-700">
                      <div className="flex justify-between py-0.5 border-b border-gray-100">
                        <span className="text-gray-500">Distance minimale :</span>
                        <strong className="text-red-700">
                          {Number.isFinite(Number(fire.distance_m))
                            ? `${Number(fire.distance_m).toFixed(0)} m`
                            : "N/A"}
                        </strong>
                      </div>

                      <div className="flex justify-between py-0.5 border-b border-gray-100">
                        <span className="text-gray-500">Puissance FRP :</span>
                        <span className="font-semibold text-amber-700">
                          {frpVal ? `${Number(frpVal).toFixed(1)} MW` : "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between py-0.5 border-b border-gray-100">
                        <span className="text-gray-500">Confiance satellite :</span>
                        <span className="capitalize font-medium">
                          {fire.confidence ?? fire.fire_confidence ?? "Nominale"}
                        </span>
                      </div>

                      <div className="flex justify-between py-0.5 border-b border-gray-100">
                        <span className="text-gray-500">Satellite / Capteur :</span>
                        <span>
                          {fire.satellite || "VIIRS"} ({fire.instrument || "NRT 375m"})
                        </span>
                      </div>

                      <div className="flex justify-between py-0.5 border-b border-gray-100">
                        <span className="text-gray-500">Détection :</span>
                        <span className="font-medium text-gray-800">
                          {formattedDate}
                        </span>
                      </div>

                      <div className="flex justify-between py-0.5 border-b border-gray-100">
                        <span className="text-gray-500">Coordonnées GPS :</span>
                        <span className="font-mono text-[11px]">
                          {latitude.toFixed(4)}, {longitude.toFixed(4)}
                        </span>
                      </div>

                      {affectedCount > 0 && (
                        <div className="mt-2 rounded-lg bg-red-50 p-2 text-[11px] text-red-800 border border-red-200">
                          <p className="font-bold">
                            {affectedCount} parcelle(s) dans le rayon de {radiusKm} km
                          </p>
                          {(fire.parcel_name || fire.parcel_id) && (
                            <p className="mt-0.5 truncate text-[11px]">
                              Plus proche :{" "}
                              <strong className="text-red-950 font-bold">
                                {fire.parcel_name ||
                                  parcels.find((p) => p.uuid === fire.parcel_id)?.name ||
                                  fire.parcel_id}
                              </strong>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* =====================================================
          LÉGENDE COMPLÈTE EN BAS À DROITE
      ===================================================== */}
      <div className="absolute bottom-4 right-4 z-[1000] rounded-xl bg-white/95 dark:bg-slate-900/95 p-3 shadow-lg backdrop-blur border border-gray-200 dark:border-slate-700 text-xs">
        <p className="mb-2 font-bold text-gray-800 dark:text-white">Légende interactive</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm border border-emerald-600 bg-emerald-400 opacity-60"></span>
            <span className="text-gray-700 dark:text-slate-300">Parcelle sécurisée</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm border border-red-600 bg-red-400 opacity-80"></span>
            <span className="font-medium text-red-700 dark:text-red-400">
              Parcelle menacée (&lt; {radiusKm} km)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">🔥</span>
            <span className="text-gray-700 dark:text-slate-300">Foyer de feu actif (NASA)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-dashed border-red-500 bg-red-200 opacity-60"></span>
            <span className="text-gray-700 dark:text-slate-300">Zone tampon ({radiusKm} km)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   POPUP DE DÉTAIL D'UNE PARCELLE
========================================================= */

const ZoomToParcelButton = ({ center }) => {
  const map = useMap();
  if (!center) return null;
  return (
    <button
      type="button"
      onClick={() => map.flyTo(center, 17, { duration: 1.2 })}
      className="mt-2.5 w-full cursor-pointer rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-800"
    >
      Zoomer sur cette parcelle
    </button>
  );
};

const ParcelPopup = ({
  parcel,
  parcelDetails,
  parcelLoading,
  selectedParcelId,
  threatInfo,
  radiusKm,
  centroid,
}) => {
  const isSelected = selectedParcelId === parcel.uuid;
  // Utiliser immédiatement les données de parcel comme socle garanti, enrichies par parcelDetails si chargé
  const details =
    isSelected && parcelDetails?.data
      ? parcelDetails.data
      : parcelDetails?.data || parcelDetails || parcel;

  const farmer = details?.farmer || parcel?.farmer;
  const coop = details?.cooperative || parcel?.cooperative;
  const parcelName = parcel.name || details?.name || "Parcelle agricole";
  const areaVal = details?.area_ha ?? parcel.area_ha;

  return (
    <div className="min-w-[270px] text-sm">
      {/* Alerte si la parcelle est menacée */}
      {threatInfo ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs">
          <div className="flex items-center justify-between font-bold text-red-800">
            <span>Zone de risque incendie</span>
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700 font-bold">
              {Number(threatInfo.distance_m).toFixed(0)} m
            </span>
          </div>
          <p className="mt-1 text-red-700">
            Foyer actif à <strong>{Number(threatInfo.distance_m).toFixed(0)} mètres</strong> !
          </p>
          <p className="text-[11px] text-red-600 mt-0.5">
            Zone tampon paramétrée : {radiusKm} km
          </p>
        </div>
      ) : (
        <div className="mb-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs font-semibold text-emerald-800">
          <span>Parcelle sécurisée (aucun feu &lt; {radiusKm} km)</span>
        </div>
      )}

      <div className="mb-2 flex items-center justify-between border-b pb-1.5">
        <h3 className="text-sm font-bold text-gray-900">
          {parcelName}
        </h3>
        {parcelLoading && isSelected && (
          <span className="text-[10px] italic text-gray-400">Actualisation...</span>
        )}
      </div>

      <div className="space-y-1.5 text-xs text-gray-700">
        <div className="flex justify-between py-0.5 border-b border-gray-100">
          <span className="text-gray-500">Superficie :</span>
          <span className="font-bold text-emerald-800">
            {Number.isFinite(Number(areaVal))
              ? `${Number(areaVal).toFixed(3)} ha (${Math.round(Number(areaVal) * 10000).toLocaleString("fr-FR")} m²)`
              : "N/A"}
          </span>
        </div>

        {farmer && (
          <div className="flex justify-between py-0.5 border-b border-gray-100">
            <span className="text-gray-500">Producteur :</span>
            <span className="font-semibold text-gray-900">
              {farmer.full_name || "N/A"}
            </span>
          </div>
        )}

        {farmer?.phone && (
          <div className="flex justify-between py-0.5 border-b border-gray-100">
            <span className="text-gray-500">Téléphone mobile :</span>
            <a
              href={`tel:${farmer.phone}`}
              className="font-mono font-bold text-emerald-700 hover:underline"
              title="Appeler ou envoyer un SMS"
            >
              📱 {farmer.phone}
            </a>
          </div>
        )}

        {farmer?.id_card && (
          <div className="flex justify-between py-0.5 border-b border-gray-100">
            <span className="text-gray-500">CIN :</span>
            <span className="font-mono text-[11px] text-gray-700">
              {farmer.id_card}
            </span>
          </div>
        )}

        {coop && (
          <div className="flex justify-between py-0.5 border-b border-gray-100">
            <span className="text-gray-500">Coopérative :</span>
            <span className="font-medium text-gray-800">
              {coop.name || "N/A"}
            </span>
          </div>
        )}

        {/* <div className="flex justify-between py-0.5 border-b border-gray-100">
          <span className="text-gray-500">ID Parcelle :</span>
          <span className="font-mono text-[10px] text-gray-500 truncate max-w-[130px]" title={parcel.uuid}>
            {parcel.uuid}
          </span>
        </div> */}
      </div>

      <ZoomToParcelButton center={centroid} />
    </div>
  );
};

export default FireMap;