import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    Pencil,
    Map,
    User,
    Calendar,
    Ruler,
    Loader2,
    Database,
    Building2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
    MapContainer,
    TileLayer,
    GeoJSON,
    useMap,
    Popup,
} from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

import { getParcelById } from "../../services/parcelService";
import { getFarmerById } from "../../services/farmerService";
import { getCooperativeById } from "../../services/cooperativeService";
import { useAuth } from "../../context/AuthContext";

function FitParcelBounds({ geojson }) {
    const map = useMap();

    useEffect(() => {
        if (!geojson) return;

        const layer = L.geoJSON(geojson);
        const bounds = layer.getBounds();

        if (bounds.isValid()) {
            map.fitBounds(bounds, {
                padding: [30, 30],
            });
        }
    }, [geojson, map]);

    return null;
}

const parcelStyle = {
    color: "#1B4332",
    weight: 3,
    fillColor: "#40916C",
    fillOpacity: 0.35,
};

function onEachParcel(feature, layer, parcel) {
    const farmerName =
        parcel.farmer?.full_name || "Non renseigné";

    const cooperativeName =
        parcel.cooperative?.name || "Non renseignée";

    const area =
        parcel.area_ha !== null &&
            parcel.area_ha !== undefined
            ? `${Number(parcel.area_ha).toFixed(2)} ha`
            : "Non renseignée";

    const createdAt = parcel.created_at
        ? new Date(parcel.created_at).toLocaleDateString("fr-FR")
        : "Non renseignée";

    layer.bindPopup(`
        <div style="min-width: 220px;">
            <h3 style="
                margin: 0 0 10px 0;
                font-weight: 700;
                font-size: 16px;
            ">
                ${parcel.name || "Parcelle agricole"}
            </h3>

            <div style="margin-bottom: 6px;">
                <strong>👨‍🌾 Agriculteur :</strong><br>
                ${farmerName}
            </div>

            <div style="margin-bottom: 6px;">
                <strong>🏢 Coopérative :</strong><br>
                ${cooperativeName}
            </div>

            <div style="margin-bottom: 6px;">
                <strong>📐 Superficie :</strong><br>
                ${area}
            </div>

            <div>
                <strong>📅 Créée le :</strong><br>
                ${createdAt}
            </div>
        </div>
    `);
}

