import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Upload, Save, Map, FileArchive, Loader2, Pencil, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import {
    createNewParcel,
    importNewParcelFile,
    getParcelById,
    updateExistingParcel,
    getAllParcelsByCooperative,
    getAllMyParcels,
} from "../../services/parcelService";
import { MapContainer, TileLayer, GeoJSON, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { getAllFarmersByCooperative } from "../../services/farmerService";
import { getAllCooperatives } from "../../services/cooperativeService";

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

function DrawControl({ onCreated, onEdited, onDeleted, initialGeometry }) {
    const map = useMap();
    const drawnItemsRef = useRef(null);
    const hasLoadedInitialRef = useRef(false);

    // Initialisation unique du FeatureGroup et du contrôle Leaflet Draw
    useEffect(() => {
        if (!map) return;

        const drawnItems = new L.FeatureGroup();
        drawnItemsRef.current = drawnItems;
        map.addLayer(drawnItems);

        const drawControl = new L.Control.Draw({
            position: "topright",
            draw: {
                polygon: {
                    allowIntersection: false,
                    showArea: false,
                    shapeOptions: {
                        color: "#1B4332",
                        weight: 3,
                        fillColor: "#40916C",
                        fillOpacity: 0.35,
                    },
                },
                rectangle: {
                    showArea: false,
                    shapeOptions: {
                        color: "#1B4332",
                        weight: 3,
                        fillColor: "#40916C",
                        fillOpacity: 0.35,
                    },
                },
                polyline: false,
                circle: false,
                circlemarker: false,
                marker: false,
            },
            edit: {
                featureGroup: drawnItems,
                remove: true,
            },
        });

        map.addControl(drawControl);

        const createdHandler = (event) => {
            const layer = event.layer;
            drawnItems.addLayer(layer);
            const geojson = layer.toGeoJSON();
            console.log("PARCELLE CRÉÉE :", geojson);
            if (onCreated) onCreated(geojson, layer);
        };

        const editedHandler = (event) => {
            event.layers.eachLayer((layer) => {
                const geojson = layer.toGeoJSON();
                console.log("PARCELLE MODIFIÉE :", geojson);
                if (onEdited) onEdited(geojson, layer);
            });
        };

        const deletedHandler = (event) => {
            event.layers.eachLayer((layer) => {
                console.log("PARCELLE SUPPRIMÉE");
                if (onDeleted) onDeleted(layer);
            });
            if (drawnItems.getLayers().length === 0 && onDeleted) {
                onDeleted(null);
            }
        };

        map.on(L.Draw.Event.CREATED, createdHandler);
        map.on(L.Draw.Event.EDITED, editedHandler);
        map.on(L.Draw.Event.DELETED, deletedHandler);

        return () => {
            map.off(L.Draw.Event.CREATED, createdHandler);
            map.off(L.Draw.Event.EDITED, editedHandler);
            map.off(L.Draw.Event.DELETED, deletedHandler);
            map.removeControl(drawControl);
            map.removeLayer(drawnItems);
            drawnItemsRef.current = null;
        };
    }, [map, onCreated, onEdited, onDeleted]);

    // Chargement de la géométrie initiale dans drawnItems
    useEffect(() => {
        if (!map || !initialGeometry || !drawnItemsRef.current) return;

        const drawnItems = drawnItemsRef.current;

        // Si des calques sont déjà présents et ont été chargés, ne pas réécraser
        if (drawnItems.getLayers().length > 0 && hasLoadedInitialRef.current) {
            return;
        }

        try {
            drawnItems.clearLayers();

            let parsed = initialGeometry;
            if (typeof parsed === "string") {
                try {
                    parsed = JSON.parse(parsed);
                } catch (e) {
                    console.error("Erreur parsing initialGeometry :", e);
                }
            }

            const geoJsonData =
                parsed.type === "Feature"
                    ? parsed
                    : { type: "Feature", properties: {}, geometry: parsed };

            const geoJsonLayer = L.geoJSON(geoJsonData, {
                style: {
                    color: "#1B4332",
                    weight: 3,
                    fillColor: "#40916C",
                    fillOpacity: 0.35,
                },
            });

            geoJsonLayer.eachLayer((layer) => {
                drawnItems.addLayer(layer);
            });

            hasLoadedInitialRef.current = true;

            const bounds = drawnItems.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
            }

            setTimeout(() => {
                map.invalidateSize();
            }, 150);
        } catch (err) {
            console.error("Erreur chargement géométrie existante sur la carte :", err);
        }
    }, [initialGeometry, map]);

    return null;
}

