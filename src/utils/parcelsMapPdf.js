import { jsPDF } from "jspdf";

/**
 * Utilitaire de génération et téléchargement DIRECT de rapports PDF
 * avec cartographie géoréférencée haute définition des parcelles (sans window.print()).
 * Reproduit fidèlement l'interface de http://localhost:5173/audits/report.
 */

// Polyfill de sécurité pour Canvas roundRect
if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const radius = typeof r === "number" ? r : Array.isArray(r) ? r[0] : 0;
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + w - radius, y);
    this.quadraticCurveTo(x + w, y, x + w, y + radius);
    this.lineTo(x + w, y + h - radius);
    this.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    this.lineTo(x + radius, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
    return this;
  };
}

/**
 * Nettoie les balises HTML pour obtenir un texte brut lisible dans le PDF
 */
function stripHtml(html) {
  if (!html) return "";
  try {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || "").trim();
  } catch {
    return String(html).replace(/<[^>]*>?/gm, "").trim();
  }
}

/**
 * Projette les coordonnées GPS [lng, lat] vers des coordonnées pixels sur le canvas.
 */
function projectToCanvas(lng, lat, bbox, width, height, padding = 55) {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const lngSpan = Math.max(maxLng - minLng, 0.0001);
  const latSpan = Math.max(maxLat - minLat, 0.0001);

  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  const avgLat = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const cosLat = Math.max(Math.cos(avgLat), 0.2);

  const scaleX = (drawWidth / lngSpan) * cosLat;
  const scaleY = drawHeight / latSpan;
  const scale = Math.min(scaleX, scaleY);

  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;

  const centerX = width / 2;
  const centerY = height / 2;

  const x = centerX + (lng - centerLng) * scale;
  const y = centerY - (lat - centerLat) * (scale / cosLat);

  return [x, y];
}

/**
 * Calcule la boîte englobante de toutes les parcelles
 */
function computeParcelsBoundingBox(parcels) {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  let found = false;

  parcels.forEach((p) => {
    const parcelObj = p.parcel || p;
    const geom = parcelObj?.geom || parcelObj?.geom_geojson;
    if (geom) {
      try {
        const parsed = typeof geom === "string" ? JSON.parse(geom) : geom;
        const coordinates =
          parsed.type === "Polygon"
            ? parsed.coordinates
            : parsed.type === "MultiPolygon"
            ? parsed.coordinates.flat()
            : [];

        coordinates.forEach((ring) => {
          ring.forEach(([lng, lat]) => {
            if (!isNaN(lng) && !isNaN(lat)) {
              found = true;
              minLng = Math.min(minLng, lng);
              minLat = Math.min(minLat, lat);
              maxLng = Math.max(maxLng, lng);
              maxLat = Math.max(maxLat, lat);
            }
          });
        });
      } catch (e) {
        // Ignorer erreur de parsing géométrique
      }
    }

    const lat = parseFloat(parcelObj?.latitude);
    const lng = parseFloat(parcelObj?.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      found = true;
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    }
  });

  if (!found) {
    // Coordonnées par défaut sur Madagascar
    return [47.45, -18.95, 47.58, -18.82];
  }

  // Marge de sécurité de 25% pour centrage aéré
  const lngSpan = maxLng - minLng;
  const latSpan = maxLat - minLat;
  const lngMargin = Math.max(lngSpan * 0.25, 0.008);
  const latMargin = Math.max(latSpan * 0.25, 0.008);

  return [
    minLng - lngMargin,
    minLat - latMargin,
    maxLng + lngMargin,
    maxLat + latMargin,
  ];
}

/**
 * Dessine la carte des parcelles sur un canvas et retourne une Data URL (PNG).
 */