function ParcelDetails() {
    const navigate = useNavigate();
    const { uuid } = useParams();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const isBioAuditor = user?.role === "bio_auditor";

    const cooperativeId = searchParams.get("cooperative_id");

    const [parcel, setParcel] = useState(null);
    const [farmer, setFarmer] = useState(null);
    const [cooperative, setCooperative] = useState(null);
    const [loading, setLoading] = useState(true);

    // ============================================================
    // CHARGEMENT
    // ============================================================

    useEffect(() => {
        const loadData = async () => {
            if (!cooperativeId || !uuid) {
                toast.error("Informations de parcelle incomplètes.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                const result = await getParcelById(
                    cooperativeId,
                    uuid
                );

                const parcelData = result?.data;

                if (!parcelData) {
                    toast.error("Parcelle introuvable.");
                    return;
                }

                setParcel(parcelData);

                // Récupération de la coopérative
                if (parcelData.cooperative) {
                    setCooperative(parcelData.cooperative);
                } else if (cooperativeId) {
                    try {
                        const coopResult =
                            await getCooperativeById(cooperativeId);
                        setCooperative(
                            coopResult?.data || coopResult || null
                        );
                    } catch (coopError) {
                        console.error(
                            "Erreur lors du chargement de la coopérative :",
                            coopError
                        );
                    }
                }

                // Récupération de l'agriculteur
                if (parcelData.farmer_id) {
                    try {
                        const farmerResult =
                            await getFarmerById(
                                cooperativeId,
                                parcelData.farmer_id
                            );

                        setFarmer(farmerResult?.data || null);
                    } catch (farmerError) {
                        console.error(
                            "Erreur lors du chargement de l'agriculteur :",
                            farmerError
                        );
                    }
                }
            } catch (error) {
                console.error(
                    "Erreur lors du chargement de la parcelle :",
                    error
                );

                toast.error(
                    error?.response?.data?.error ||
                    error?.message ||
                    "Impossible de charger la parcelle."
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [cooperativeId, uuid]);

    // ============================================================
    // FORMATAGE
    // ============================================================

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const formatArea = (area) => {
        if (
            area === null ||
            area === undefined ||
            area === ""
        ) {
            return "Non renseignée";
        }

        const number = Number(area);

        if (Number.isNaN(number)) {
            return "Non renseignée";
        }

        return `${number.toFixed(2)} ha`;
    };

    // ============================================================
    // CHARGEMENT
    // ============================================================

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={36}
                        className="animate-spin text-green-700 dark:text-emerald-400"
                    />

                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        Chargement de la parcelle...
                    </p>
                </div>
            </div>
        );
    }

    if (!parcel) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                <Map
                    size={45}
                    className="mb-4 text-gray-300 dark:text-slate-600"
                />

                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Parcelle introuvable
                </h2>

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            `/parcels?cooperative_id=${cooperativeId}`
                        )
                    }
                    className="mt-5 rounded-lg cursor-pointer bg-green-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                >
                    Retour aux parcelles
                </button>
            </div>
        );
    }

    console.log("PARCELLE :", parcel);
    console.log("GEOMETRIE :", parcel?.geom);
    // ============================================================
    // AFFICHAGE
    // ============================================================

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {/* EN-TÊTE */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                `/parcels`
                            )
                        }
                        className="cursor-pointer rounded-xl border border-gray-200 dark:border-slate-800 p-2.5 text-gray-500 dark:text-slate-400 transition hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                        <ArrowLeft size={19} />
                    </button>

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {parcel.name || "Détails de la parcelle"}
                        </h1>

                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            Informations et données géographiques.
                        </p>
                    </div>
                </div>

                {!isBioAuditor && (
                    <button
                        type="button"
                        onClick={() => {
                            const targetCoop = parcel.cooperative_id || parcel.cooperative?.uuid || cooperativeId;
                            navigate(
                                `/parcels/${parcel.uuid}/edit${targetCoop && targetCoop !== "null" ? `?cooperative_id=${targetCoop}` : ""}`
                            );
                        }}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                    >
                        <Pencil size={18} />
                        Modifier
                    </button>
                )}
            </div>

            {/* IDENTIFICATION */}

            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-green-100 dark:bg-emerald-950/70 text-green-700 dark:text-emerald-400">
                        <Map size={30} />
                    </div>

                    <div className="min-w-0">
                        {parcel.name && (
                            <span className="mb-1 inline-block rounded-md bg-green-100 dark:bg-emerald-950/70 px-2 py-0.5 text-xs font-semibold text-green-800 dark:text-emerald-300">
                                Nom de la parcelle
                            </span>
                        )}

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {parcel.name || "Parcelle"}
                        </h2>
                    </div>
                </div>
            </div>

            {/* INFORMATIONS */}

            <div className="grid gap-6 md:grid-cols-2">
                {/* AGRICULTEUR */}

                <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-emerald-950/70 text-green-700 dark:text-emerald-400">
                            <User size={20} />
                        </div>

                        <h2 className="font-semibold text-gray-900 dark:text-white">
                            Agriculteur
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-gray-400 dark:text-slate-500">
                                Nom complet
                            </p>

                            <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                {farmer?.full_name ||
                                    "Agriculteur non chargé"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* SUPERFICIE */}

                <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-emerald-950/70 text-green-700 dark:text-emerald-400">
                            <Ruler size={20} />
                        </div>

                        <h2 className="font-semibold text-gray-900 dark:text-white">
                            Superficie
                        </h2>
                    </div>

                    <p className="text-3xl font-bold text-green-700 dark:text-emerald-400">
                        {formatArea(parcel.area_ha)}
                    </p>

                    <p className="mt-2 text-sm text-gray-400 dark:text-slate-500">
                        Superficie enregistrée pour cette parcelle
                    </p>
                </div>

                {/* DATE */}

                <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-emerald-950/70 text-green-700 dark:text-emerald-400">
                            <Calendar size={20} />
                        </div>

                        <h2 className="font-semibold text-gray-900 dark:text-white">
                            Informations temporelles
                        </h2>
                    </div>

                    <p className="text-sm text-gray-400 dark:text-slate-500">
                        Date de création
                    </p>

                    <p className="mt-1 font-medium text-gray-900 dark:text-white">
                        {formatDate(parcel.created_at)}
                    </p>
                </div>

                {/* COOPÉRATIVE */}

                <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-emerald-950/70 text-green-700 dark:text-emerald-400">
                            <Building2 size={20} />
                        </div>

                        <h2 className="font-semibold text-gray-900 dark:text-white">
                            Coopérative
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-gray-400 dark:text-slate-500">
                                Nom de la coopérative
                            </p>

                            <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                {cooperative?.name ||
                                    parcel.cooperative?.name ||
                                    "Non renseignée"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-gray-400 dark:text-slate-500">
                                Président
                            </p>

                            <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                {cooperative?.president_name ||
                                    parcel.cooperative?.president_name ||
                                    "Non renseigné"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {parcel.geom && (
                <div className="h-[500px] w-full overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800">
                    <MapContainer
                        center={[0, 0]}
                        zoom={2}
                        className="h-full w-full"
                    >
                        <TileLayer
                            attribution="&copy; OpenStreetMap contributors"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <GeoJSON
                            data={parcel.geom}
                            style={parcelStyle}
                            onEachFeature={(feature, layer) =>
                                onEachParcel(feature, layer, parcel)
                            }
                        />

                        <FitParcelBounds
                            geojson={parcel.geom}
                        />
                    </MapContainer>
                </div>
            )}
        </div>
    );
}

export default ParcelDetails;