function calculateRingAreaM2(ring) {
    if (!ring || ring.length < 3) return 0;
    let total = 0;
    const d2r = Math.PI / 180;
    for (let i = 0; i < ring.length - 1; i++) {
        const p1 = ring[i];
        const p2 = ring[i + 1];
        const lon1 = p1[0] * d2r;
        const lat1 = p1[1] * d2r;
        const lon2 = p2[0] * d2r;
        const lat2 = p2[1] * d2r;
        total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    return Math.abs((total * 6378137 * 6378137) / 2);
}

function calculatePolygonAreaHa(geometry) {
    if (!geometry || !geometry.coordinates) return 0;
    try {
        if (geometry.type === "Polygon" && geometry.coordinates[0]) {
            const m2 = calculateRingAreaM2(geometry.coordinates[0]);
            return Number((m2 / 10000).toFixed(3));
        } else if (geometry.type === "MultiPolygon" && geometry.coordinates) {
            let totalM2 = 0;
            for (const poly of geometry.coordinates) {
                if (poly && poly[0]) {
                    totalM2 += calculateRingAreaM2(poly[0]);
                }
            }
            return Number((totalM2 / 10000).toFixed(3));
        }
    } catch (e) {
        console.error("Erreur calcul superficie :", e);
    }
    return 0;
}

function ParcelForm() {
    const navigate = useNavigate();
    const { uuid } = useParams();
    const [searchParams] = useSearchParams();
    const [cooperatives, setCooperatives] = useState([]);
    const [loadingCooperatives, setLoadingCooperatives] = useState(true);

    const rawCoopParam = searchParams.get("cooperative_id");
    const initialCoopId =
        rawCoopParam && rawCoopParam !== "null" && rawCoopParam !== "undefined"
            ? rawCoopParam
            : "";

    const [cooperativeId, setCooperativeId] = useState(initialCoopId);

    const isEdit = Boolean(uuid);

    const [farmers, setFarmers] = useState([]);
    const [loadingFarmers, setLoadingFarmers] = useState(true);
    const [loadingParcel, setLoadingParcel] = useState(isEdit);

    const [farmerId, setFarmerId] = useState("");
    const [name, setName] = useState("");
    const [existingParcels, setExistingParcels] = useState([]);
    const [file, setFile] = useState(null);
    const [areaHa, setAreaHa] = useState("");
    const [geometry, setGeometry] = useState(null);

    const [saving, setSaving] = useState(false);
    const [drawnGeometry, setDrawnGeometry] = useState(null);
    const [previewLayer, setPreviewLayer] = useState(null);

    // Maintient la référence vers l'agriculteur de la parcelle pour ne pas être écrasé par loadFarmers
    const targetFarmerIdRef = useRef("");

    const handleParcelCreated = useCallback((geojson, layer) => {
        console.log("Nouvelle parcelle dessinée :", geojson);
        setGeometry(geojson.geometry);
        setDrawnGeometry(geojson);
        setPreviewLayer(layer);

        const computedHa = calculatePolygonAreaHa(geojson.geometry);
        if (computedHa > 0) {
            setAreaHa(computedHa);
        }
    }, []);

    const handleParcelEdited = useCallback((geojson, layer) => {
        console.log("Parcelle modifiée :", geojson);
        setGeometry(geojson.geometry);
        setDrawnGeometry(geojson);
        setPreviewLayer(layer);

        const computedHa = calculatePolygonAreaHa(geojson.geometry);
        if (computedHa > 0) {
            setAreaHa(computedHa);
        }
    }, []);

    const handleParcelDeleted = useCallback(() => {
        console.log("Parcelle supprimée");
        setGeometry(null);
        setDrawnGeometry(null);
        setPreviewLayer(null);
        setAreaHa("");
    }, []);

    // Chargement des agriculteurs selon la coopérative
    useEffect(() => {
        const loadFarmers = async () => {
            if (!cooperativeId) {
                setFarmers([]);
                if (!isEdit) setFarmerId("");
                setLoadingFarmers(false);
                return;
            }

            try {
                setLoadingFarmers(true);
                const result = await getAllFarmersByCooperative(cooperativeId);
                const data = Array.isArray(result?.data) ? result.data : [];
                setFarmers(data);

                // Si un agriculteur a été ciblé par loadParcel, le conserver
                if (targetFarmerIdRef.current) {
                    setFarmerId(targetFarmerIdRef.current);
                } else if (!isEdit) {
                    setFarmerId("");
                }
            } catch (error) {
                console.error("Erreur lors du chargement des agriculteurs :", error);
                setFarmers([]);
                if (!isEdit) setFarmerId("");
                toast.error(
                    error?.response?.data?.error ||
                    "Impossible de charger les agriculteurs."
                );
            } finally {
                setLoadingFarmers(false);
            }
        };

        loadFarmers();
    }, [cooperativeId, isEdit]);

    // Chargement des parcelles voisines de la coopérative
    useEffect(() => {
        const loadParcels = async () => {
            if (!cooperativeId) {
                setExistingParcels([]);
                return;
            }

            try {
                const result = await getAllParcelsByCooperative(cooperativeId);
                const data = Array.isArray(result?.data) ? result.data : [];
                setExistingParcels(data);
            } catch (error) {
                console.warn("Impossible de précharger les parcelles :", error);
                setExistingParcels([]);
            }
        };

        loadParcels();
    }, [cooperativeId]);

    // Chargement des coopératives
    useEffect(() => {
        const loadCooperatives = async () => {
            try {
                setLoadingCooperatives(true);
                const result = await getAllCooperatives();
                const data = Array.isArray(result?.data) ? result.data : [];
                setCooperatives(data);

                // En mode édition, ne jamais forcer la première coopérative
                if (isEdit) {
                    return;
                }

                if (
                    cooperativeId &&
                    data.some((coop) => coop.uuid === cooperativeId)
                ) {
                    return;
                }

                if (data.length > 0) {
                    setCooperativeId(data[0].uuid);
                }
            } catch (error) {
                console.error("Erreur lors du chargement des coopératives :", error);
                setCooperatives([]);
                toast.error(
                    error?.response?.data?.error ||
                    "Impossible de charger les coopératives."
                );
            } finally {
                setLoadingCooperatives(false);
            }
        };

        loadCooperatives();
    }, [isEdit]);

    // ============================================================
    // CHARGER LA PARCELLE EN MODE MODIFICATION
    // ============================================================
    useEffect(() => {
        const loadParcel = async () => {
            if (!isEdit || !uuid) {
                setLoadingParcel(false);
                return;
            }

            try {
                setLoadingParcel(true);

                let parcel = null;
                let targetCoopId = cooperativeId;

                // 1. Tenter de charger directement si targetCoopId est renseigné
                if (targetCoopId && targetCoopId !== "null" && targetCoopId !== "undefined") {
                    try {
                        const result = await getParcelById(targetCoopId, uuid);
                        parcel = result?.data;
                    } catch (e) {
                        console.warn("getParcelById a échoué avec targetCoopId :", e);
                    }
                }

                // 2. Si non trouvée, rechercher dans toutes les parcelles de l'utilisateur
                if (!parcel) {
                    try {
                        const myParcelsRes = await getAllMyParcels();
                        const myParcelsList = Array.isArray(myParcelsRes?.data)
                            ? myParcelsRes.data
                            : Array.isArray(myParcelsRes)
                            ? myParcelsRes
                            : [];

                        const found = myParcelsList.find(
                            (p) => p.uuid === uuid || String(p.id) === String(uuid)
                        );

                        if (found) {
                            const resolvedCoopId = found.cooperative_id || found.cooperative?.uuid;
                            if (resolvedCoopId) {
                                targetCoopId = resolvedCoopId;
                                setCooperativeId(resolvedCoopId);
                                try {
                                    const detailed = await getParcelById(resolvedCoopId, uuid);
                                    parcel = detailed?.data || found;
                                } catch {
                                    parcel = found;
                                }
                            } else {
                                parcel = found;
                            }
                        }
                    } catch (e) {
                        console.warn("Recherche fallback dans getAllMyParcels :", e);
                    }
                }

                if (!parcel) {
                    toast.error("Parcelle introuvable.");
                    navigate("/parcels", { replace: true });
                    return;
                }

                const resolvedFarmerId = parcel.farmer_id || parcel.farmer?.uuid || "";
                targetFarmerIdRef.current = resolvedFarmerId;
                setFarmerId(resolvedFarmerId);
                setName(parcel.name || "");
                setAreaHa(parcel.area_ha ?? "");

                if (parcel.cooperative_id) {
                    setCooperativeId(parcel.cooperative_id);
                }

                // Charger la géométrie existante pour la carte et le calcul
                const geom = parcel.geom || parcel.geom_geojson;
                if (geom) {
                    let parsed = geom;
                    if (typeof parsed === "string") {
                        try {
                            parsed = JSON.parse(parsed);
                        } catch (e) {
                            console.error("Erreur parsing geom :", e);
                            parsed = null;
                        }
                    }
                    if (parsed) {
                        const cleanGeom = parsed.type === "Feature" ? parsed.geometry : parsed;
                        setGeometry(cleanGeom);
                        setDrawnGeometry({
                            type: "Feature",
                            properties: { name: parcel.name },
                            geometry: cleanGeom,
                        });
                    }
                }
            } catch (error) {
                console.error("Erreur lors du chargement de la parcelle :", error);
                toast.error(
                    error?.response?.data?.error ||
                    "Impossible de charger la parcelle."
                );
            } finally {
                setLoadingParcel(false);
            }
        };

        loadParcel();
    }, [isEdit, uuid, navigate]);

    // ============================================================
    // FICHIER
    // ============================================================

    const handleFileChange = (event) => {
        const selectedFile = event.target.files?.[0];

        if (!selectedFile) {
            setFile(null);
            return;
        }

        const fileName = selectedFile.name.toLowerCase();

        const allowed =
            fileName.endsWith(".kml") ||
            fileName.endsWith(".gpkg") ||
            fileName.endsWith(".zip");

        if (!allowed) {
            toast.error(
                "Format non supporté. Utilisez KML, GeoPackage ou Shapefile ZIP."
            );

            event.target.value = "";
            setFile(null);
            return;
        }

        setFile(selectedFile);
    };

    // ============================================================
    // ENREGISTREMENT
    // ============================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!cooperativeId) {
            toast.error("Coopérative introuvable.");
            return;
        }

        if (!farmerId) {
            toast.error("Veuillez sélectionner un agriculteur.");
            return;
        }

        const trimmedName = (name || "").trim().toLowerCase();
        const hasDuplicateName = Boolean(
            trimmedName &&
            existingParcels.some((p) => {
                if (isEdit && p.uuid === uuid) return false;
                return (p.name || "").trim().toLowerCase() === trimmedName;
            })
        );

        if (hasDuplicateName) {
            toast.error(
                `Une parcelle nommée "${name.trim()}" existe déjà dans cette coopérative. Veuillez choisir un autre nom.`
            );
            return;
        }

        try {
            setSaving(true);

            // --------------------------------------------------------
            // MODE IMPORT
            // --------------------------------------------------------

            if (file) {
                const result = await importNewParcelFile(
                    cooperativeId,
                    file,
                    farmerId,
                    name.trim() || undefined
                );

                toast.success(
                    result?.message ||
                    "Parcelle(s) enregistrée(s) avec succès."
                );

                setTimeout(() => {
                    navigate(
                        `/parcels?cooperative_id=${cooperativeId}`
                    );
                }, 500);

                return;
            }

            // --------------------------------------------------------
            // MODE MODIFICATION
            // --------------------------------------------------------

            if (isEdit) {
                const updatePayload = {
                    farmer_id: farmerId,
                    name: name.trim() || null,
                };

                if (geometry) {
                    if (
                        geometry.type !== "Polygon" &&
                        geometry.type !== "MultiPolygon"
                    ) {
                        toast.error(
                            "La géométrie doit être un Polygon ou un MultiPolygon."
                        );
                        return;
                    }
                    updatePayload.geom = geometry;
                }

                await updateExistingParcel(cooperativeId, uuid, updatePayload);

                toast.success("Parcelle modifiée avec succès.");

                setTimeout(() => {
                    navigate(
                        `/parcels/${uuid}?cooperative_id=${cooperativeId}`
                    );
                }, 500);

                return;
            }

            // --------------------------------------------------------
            // MODE CRÉATION JSON
            // --------------------------------------------------------

            const data = {
                farmer_id: farmerId,
                name: name.trim() || null,
            };

            if (!geometry) {
                toast.error(
                    "Veuillez dessiner la parcelle sur la carte."
                );
                return;
            }

            if (
                geometry.type !== "Polygon" &&
                geometry.type !== "MultiPolygon"
            ) {
                toast.error(
                    "La géométrie doit être un Polygon ou un MultiPolygon."
                );
                return;
            }

            data.geom = geometry;

            await createNewParcel(cooperativeId, data);

            toast.success("Parcelle créée avec succès.");

            setTimeout(() => {
                navigate(
                    `/parcels?cooperative_id=${cooperativeId}`
                );
            }, 500);
        } catch (error) {
            console.error(
                "Erreur lors de l'enregistrement :",
                error
            );

            toast.error(
                error?.response?.data?.error ||
                error?.message ||
                "Impossible d'enregistrer la parcelle."
            );
        } finally {
            setSaving(false);
        }
    };

    // ============================================================
    // CHARGEMENT
    // ============================================================

    if (loadingParcel) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={36}
                        className="animate-spin text-green-700 dark:text-emerald-500"
                    />

                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        Chargement de la parcelle...
                    </p>
                </div>
            </div>
        );
    }

    // ============================================================
    // AFFICHAGE
    // ============================================================

    return (
        <div className="mx-auto space-y-6">
            {/* EN-TÊTE */}

            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            isEdit && uuid
                                ? `/parcels/${uuid}?cooperative_id=${cooperativeId}`
                                : `/parcels${cooperativeId ? `?cooperative_id=${cooperativeId}` : ""}`
                        )
                    }
                    className="rounded-xl cursor-pointer border border-gray-200 dark:border-slate-800 p-2.5 text-gray-500 dark:text-slate-400 transition hover:bg-gray-50 dark:hover:bg-slate-800"
                    title="Retour"
                >
                    <ArrowLeft size={19} />
                </button>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isEdit
                            ? "Modifier la parcelle"
                            : "Ajouter une parcelle"}
                    </h1>

                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                        Enregistrez les informations de la parcelle
                        agricole.
                    </p>
                </div>
            </div>

            {/* FORMULAIRE */}

            {isEdit && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/40 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                            <Pencil size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-200">
                                {name ? `Modification : « ${name} »` : "Modification de la parcelle"}
                            </p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400">
                                {areaHa ? `Superficie actuelle : ${Number(areaHa).toFixed(3)} ha` : "Superficie à délimiter"}
                                {geometry ? " — Tracé géographique chargé" : ""}
                            </p>
                        </div>
                    </div>
                    <span className="self-start sm:self-auto rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        Édition active
                    </span>
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="space-y-6"
            >

                {/* INFORMATIONS GÉNÉRALES */}
                <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                        Informations générales
                    </h2>

                    <div className="grid gap-5 md:grid-cols-2">
                        {/* COOPÉRATIVE */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                                Coopérative{" "}
                                <span className="text-red-500">*</span>
                            </label>

                            <select
                                value={cooperativeId}
                                onChange={(e) => {
                                    setCooperativeId(e.target.value);
                                    setFarmerId("");
                                }}
                                disabled={
                                    loadingCooperatives ||
                                    saving ||
                                    isEdit
                                }
                                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-gray-900 dark:text-slate-100 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-50 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500"
                            >
                                <option value="" className="dark:bg-slate-800">
                                    {loadingCooperatives
                                        ? "Chargement..."
                                        : "Sélectionner une coopérative"}
                                </option>

                                {cooperatives.map((cooperative) => (
                                    <option
                                        key={cooperative.uuid}
                                        value={cooperative.uuid}
                                        className="dark:bg-slate-800"
                                    >
                                        {cooperative.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* AGRICULTEUR */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                                Agriculteur{" "}
                                <span className="text-red-500">*</span>
                            </label>

                            <select
                                value={farmerId}
                                onChange={(e) =>
                                    setFarmerId(e.target.value)
                                }
                                disabled={
                                    !cooperativeId ||
                                    loadingFarmers ||
                                    saving
                                }
                                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-gray-900 dark:text-slate-100 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-50 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500"
                            >
                                <option value="" className="dark:bg-slate-800">
                                    {!cooperativeId
                                        ? "Sélectionnez d'abord une coopérative"
                                        : loadingFarmers
                                            ? "Chargement..."
                                            : farmers.length === 0
                                                ? "Aucun agriculteur trouvé"
                                                : "Sélectionner un agriculteur"}
                                </option>

                                {farmers.map((farmer) => (
                                    <option
                                        key={farmer.uuid}
                                        value={farmer.uuid}
                                        className="dark:bg-slate-800"
                                    >
                                        {farmer.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* NOM DE LA PARCELLE */}
                    {(() => {
                        const trimmed = (name || "").trim().toLowerCase();
                        const isDuplicate = Boolean(
                            trimmed &&
                            existingParcels.some((p) => {
                                if (isEdit && p.uuid === uuid) return false;
                                return (p.name || "").trim().toLowerCase() === trimmed;
                            })
                        );

                        return (
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                                    Nom de la parcelle
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex : Parcelle Nord, Champ Vanille 1, Lot 4..."
                                    disabled={saving}
                                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 disabled:bg-gray-50 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500 ${
                                        isDuplicate
                                            ? "border-red-400 bg-red-50/40 text-red-900 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200 focus:border-red-500 focus:ring-red-500/20"
                                            : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:border-green-600 focus:ring-green-500/20"
                                    }`}
                                />
                                {isDuplicate ? (
                                    <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
                                        <span>⚠️</span>
                                        <span>Une parcelle nommée &ldquo;{name.trim()}&rdquo; existe déjà dans cette coopérative.</span>
                                    </p>
                                ) : (
                                    <p className="mt-1.5 text-xs text-gray-400 dark:text-slate-500">
                                        Optionnel : donnez un nom à la parcelle pour la distinguer rapidement dans la liste et les cartes.
                                    </p>
                                )}
                            </div>
                        );
                    })()}

                    {/* SUPERFICIE CALCULÉE */}
                    {areaHa && (
                        <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-slate-400">Superficie calculée :</span>
                            <span className="font-semibold text-sm text-green-700 dark:text-emerald-400">
                                {Number(areaHa).toFixed(3)} ha
                            </span>
                        </div>
                    )}
                </div>

                {/* IMPORT */}

                {!isEdit && (
                    <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-emerald-950/60 text-green-700 dark:text-emerald-400">
                                <Upload size={20} />
                            </div>

                            <div>
                                <h2 className="font-semibold text-gray-900 dark:text-white">
                                    Importer une parcelle
                                </h2>

                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    Importez une géométrie existante.
                                </p>
                            </div>
                        </div>

                        <label
                            htmlFor="parcel-file"
                            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 px-6 py-10 text-center transition hover:border-green-500 dark:hover:border-emerald-500 hover:bg-green-50/50 dark:hover:bg-emerald-950/20"
                        >
                            <FileArchive
                                size={38}
                                className="mb-3 text-gray-400 dark:text-slate-500"
                            />

                            {file ? (
                                <>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {file.name}
                                    </p>

                                    <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} Mo
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        Cliquez pour sélectionner un fichier
                                    </p>

                                    <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">
                                        Formats acceptés : KML, GeoPackage (.gpkg)
                                        ou Shapefile ZIP (.zip)
                                    </p>
                                </>
                            )}

                            <input
                                id="parcel-file"
                                type="file"
                                accept=".kml,.gpkg,.zip"
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={saving}
                            />
                        </label>

                        {file && (
                            <button
                                type="button"
                                onClick={() => setFile(null)}
                                className="mt-3 text-sm text-red-600 dark:text-red-400 hover:underline"
                            >
                                Retirer le fichier
                            </button>
                        )}
                    </div>
                )}


                {/* ====================================================== */}
                {/* CARTE & DÉLIMITATION GÉOGRAPHIQUE                      */}
                {/* ====================================================== */}

                <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-emerald-950/60 text-green-700 dark:text-emerald-400">
                                <Map size={20} />
                            </div>

                            <div>
                                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span>{isEdit ? "Modification du tracé de la parcelle" : "Délimitation de la parcelle"}</span>
                                    {isEdit && (
                                        <span className="rounded-full bg-amber-100 dark:bg-amber-900/60 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                            Mode modification
                                        </span>
                                    )}
                                </h2>

                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    {isEdit
                                        ? "Ajustez les sommets du polygone existant ou redessinez le contour."
                                        : "Dessinez la parcelle directement sur la carte."}
                                </p>
                            </div>
                        </div>

                        {areaHa && (
                            <span className="self-start sm:self-auto rounded-full bg-green-50 dark:bg-emerald-950/60 px-3.5 py-1 text-xs font-bold text-green-800 dark:text-emerald-300 border border-green-200 dark:border-emerald-800">
                                Superficie : {Number(areaHa).toFixed(3)} ha
                            </span>
                        )}
                    </div>

                    {isEdit && (
                        <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/40 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                            <div className="space-y-0.5">
                                <p className="font-semibold text-amber-950 dark:text-amber-200">Comment modifier le tracé existant :</p>
                                <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
                                    • Cliquez sur l'icône de <strong>modification (crayon)</strong> en haut à droite de la carte pour faire apparaître les poignées de sommets, puis glissez-les pour ajuster les bordures.<br />
                                    • Cliquez sur <strong>Save</strong> dans la barre Leaflet pour enregistrer le nouveau tracé.<br />
                                    • Pour recommencer à zéro, cliquez sur l'icône <strong>poubelle</strong> pour effacer, puis utilisez l'outil <strong>polygone</strong> pour tracer un nouveau contour.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="h-[520px] overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 relative">
                        <MapContainer
                            key={`map-edit-${uuid || "new"}`}
                            center={[-18.8792, 47.5079]}
                            zoom={13}
                            style={{
                                height: "520px",
                                width: "100%",
                            }}
                        >
                            <TileLayer
                                attribution="&copy; OpenStreetMap contributors"
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {/* Repères des parcelles voisines de la coopérative */}
                            {existingParcels.map((p) => {
                                if (isEdit && (p.uuid === uuid || String(p.id) === String(uuid))) return null;
                                const pGeom = p.geom || p.geom_geojson;
                                if (!pGeom) return null;
                                let parsedPGeom = null;
                                try {
                                    parsedPGeom = typeof pGeom === "string" ? JSON.parse(pGeom) : pGeom;
                                } catch {
                                    return null;
                                }
                                if (!parsedPGeom) return null;
                                return (
                                    <GeoJSON
                                        key={`neigh-${p.uuid || p.id}`}
                                        data={parsedPGeom}
                                        style={{
                                            color: "#9ca3af",
                                            weight: 1.5,
                                            dashArray: "4, 4",
                                            fillColor: "#e5e7eb",
                                            fillOpacity: 0.2,
                                        }}
                                    >
                                        <Popup>
                                            <div className="text-xs font-semibold text-gray-700 dark:text-slate-200">
                                                {p.name || "Autre parcelle"} ({Number(p.area_ha || 0).toFixed(2)} ha)
                                            </div>
                                        </Popup>
                                    </GeoJSON>
                                );
                            })}

                            <MapResizer />

                            <DrawControl
                                initialGeometry={geometry}
                                onCreated={handleParcelCreated}
                                onEdited={handleParcelEdited}
                                onDeleted={handleParcelDeleted}
                            />
                        </MapContainer>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                        {geometry ? (
                            <p className="font-medium text-green-700 dark:text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle2 size={15} />
                                <span>
                                    Tracé géoréférencé valide
                                    {areaHa ? ` — Superficie calculée : ${Number(areaHa).toFixed(3)} ha` : ""}.
                                </span>
                            </p>
                        ) : (
                            <p className="text-gray-400 dark:text-slate-500">
                                Utilisez l'outil polygone en haut à droite pour délimiter la parcelle.
                            </p>
                        )}

                        <span className="text-gray-400 dark:text-slate-500">Système géodésique WGS84 (EPSG:4326)</span>
                    </div>
                </div>

                {/* BOUTONS */}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                isEdit && uuid
                                    ? `/parcels/${uuid}?cooperative_id=${cooperativeId}`
                                    : `/parcels${cooperativeId ? `?cooperative_id=${cooperativeId}` : ""}`
                            )
                        }
                        disabled={saving}
                        className="cursor-pointer rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 text-sm font-medium text-gray-600 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                    >
                        Annuler
                    </button>

                    <button
                        type="submit"
                        disabled={saving || loadingFarmers}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-green-700 dark:bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 dark:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2
                                    size={18}
                                    className="animate-spin"
                                />
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                {isEdit
                                    ? "Enregistrer les modifications"
                                    : "Enregistrer la parcelle"}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ParcelForm;