export async function renderParcelsMapImage(parcels = [], options = {}) {
  const width = options.width || 1200;
  const height = options.height || 620;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const bbox = computeParcelsBoundingBox(parcels);

  // 1. Fond cartographique doux avec relief stylisé
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, "#f3f7f4");
  bgGradient.addColorStop(0.5, "#e9f2eb");
  bgGradient.addColorStop(1, "#ddead0");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Grille cartographique subtile
  ctx.strokeStyle = "rgba(74, 115, 87, 0.15)";
  ctx.lineWidth = 1;
  const stepX = width / 10;
  const stepY = height / 7;

  for (let x = 0; x <= width; x += stepX) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += stepY) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 2. Tracé des parcelles
  parcels.forEach((item, index) => {
    const parcel = item.parcel || item;
    const audit = item.audit || {};
    const status = audit.overall_status || parcel.status || "compliant";

    // Couleurs selon le statut de conformité
    let fillColor = "rgba(16, 185, 129, 0.42)"; // Emerald
    let strokeColor = "#059669";
    let badgeBg = "#ecfdf5";
    let badgeText = "#065f46";

    if (status === "non_compliant") {
      fillColor = "rgba(239, 68, 68, 0.44)"; // Red
      strokeColor = "#dc2626";
      badgeBg = "#fef2f2";
      badgeText = "#991b1b";
    } else if (
      status === "compliant_with_reservations" ||
      status === "in_conversion" ||
      status === "pending"
    ) {
      fillColor = "rgba(245, 158, 11, 0.44)"; // Amber
      strokeColor = "#d97706";
      badgeBg = "#fffbeb";
      badgeText = "#92400e";
    }

    const geom = parcel.geom || parcel.geom_geojson;
    let polygonPoints = [];

    if (geom) {
      try {
        const parsed = typeof geom === "string" ? JSON.parse(geom) : geom;
        const coordinates =
          parsed.type === "Polygon"
            ? parsed.coordinates
            : parsed.type === "MultiPolygon"
            ? parsed.coordinates.flat()
            : [];

        if (coordinates.length > 0 && coordinates[0].length > 0) {
          polygonPoints = coordinates[0].map(([lng, lat]) =>
            projectToCanvas(lng, lat, bbox, width, height)
          );
        }
      } catch (e) {
        polygonPoints = [];
      }
    }

    // A. Dessin du polygone
    if (polygonPoints.length >= 3) {
      // Ombre portée douce
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 4;

      ctx.beginPath();
      ctx.moveTo(polygonPoints[0][0], polygonPoints[0][1]);
      for (let i = 1; i < polygonPoints.length; i++) {
        ctx.lineTo(polygonPoints[i][0], polygonPoints[i][1]);
      }
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.restore();

      // Contour du polygone
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Sommets discrets
      polygonPoints.forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Centre du polygone pour le label
      const centerX =
        polygonPoints.reduce((acc, p) => acc + p[0], 0) / polygonPoints.length;
      const centerY =
        polygonPoints.reduce((acc, p) => acc + p[1], 0) / polygonPoints.length;

      // Étiquette avec nom et superficie
      const parcelName = parcel.name || `Parcelle #${index + 1}`;
      const areaText = parcel.area_ha ? ` (${parseFloat(parcel.area_ha).toFixed(2)} ha)` : "";
      const labelText = `${parcelName}${areaText}`;

      ctx.font = "bold 11px sans-serif";
      const textWidth = ctx.measureText(labelText).width;
      const pillWidth = textWidth + 18;
      const pillHeight = 22;

      ctx.save();
      ctx.fillStyle = badgeBg;
      ctx.beginPath();
      ctx.roundRect(centerX - pillWidth / 2, centerY - pillHeight / 2, pillWidth, pillHeight, 6);
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = badgeText;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(labelText, centerX, centerY);
      ctx.restore();
    } else if (parcel.latitude && parcel.longitude) {
      // B. Point marker si seulement coordonnées GPS
      const lat = parseFloat(parcel.latitude);
      const lng = parseFloat(parcel.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        const [px, py] = projectToCanvas(lng, lat, bbox, width, height);

        // Halo
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();

        // Pin point
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fillStyle = strokeColor;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        const parcelName = parcel.name || `Parcelle #${index + 1}`;
        ctx.save();
        ctx.font = "bold 11px sans-serif";
        const textWidth = ctx.measureText(parcelName).width;
        ctx.fillStyle = badgeBg;
        ctx.beginPath();
        ctx.roundRect(px - (textWidth + 14) / 2, py - 28, textWidth + 14, 20, 5);
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = badgeText;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(parcelName, px, py - 18);
        ctx.restore();
      }
    }
  });

  // 3. Rose des vents / Boussole (en haut à droite)
  ctx.save();
  const compassX = width - 48;
  const compassY = 48;
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.beginPath();
  ctx.arc(compassX, compassY, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Aiguille Nord
  ctx.beginPath();
  ctx.moveTo(compassX, compassY - 18);
  ctx.lineTo(compassX + 6, compassY);
  ctx.lineTo(compassX - 6, compassY);
  ctx.closePath();
  ctx.fillStyle = "#dc2626";
  ctx.fill();

  // Aiguille Sud
  ctx.beginPath();
  ctx.moveTo(compassX, compassY + 18);
  ctx.lineTo(compassX + 6, compassY);
  ctx.lineTo(compassX - 6, compassY);
  ctx.closePath();
  ctx.fillStyle = "#475569";
  ctx.fill();

  ctx.fillStyle = "#dc2626";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("N", compassX, compassY - 20);
  ctx.restore();

  // 4. Échelle métrique (en bas à droite)
  ctx.save();
  const scaleBarX = width - 180;
  const scaleBarY = height - 26;
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.beginPath();
  ctx.roundRect(scaleBarX - 10, scaleBarY - 18, 175, 32, 6);
  ctx.fill();
  ctx.strokeStyle = "#cbd5e1";
  ctx.stroke();

  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(scaleBarX, scaleBarY);
  ctx.lineTo(scaleBarX + 120, scaleBarY);
  ctx.moveTo(scaleBarX, scaleBarY - 4);
  ctx.lineTo(scaleBarX, scaleBarY + 4);
  ctx.moveTo(scaleBarX + 120, scaleBarY - 4);
  ctx.lineTo(scaleBarX + 120, scaleBarY + 4);
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 8.5px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Échelle cartographique", scaleBarX + 60, scaleBarY - 6);
  ctx.fillText("Projection Web Mercator (WGS84)", scaleBarX + 60, scaleBarY + 12);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

// ============================================================================
// 2. GÉNÉRATEUR PRINCIPAL DU RAPPORT D'AUDIT BIOLOGIQUE (EXACT COMME L'ÉCRAN)
// ============================================================================

const conversionLabels = {
  not_started: "Non commencé",
  in_conversion: "En conversion",
  certified: "Certifié",
};

const overallLabels = {
  compliant: "Conforme",
  non_compliant: "Non conforme",
  compliant_with_reservations: "Conforme avec réserves",
};

const severityLabels = {
  none: "Aucune",
  minor: "Mineure",
  major: "Majeure",
  critical: "Critique",
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR");
  } catch {
    return dateStr;
  }
};

