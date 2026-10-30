/**
 * Utilitaire d'exportation PDF pour la fiche détaillée d'une coopérative.
 * Génère un document au format A4 haute fidélité avec en-tête officiel SmartSahaBio.
 */

const getStatusLabel = (status) => {
  switch (status) {
    case "active":
      return "Active";
    case "not_active":
      return "Inactive";
    case "na":
      return "N/A";
    default:
      return status || "N/A";
  }
};

const getLegalStatusLabel = (status) => {
  switch (status) {
    case "cooperative":
      return "Coopérative";
    case "group":
      return "Groupement";
    case "other":
      return "Autre";
    default:
      return status || "Non renseigné";
  }
};

const formatDate = (date) => {
  if (!date) return "Non renseignée";
  try {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(date);
  }
};

export const downloadCooperativePdf = (cooperative) => {
  if (!cooperative) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isActive = cooperative.status === "active";
  const statusColor = isActive ? "#15803d" : "#b91c1c";
  const statusBg = isActive ? "#dcfce7" : "#fee2e2";
  const safeName = (cooperative.name || "cooperative").replace(/[^a-zA-Z0-9_-]/g, "_");
  const docTitle = `Fiche_Cooperative_${safeName}`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 16mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    body {
      background-color: #f8fafc;
      color: #0f172a;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Barre d'action supérieure (masquée lors de l'impression) */
    .action-bar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .action-bar-title {
      font-size: 14px;
      font-weight: 500;
      color: #e2e8f0;
    }

    .action-buttons {
      display: flex;
      gap: 10px;
    }

    .btn {
      cursor: pointer;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #16a34a;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #15803d;
    }

    .btn-secondary {
      background: #334155;
      color: #ffffff;
    }
    .btn-secondary:hover {
      background: #475569;
    }

    /* Conteneur de la feuille A4 */
    .page-container {
      max-width: 800px;
      margin: 20px auto;
      background: #ffffff;
      padding: 32px 36px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
    }

    /* En-tête officiel */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #16a34a;
      padding-bottom: 18px;
      margin-bottom: 22px;
    }

    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #166534;
      letter-spacing: -0.5px;
    }

    .brand-subtitle {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-top: 3px;
      font-weight: 600;
    }

    .doc-meta {
      text-align: right;
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
    }

    .doc-meta strong {
      color: #1e293b;
    }

    /* Titre du document */
    .title-banner {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .coop-name {
      font-size: 20px;
      font-weight: 800;
      color: #14532d;
    }

    .coop-id {
      font-size: 11px;
      color: #166534;
      margin-top: 2px;
      font-family: monospace;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: ${statusBg};
      color: ${statusColor};
      border: 1px solid ${statusColor}33;
    }

    /* Sections */
    .section {
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #166534;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }

    /* Grille de champs */
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px 20px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px 16px;
    }

    .field {
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 6px;
      padding: 10px 14px;
    }

    .field-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 3px;
      letter-spacing: 0.4px;
    }

    .field-value {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      word-break: break-word;
    }

    .crop-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #16a34a;
      border-radius: 6px;
      padding: 10px 14px;
    }

    .crop-card.secondary {
      border-left-color: #64748b;
    }

    /* Bloc signatures */
    .signature-block {
      margin-top: 30px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      page-break-inside: avoid;
    }

    .signature-box {
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      padding: 14px;
      min-height: 85px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .signature-box-label {
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
    }

    .signature-box-date {
      font-size: 10px;
      color: #94a3b8;
    }

    /* Footer */
    .footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.5;
    }

    @media print {
      body {
        background: #ffffff !important;
      }
      .action-bar {
        display: none !important;
      }
      .page-container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <div class="action-bar-title">
      Fiche Coopérative : <strong>${cooperative.name || "Détails"}</strong> (Prêt à imprimer ou enregistrer en PDF)
    </div>
    <div class="action-buttons">
      <button class="btn btn-secondary" onclick="window.close()">Fermer</button>
      <button class="btn btn-primary" onclick="window.print()">Télécharger / Enregistrer en PDF</button>
    </div>
  </div>

  <div class="page-container">
    <div class="header">
      <div>
        <div class="brand-title">SmartSahaBio</div>
        <div class="brand-subtitle">Plateforme Agricole & Certification Biologique</div>
      </div>
      <div class="doc-meta">
        <div><strong>Document officiel</strong></div>
        <div>Édité le : <strong>${dateStr}</strong> à ${timeStr}</div>
        <div>Réf : <strong>COOP-${(cooperative.uuid || "REF").slice(0, 8).toUpperCase()}</strong></div>
      </div>
    </div>

    <div class="title-banner">
      <div>
        <div class="coop-name">${cooperative.name || "Sans nom"}</div>
        <div class="coop-id">ID : ${cooperative.uuid || "N/A"}</div>
      </div>
      <div class="status-badge">
        ${getStatusLabel(cooperative.status)}
      </div>
    </div>

    <!-- INFORMATIONS GENERALES -->
    <div class="section">
      <div class="section-title">1. Informations Générales & Contact</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">Président de la coopérative</div>
          <div class="field-value">${cooperative.president_name || "Non renseigné"}</div>
        </div>
        <div class="field">
          <div class="field-label">Téléphone</div>
          <div class="field-value">${cooperative.mobile || "Non renseigné"}</div>
        </div>
        <div class="field">
          <div class="field-label">Adresse e-mail</div>
          <div class="field-value">${cooperative.email || "Non renseigné"}</div>
        </div>
        <div class="field">
          <div class="field-label">Adresse / Localisation</div>
          <div class="field-value">${cooperative.address || "Non renseignée"}</div>
        </div>
      </div>
    </div>

    <!-- INFORMATIONS ADMINISTRATIVES -->
    <div class="section">
      <div class="section-title">2. Informations Administratives</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">Statut Juridique</div>
          <div class="field-value">${getLegalStatusLabel(cooperative.legal_status)}</div>
        </div>
        <div class="field">
          <div class="field-label">Année de création</div>
          <div class="field-value">${cooperative.year_of_creation || "Non renseignée"}</div>
        </div>
        <div class="field">
          <div class="field-label">Date d'enregistrement</div>
          <div class="field-value">${formatDate(cooperative.created_at)}</div>
        </div>
        <div class="field">
          <div class="field-label">Statut opérationnel</div>
          <div class="field-value">${getStatusLabel(cooperative.status)}</div>
        </div>
      </div>
    </div>

    <!-- PRODUCTIONS AGRICOLES -->
    <div class="section">
      <div class="section-title">3. Productions & Filières Agricoles</div>
      <div class="grid-3">
        <div class="crop-card">
          <div class="field-label">Culture principale</div>
          <div class="field-value" style="color: #166534;">${cooperative.main_crop || "Non renseignée"}</div>
        </div>
        <div class="crop-card secondary">
          <div class="field-label">Culture secondaire</div>
          <div class="field-value">${cooperative.second_crop || "Aucune"}</div>
        </div>
        <div class="crop-card secondary">
          <div class="field-label">Troisième culture</div>
          <div class="field-value">${cooperative.third_crop || "Aucune"}</div>
        </div>
      </div>
    </div>

    <!-- SIGNATURES / VALIDATION -->
    <div class="signature-block">
      <div class="signature-box">
        <div class="signature-box-label">Cachet & Signature de la Coopérative</div>
        <div class="signature-box-date">Date : ____ / ____ / ________</div>
      </div>
      <div class="signature-box">
        <div class="signature-box-label">Visa SmartSahaBio / Auditeur Bio</div>
        <div class="signature-box-date">Généré le ${dateStr}</div>
      </div>
    </div>

    <div class="footer">
      Document généré automatiquement via la plateforme <strong>SmartSahaBio</strong> — Système intégré de gestion des coopératives et certification biologique.<br>
      Toute reproduction ou utilisation non autorisée est strictement encadrée par la réglementation agricole en vigueur.
    </div>
  </div>

  <script>
    // Déclenche automatiquement l'impression / enregistrement PDF après le chargement
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>`;

  // Ouverture dans une nouvelle fenêtre dédiée
  const printWindow = window.open("", "_blank", "width=920,height=850");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    // Si bloqué par un bloqueur de popups, solution iframe transparente
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 400);
  }
};