/**
 * Génère et télécharge DIRECTEMENT le rapport d'audit biologique en PDF,
 * reproduisant exactement l'interface utilisateur de http://localhost:5173/audits/report.
 */
export async function downloadAuditReportPdf({
  cooperativeName = "Toutes mes coopératives",
  generationDate = new Date(),
  kpis = {
    farmersCount: 0,
    auditedParcelsCount: 0,
    totalParcelsCount: 0,
    totalAreaHa: 0,
    nonConformitiesCount: 0,
    minorCount: 0,
    majorCount: 0,
    criticalCount: 0,
  },
  auditedParcelsList = [],
  nonConformitiesList = [],
  fileName = "Rapport_Audit_Biologique.pdf",
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const now = generationDate instanceof Date ? generationDate : new Date(generationDate);
  const dateFormatted = now.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const refCode = `AUD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  // ==========================================================================
  // PAGE 1 : EN-TÊTE DU RAPPORT, FILTRE COOPÉRATIVE, 4 KPIS ET CARTE INTERACTIVE
  // ==========================================================================

  // 1. Bandeau supérieur officiel vert émeraude
  doc.setFillColor(5, 150, 105); // emerald-600
  doc.rect(0, 0, pageWidth, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("SmartSahaBio", margin, 11);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Système Intégré de Traçabilité Agricole & Certification Biologique (Règlement UE 2018/848)",
    margin,
    17
  );

  doc.setFontSize(7.5);
  doc.text(`Réf : ${refCode}`, pageWidth - margin, 11, { align: "right" });
  doc.text(`Édition certifiée`, pageWidth - margin, 17, { align: "right" });

  // 2. Titre et sous-titre de la page (Exactement comme à l'écran)
  let currentY = 32;
  doc.setTextColor(17, 24, 39); // gray-900
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Rapport d'Audit Biologique", margin, currentY);

  currentY += 5;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128); // gray-500
  doc.text(
    "Indicateurs de conformité, cartographie des parcelles contrôlées et suivi des non-conformités",
    margin,
    currentY
  );

  // 3. Cadre de filtre / coopérative (Comme la barre de filtre à l'écran)
  currentY += 6;
  const filterBoxHeight = 11;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, currentY, contentWidth, filterBoxHeight, 2.5, 2.5, "F");
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, filterBoxHeight, 2.5, 2.5, "S");

  // Texte coopérative
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 41, 55); // gray-800
  doc.text("Coopérative : ", margin + 4, currentY + 7);

  const coopNameX = margin + 4 + doc.getTextWidth("Coopérative : ");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text(cooperativeName, coopNameX, currentY + 7);

  // Date de génération à droite
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  const genText = `Rapport généré le ${dateFormatted}`;
  doc.text(genText, pageWidth - margin - 4, currentY + 7, { align: "right" });

  // 4. Titre de Partie 1
  currentY += filterBoxHeight + 7;
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("1. Indicateurs clés de performance & Cartographie", margin, currentY);

  // 5. Les 4 Blocs KPI identiques à l'écran
  currentY += 4;
  const kpiGap = 3;
  const kpiWidth = (contentWidth - kpiGap * 3) / 4;
  const kpiHeight = 23;

  // Calcul du % pour KPI 2
  const parcelsPercent =
    kpis.totalParcelsCount > 0
      ? `${Math.round((kpis.auditedParcelsCount / kpis.totalParcelsCount) * 100)}% des parcelles contrôlées`
      : "Aucune parcelle";

  const kpisData = [
    {
      title: "PRODUCTEURS AUDITÉS",
      value: String(kpis.farmersCount ?? 0),
      subtext: "Producteurs avec parcelle auditée",
      iconColor: [29, 78, 216], // blue-700
      iconBg: [239, 246, 255], // blue-50
      badgeLetter: "P",
    },
    {
      title: "PARCELLES AUDITÉES",
      value: `${kpis.auditedParcelsCount ?? 0}`,
      unit: `/ ${kpis.totalParcelsCount ?? 0} total`,
      subtext: parcelsPercent,
      iconColor: [4, 120, 87], // emerald-700
      iconBg: [236, 253, 245], // emerald-50
      badgeLetter: "C",
    },
    {
      title: "SUPERFICIE AUDITÉE",
      value: `${Number(kpis.totalAreaHa || 0).toFixed(2)}`,
      unit: "ha",
      subtext: "Surface sous contrôle bio",
      iconColor: [180, 83, 9], // amber-700
      iconBg: [254, 243, 199], // amber-50
      badgeLetter: "S",
    },
    {
      title: "NON-CONFORMITÉS",
      value: String(kpis.nonConformitiesCount ?? 0),
      isAlert: (kpis.nonConformitiesCount ?? 0) > 0,
      subtext: `${kpis.minorCount ?? 0} min • ${kpis.majorCount ?? 0} maj • ${kpis.criticalCount ?? 0} crit`,
      iconColor: (kpis.nonConformitiesCount ?? 0) > 0 ? [185, 28, 28] : [4, 120, 87],
      iconBg: (kpis.nonConformitiesCount ?? 0) > 0 ? [254, 242, 242] : [236, 253, 245],
      badgeLetter: "!",
    },
  ];

  kpisData.forEach((card, idx) => {
    const cardX = margin + idx * (kpiWidth + kpiGap);

    // Fond blanc avec bordure
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(cardX, currentY, kpiWidth, kpiHeight, 2.5, 2.5, "F");
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.35);
    doc.roundedRect(cardX, currentY, kpiWidth, kpiHeight, 2.5, 2.5, "S");

    // Pastille d'icône en haut à droite
    const iconSize = 6;
    doc.setFillColor(card.iconBg[0], card.iconBg[1], card.iconBg[2]);
    doc.roundedRect(cardX + kpiWidth - iconSize - 2.5, currentY + 2.5, iconSize, iconSize, 1.5, 1.5, "F");
    doc.setTextColor(card.iconColor[0], card.iconColor[1], card.iconColor[2]);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text(card.badgeLetter, cardX + kpiWidth - iconSize / 2 - 2.5, currentY + 6.8, { align: "center" });

    // Titre uppercase du KPI
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(107, 114, 128);
    doc.text(card.title, cardX + 3, currentY + 5.5);

    // Valeur principale
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    if (card.isAlert) {
      doc.setTextColor(185, 28, 28); // red-700
    } else {
      doc.setTextColor(17, 24, 39); // gray-900
    }
    doc.text(card.value, cardX + 3, currentY + 14);

    if (card.unit) {
      const valWidth = doc.getTextWidth(card.value);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.text(card.unit, cardX + 3 + valWidth + 1.5, currentY + 14);
    }

    // Sous-texte explicatif
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(card.subtext, cardX + 3, currentY + 19.5);
  });

  // 6. Carte des parcelles auditées (Conteneur identique à l'interface écran)
  currentY += kpiHeight + 6;
  const mapContainerHeight = 120;
  const mapHeaderHeight = 9;

  // Cadre global de la carte
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, currentY, contentWidth, mapContainerHeight, 3, 3, "F");
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, mapContainerHeight, 3, 3, "S");

  // Barre d'en-tête de la carte (bg-gray-50/70)
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, currentY, contentWidth, mapHeaderHeight, 3, 3, "F");
  // Recouvrir les coins inférieurs de la barre d'en-tête
  doc.rect(margin, currentY + mapHeaderHeight - 2, contentWidth, 2, "F");
  doc.setDrawColor(243, 244, 246);
  doc.line(margin, currentY + mapHeaderHeight, margin + contentWidth, currentY + mapHeaderHeight);

  // Titre dans la barre de carte + badge count
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 41, 55);
  doc.text("Cartographie des parcelles auditées", margin + 4, currentY + 6);

  const titleWidth = doc.getTextWidth("Cartographie des parcelles auditées");
  // Badge vert avec le nombre de parcelles
  const countText = String(auditedParcelsList.length);
  doc.setFillColor(209, 250, 229); // emerald-100
  doc.roundedRect(margin + 4 + titleWidth + 2.5, currentY + 2.5, 8, 4.5, 2, 2, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text(countText, margin + 4 + titleWidth + 6.5, currentY + 5.7, { align: "center" });

  // Légende en haut à droite (Conforme, Avec réserves, Non conforme)
  let legX = pageWidth - margin - 4;

  // Non conforme
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 85, 99);
  doc.text("Non conforme", legX, currentY + 5.8, { align: "right" });
  legX -= doc.getTextWidth("Non conforme") + 3;
  doc.setFillColor(220, 38, 38);
  doc.circle(legX, currentY + 5, 1.4, "F");
  legX -= 6;

  // Avec réserves
  doc.text("Avec réserves", legX, currentY + 5.8, { align: "right" });
  legX -= doc.getTextWidth("Avec réserves") + 3;
  doc.setFillColor(217, 119, 6);
  doc.circle(legX, currentY + 5, 1.4, "F");
  legX -= 6;

  // Conforme
  doc.text("Conforme", legX, currentY + 5.8, { align: "right" });
  legX -= doc.getTextWidth("Conforme") + 3;
  doc.setFillColor(5, 150, 105);
  doc.circle(legX, currentY + 5, 1.4, "F");

  // Rendu de la carte haute définition dans le conteneur
  const mapImageY = currentY + mapHeaderHeight;
  const mapImageHeight = mapContainerHeight - mapHeaderHeight;

  try {
    const mapImgData = await renderParcelsMapImage(auditedParcelsList, {
      width: 1200,
      height: 720,
    });
    doc.addImage(
      mapImgData,
      "PNG",
      margin + 0.5,
      mapImageY + 0.5,
      contentWidth - 1,
      mapImageHeight - 1
    );
  } catch (err) {
    console.error("Erreur de rendu de carte :", err);
    doc.setFillColor(243, 244, 246);
    doc.rect(margin + 1, mapImageY + 1, contentWidth - 2, mapImageHeight - 2, "F");
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(9);
    doc.text(
      "Cartographie des parcelles",
      pageWidth / 2,
      mapImageY + mapImageHeight / 2,
      { align: "center" }
    );
  }

  // ==========================================================================
  // PAGE 2 : PARTIE 2 (TABLEAU DES PARCELLES) & PARTIE 3 (NON-CONFORMITÉS)
  // ==========================================================================
  doc.addPage();

  // En-tête simplifié de continuation
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, pageWidth, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("SmartSahaBio • Rapport d'Audit Biologique (Suite)", margin, 8);
  doc.setFontSize(7.5);
  doc.text(`Réf : ${refCode}`, pageWidth - margin, 8, { align: "right" });

  let page2Y = 20;

  // --------------------------------------------------------------------------
  // PARTIE 2 : LISTE DES PARCELLES AUDITÉES
  // --------------------------------------------------------------------------
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("2. Liste des parcelles auditées", margin, page2Y);

  const p2TitleWidth = doc.getTextWidth("2. Liste des parcelles auditées");
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin + p2TitleWidth + 2.5, page2Y - 3.5, 9, 4.5, 2, 2, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(55, 65, 81);
  doc.text(String(auditedParcelsList.length), margin + p2TitleWidth + 7, page2Y - 0.4, { align: "center" });

  page2Y += 4.5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(
    "Toutes les parcelles disposant d'un audit de conformité biologique",
    margin,
    page2Y
  );

  // Colonnes du tableau des parcelles (Exactement comme à l'écran)
  page2Y += 4;
  const pColWidths = [42, 38, 24, 28, 25, 25];
  const pColHeaders = [
    "Parcelle",
    "Producteur",
    "Date Audit",
    "Auditeur",
    "Conversion",
    "Résultat",
  ];

  function drawParcelsTableHeader(yPos) {
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, yPos, contentWidth, 7, "F");
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos + 7, margin + contentWidth, yPos + 7);

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(107, 114, 128);

    let curX = margin + 2;
    pColHeaders.forEach((h, i) => {
      doc.text(h.toUpperCase(), curX, yPos + 4.8);
      curX += pColWidths[i];
    });
  }

  drawParcelsTableHeader(page2Y);
  page2Y += 7;

  if (auditedParcelsList.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, page2Y, contentWidth, 12, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text("Aucune parcelle auditée trouvée.", pageWidth / 2, page2Y + 7, { align: "center" });
    page2Y += 12;
  } else {
    auditedParcelsList.forEach((item, rIdx) => {
      // Vérifier saut de page
      if (page2Y > pageHeight - 25) {
        doc.addPage();
        doc.setFillColor(5, 150, 105);
        doc.rect(0, 0, pageWidth, 12, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("SmartSahaBio • Rapport d'Audit Biologique (Suite)", margin, 8);

        page2Y = 20;
        drawParcelsTableHeader(page2Y);
        page2Y += 7;
      }

      const p = item.parcel || {};
      const audit = item.audit || {};
      const rowHeight = 7.5;

      if (rIdx % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, page2Y, contentWidth, rowHeight, "F");
      }

      // Ligne séparatrice
      doc.setDrawColor(243, 244, 246);
      doc.setLineWidth(0.2);
      doc.line(margin, page2Y + rowHeight, margin + contentWidth, page2Y + rowHeight);

      let curX = margin + 2;

      // 1. Parcelle & surface
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      const pName = (p.name || "Parcelle").substring(0, 20);
      doc.text(pName, curX, page2Y + 3.8);

      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(156, 163, 175);
      const pArea = p.area_ha ? `${parseFloat(p.area_ha).toFixed(2)} ha` : "— ha";
      doc.text(pArea, curX, page2Y + 6.6);
      curX += pColWidths[0];

      // 2. Producteur
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(31, 41, 55);
      const farmer = (item.farmerName || "—").substring(0, 20);
      doc.text(farmer, curX, page2Y + 4.8);
      curX += pColWidths[1];

      // 3. Date audit
      doc.setTextColor(75, 85, 99);
      doc.text(formatDate(audit.audit_date), curX, page2Y + 4.8);
      curX += pColWidths[2];

      // 4. Auditeur
      doc.text((audit.auditor_name || "—").substring(0, 15), curX, page2Y + 4.8);
      curX += pColWidths[3];

      // 5. Statut de conversion (Badge)
      const conv = audit.conversion_status || "in_conversion";
      const convText = conversionLabels[conv] || conv;
      let convBg = [243, 244, 246];
      let convTextCol = [55, 65, 81];
      if (conv === "certified") {
        convBg = [209, 250, 229]; // emerald-100
        convTextCol = [6, 95, 70];
      } else if (conv === "in_conversion") {
        convBg = [219, 234, 254]; // blue-100
        convTextCol = [30, 64, 175];
      }
      doc.setFillColor(convBg[0], convBg[1], convBg[2]);
      doc.roundedRect(curX, page2Y + 1.8, pColWidths[4] - 4, 4.2, 1.5, 1.5, "F");
      doc.setFontSize(5.8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(convTextCol[0], convTextCol[1], convTextCol[2]);
      doc.text(convText, curX + (pColWidths[4] - 4) / 2, page2Y + 4.7, { align: "center" });
      curX += pColWidths[4];

      // 6. Résultat (Badge)
      const res = audit.overall_status || "compliant";
      const resText = overallLabels[res] || res;
      let resBg = [209, 250, 229];
      let resTextCol = [6, 95, 70];
      if (res === "non_compliant") {
        resBg = [254, 226, 226]; // red-100
        resTextCol = [153, 27, 27];
      } else if (res === "compliant_with_reservations") {
        resBg = [254, 243, 199]; // amber-100
        resTextCol = [146, 64, 14];
      }
      doc.setFillColor(resBg[0], resBg[1], resBg[2]);
      doc.roundedRect(curX, page2Y + 1.8, pColWidths[5] - 2, 4.2, 1.5, 1.5, "F");
      doc.setFontSize(5.8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(resTextCol[0], resTextCol[1], resTextCol[2]);
      doc.text(resText, curX + (pColWidths[5] - 2) / 2, page2Y + 4.7, { align: "center" });

      page2Y += rowHeight;
    });
  }

  // --------------------------------------------------------------------------
  // PARTIE 3 : REGISTRE DES NON-CONFORMITÉS ET PLANS D'ACTIONS
  // --------------------------------------------------------------------------
  page2Y += 10;

  // Si l'espace restant sur la page est insuffisant pour débuter la section 3, ajouter une page
  if (page2Y > pageHeight - 45) {
    doc.addPage();
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, pageWidth, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("SmartSahaBio • Rapport d'Audit Biologique (Suite)", margin, 8);
    page2Y = 20;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("3. Registre des non-conformités et plans d'actions", margin, page2Y);

  const p3TitleWidth = doc.getTextWidth("3. Registre des non-conformités et plans d'actions");
  const ncBadgeBg = nonConformitiesList.length > 0 ? [254, 226, 226] : [209, 250, 229];
  const ncBadgeText = nonConformitiesList.length > 0 ? [153, 27, 27] : [6, 95, 70];
  doc.setFillColor(ncBadgeBg[0], ncBadgeBg[1], ncBadgeBg[2]);
  doc.roundedRect(margin + p3TitleWidth + 2.5, page2Y - 3.5, 9, 4.5, 2, 2, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(ncBadgeText[0], ncBadgeText[1], ncBadgeText[2]);
  doc.text(String(nonConformitiesList.length), margin + p3TitleWidth + 7, page2Y - 0.4, { align: "center" });

  page2Y += 4.5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(
    "Suivi des écarts constatés, niveau de gravité et échéances correctives",
    margin,
    page2Y
  );

  page2Y += 4;

  if (nonConformitiesList.length === 0) {
    // Encadré vert exact quand 0 non-conformités
    doc.setFillColor(240, 253, 244); // emerald-50
    doc.roundedRect(margin, page2Y, contentWidth, 22, 3, 3, "F");
    doc.setDrawColor(187, 247, 208); // emerald-200
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, page2Y, contentWidth, 22, 3, 3, "S");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(6, 95, 70); // emerald-900
    doc.text("Aucune non-conformité relevée", margin + contentWidth / 2, page2Y + 8, { align: "center" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(4, 120, 87); // emerald-700
    doc.text(
      "Toutes les parcelles auditées pour cette coopérative respectent pleinement les exigences du cahier des charges biologique.",
      margin + contentWidth / 2,
      page2Y + 14,
      { align: "center" }
    );
    page2Y += 22;
  } else {
    // Tableau complet des non-conformités
    const ncColWidths = [34, 25, 20, 41, 41, 21];
    const ncHeaders = [
      "Parcelle & Producteur",
      "Date & Auditeur",
      "Sévérité",
      "Manquement constaté",
      "Action corrective",
      "Échéance",
    ];

    function drawNcHeader(yPos) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, yPos, contentWidth, 7, "F");
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos + 7, margin + contentWidth, yPos + 7);

      doc.setFontSize(6.8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(107, 114, 128);

      let curX = margin + 2;
      ncHeaders.forEach((h, i) => {
        doc.text(h.toUpperCase(), curX, yPos + 4.8);
        curX += ncColWidths[i];
      });
    }

    drawNcHeader(page2Y);
    page2Y += 7;

    nonConformitiesList.forEach((item, rIdx) => {
      const audit = item.audit || {};
      const parcel = item.parcel || {};
      const sev = audit.non_conformity_severity || "minor";

      // Extraire le texte brut
      const descRaw = stripHtml(audit.non_conformities) || "Non précisée";
      const planRaw = stripHtml(audit.corrective_action_plan) || "Aucun plan renseigné";

      // Calculer la hauteur selon le texte multi-lignes
      doc.setFontSize(6.5);
      const descLines = doc.splitTextToSize(descRaw, ncColWidths[3] - 4);
      const planLines = doc.splitTextToSize(planRaw, ncColWidths[4] - 4);
      const lineCount = Math.max(descLines.length, planLines.length, 2);
      const rowHeight = Math.max(lineCount * 3.6 + 4, 10);

      // Saut de page si nécessaire
      if (page2Y + rowHeight > pageHeight - 20) {
        doc.addPage();
        doc.setFillColor(5, 150, 105);
        doc.rect(0, 0, pageWidth, 12, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("SmartSahaBio • Rapport d'Audit Biologique (Suite)", margin, 8);

        page2Y = 20;
        drawNcHeader(page2Y);
        page2Y += 7;
      }

      if (rIdx % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, page2Y, contentWidth, rowHeight, "F");
      }

      doc.setDrawColor(243, 244, 246);
      doc.setLineWidth(0.2);
      doc.line(margin, page2Y + rowHeight, margin + contentWidth, page2Y + rowHeight);

      let curX = margin + 2;

      // 1. Parcelle & Producteur
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text((parcel.name || "Parcelle").substring(0, 18), curX, page2Y + 4);

      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.text((item.farmerName || "—").substring(0, 18), curX, page2Y + 7.5);
      curX += ncColWidths[0];

      // 2. Date & Auditeur
      doc.setFontSize(6.8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(31, 41, 55);
      doc.text(formatDate(audit.audit_date), curX, page2Y + 4);

      doc.setFontSize(5.8);
      doc.setTextColor(156, 163, 175);
      doc.text((audit.auditor_name || "—").substring(0, 14), curX, page2Y + 7.5);
      curX += ncColWidths[1];

      // 3. Sévérité
      let sevBg = [254, 243, 199];
      let sevTextCol = [146, 64, 14];
      if (sev === "critical") {
        sevBg = [254, 226, 226];
        sevTextCol = [153, 27, 27];
      } else if (sev === "major") {
        sevBg = [255, 237, 213];
        sevTextCol = [154, 52, 18];
      }
      doc.setFillColor(sevBg[0], sevBg[1], sevBg[2]);
      doc.roundedRect(curX, page2Y + 2, ncColWidths[2] - 3, 4.4, 1.5, 1.5, "F");
      doc.setFontSize(5.8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(sevTextCol[0], sevTextCol[1], sevTextCol[2]);
      doc.text(severityLabels[sev] || sev, curX + (ncColWidths[2] - 3) / 2, page2Y + 5, {
        align: "center",
      });
      curX += ncColWidths[2];

      // 4. Manquement constaté
      doc.setFontSize(6.2);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(31, 41, 55);
      doc.text(descLines, curX, page2Y + 4);
      curX += ncColWidths[3];

      // 5. Action corrective
      doc.setFontSize(6.2);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(31, 41, 55);
      doc.text(planLines, curX, page2Y + 4);
      curX += ncColWidths[4];

      // 6. Échéance
      doc.setFontSize(6.5);
      if (audit.corrective_action_deadline) {
        const isOverdue = new Date(audit.corrective_action_deadline) < new Date();
        if (isOverdue) {
          doc.setTextColor(220, 38, 38);
          doc.setFont("helvetica", "bold");
          doc.text(formatDate(audit.corrective_action_deadline), curX, page2Y + 4);
          doc.setFontSize(5.5);
          doc.text("(Échue)", curX, page2Y + 7.5);
        } else {
          doc.setTextColor(55, 65, 81);
          doc.setFont("helvetica", "normal");
          doc.text(formatDate(audit.corrective_action_deadline), curX, page2Y + 4);
        }
      } else {
        doc.setTextColor(156, 163, 175);
        doc.text("—", curX, page2Y + 4);
      }

      page2Y += rowHeight;
    });
  }

  // ==========================================================================
  // PIED DE PAGE SUR TOUTES LES PAGES
  // ==========================================================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(156, 163, 175);
    doc.text(
      "Document officiel généré par SmartSahaBio • Traçabilité & Contrôle Biologique UE 2018/848",
      margin,
      pageHeight - 6
    );
    doc.text(`Page ${i} / ${totalPages}`, pageWidth - margin, pageHeight - 6, {
      align: "right",
    });
  }

  // Téléchargement direct sans boîte de dialogue d'impression
  doc.save(fileName);
}

/**
 * Fonction générique de téléchargement conservée pour le Dashboard ou les résumés d'activités
 */
export async function downloadParcelsReportPdf(options = {}) {
  // Si appelée avec les options d'audit de la page AuditReport, rediriger vers downloadAuditReportPdf
  if (options.kpis || options.auditedParcelsList) {
    return downloadAuditReportPdf(options);
  }

  // Sinon, format généraliste pour le Dashboard
  const {
    title = "Rapport d'Activité & Cartographie des Parcelles",
    cooperativeName = "Toutes les coopératives",
    period = "Campagne 2026",
    cropName = "Toutes cultures",
    summary = {},
    parcels = [],
    cooperativesSummary = [],
    fileName = "Rapport_Parcelles_SmartSahaBio.pdf",
  } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const refCode = `RPT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  // En-tête bandeau
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, pageWidth, 26, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("SmartSahaBio", margin, 12);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Plateforme Intégrée de Traçabilité Agricole & Certification Biologique", margin, 18);
  doc.text(`Réf : ${refCode}`, pageWidth - margin, 12, { align: "right" });
  doc.text(`Édité le ${dateStr}`, pageWidth - margin, 18, { align: "right" });

  let currentY = 34;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, currentY);

  currentY += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Périmètre : ${cooperativeName}  |  Période : ${period}  |  Culture : ${cropName}`, margin, currentY);

  // Carte
  currentY += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Cartographie des Parcelles Géoréférencées", margin, currentY);

  currentY += 4;
  const mapHeight = 90;
  try {
    const mapImgData = await renderParcelsMapImage(parcels, {
      width: 1200,
      height: 600,
    });
    doc.addImage(mapImgData, "PNG", margin, currentY, contentWidth, mapHeight);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.rect(margin, currentY, contentWidth, mapHeight);
  } catch (err) {
    console.error("Erreur rendu carte :", err);
  }

  currentY += mapHeight + 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Inventaire des Parcelles", margin, currentY);

  currentY += 4;
  const colWidths = [45, 42, 30, 25, 40];
  const tableHeaders = ["Parcelle", "Exploitant", "Culture", "Superficie", "Statut Bio"];

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 7, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);

  let curX = margin + 2;
  tableHeaders.forEach((h, i) => {
    doc.text(h, curX, currentY + 4.8);
    curX += colWidths[i];
  });

  currentY += 7;
  const displayParcels = parcels.slice(0, 10);
  displayParcels.forEach((item, rowIdx) => {
    const p = item.parcel || item;
    const audit = item.audit || {};
    const rowY = currentY + rowIdx * 6.5;

    if (rowIdx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, rowY, contentWidth, 6.5, "F");
    }

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);

    let colX = margin + 2;
    doc.text((p.name || `Parcelle #${rowIdx + 1}`).substring(0, 22), colX, rowY + 4.5);
    colX += colWidths[0];

    doc.text((item.farmerName || p.farmer?.full_name || "Exploitant").substring(0, 20), colX, rowY + 4.5);
    colX += colWidths[1];

    doc.text((p.crop_type || "Bio").substring(0, 16), colX, rowY + 4.5);
    colX += colWidths[2];

    const area = p.area_ha ? `${parseFloat(p.area_ha).toFixed(2)} ha` : "—";
    doc.text(area, colX, rowY + 4.5);
    colX += colWidths[3];

    const rawStatus = audit.overall_status || p.status || "compliant";
    const statusText = rawStatus === "non_compliant" ? "Non conforme" : rawStatus === "compliant_with_reservations" ? "Avec réserves" : "Conforme";
    doc.text(statusText, colX, rowY + 4.5);
  });

  // Pied de page
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Document généré par SmartSahaBio • Page 1/1`, pageWidth / 2, pageHeight - 8, { align: "center" });

  doc.save(fileName);
}
