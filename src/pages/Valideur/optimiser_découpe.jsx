// src/pages/Client/ValidationArticle.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

function ValidationArticle() {
  const { articleId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [article, setArticle] = useState(state?.article || null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [schema, setSchema] = useState(""); // ✅ schéma SVG renvoyé par Django

  // Charger l’article si on recharge la page
  useEffect(() => {
    if (article) return;
    const token = localStorage.getItem("token");

    fetch(`http://localhost:8000/api/liste_articles_valideur/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        let found = null;
        (data.clients || []).forEach((clientData) => {
          (clientData.articles || []).forEach((art) => {
            if (String(art.id) === String(articleId)) {
              found = {
                ...art,
                client: `${clientData.prenom || ""} ${clientData.nom || ""}`.trim(),
              };
            }
          });
        });
        if (found) setArticle(found);
        else setError("Article introuvable !");
      })
      .catch((err) => setError(err?.message || "Erreur chargement article"));
  }, [article, articleId]);

  // === Validation découpage ===
  const handleConfirmerValidation = async () => {
    try {
      const token = localStorage.getItem("token");

      const bodyData = {};
      if (article.planches && article.planches.length > 0) {
        bodyData.board_length = article.planches[0].longueur_initiale_mm / 10;
        bodyData.board_width = article.planches[0].largeur_initiale_mm / 10;
      }

      const response = await fetch(
        `http://localhost:8000/api/valider_decouppage_valideur/${article.id}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(bodyData),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur HTTP ${response.status} : ${text}`);
      }

      const data = await response.json();
      setSuccess(data.schema_message || "✅ Article découpé et validé avec succès !");
      setSchema(data.schema || "");
      setArticle((prev) => ({
        ...prev,
        detail_par_planches: data.detail_par_planches || []
      }));
      setError("");
    } catch (err) {
      setError(err?.message || "Erreur validation découpage");
    }
  };

  const handleRetour = () => navigate(-1);

  const handlevalider = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:8000/api/marquer_article_valide/${article.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur HTTP ${response.status} : ${text}`);
      }

      const data = await response.json();

      // ✅ mettre à jour le state avec la valeur venant du backend
      setArticle({ ...article, valide: data.valide });
      setSuccess(data.message || "Article validé avec succès !");
      setError("");
    } catch (err) {
      setError(err?.message || "Erreur validation");
    }
  };

  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!article?.id) {
        throw new Error("Aucun article sélectionné.");
      }

      const url = `http://localhost:8000/api/schema_pdf/${article.id}/`;
      const response = await fetch(url, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur HTTP ${response.status} : ${text}`);
      }

      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = `schema_article_${article.id}.pdf`;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlBlob);

    } catch (err) {
      console.error("Erreur export PDF :", err);
      setError(err.message || "Erreur export PDF");
    }
  };
  
  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Erreur</h2>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={handleRetour}>Retour</button>
      </div>
    );
  }

  if (!article) {
    return <p style={{ padding: "20px" }}>Chargement de l’article...</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Validation de l’Article #{article.id}</h2>

      {success && <p style={{ color: "green" }}>{success}</p>}

      <p><strong>Client :</strong> {article.client || "Inconnu"}</p>
      <p><strong>Nom :</strong> {article.nom || "—"}</p>
      <p><strong>Date :</strong> {article.date_creation || "—"}</p>
      <p><strong>Épaisseur :</strong> {article.epaisseur || "—"} mm</p>
      <p>
        <strong>Dimensions planche :</strong>{" "}
        {article.planches && article.planches.length > 0
          ? `${article.planches[0].longueur_initiale_mm / 10} x ${article.planches[0].largeur_initiale_mm / 10} cm`
          : "—"}
      </p>
      <p><strong>État :</strong> {article.valide ? "✅ Déjà validé" : "❌ Non validé"}</p>

      <h3>Mesures :</h3>
      {article.mesures && article.mesures.length > 0 ? (
        <ul>
          {article.mesures.map((m) => (
            <li key={m.id}>
              {m.longueur} x {m.largeur} cm — quantité {m.nombre_de_fois}
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucune mesure.</p>
      )}

      <h3>Détail des planches :</h3>
      {article.detail_par_planches && article.detail_par_planches.length > 0 ? (
        <table
          border="1"
          cellPadding="8"
          style={{ borderCollapse: "collapse", marginTop: "10px" }}
        >
          <thead style={{ background: "#f0f0f0" }}>
            <tr>
              <th>Planche #</th>
              <th>Aire totale (cm²)</th>
              <th>Aire utilisée (cm²)</th>
              <th>Aire restante (cm²)</th>
            </tr>
          </thead>
          <tbody>
            {article.detail_par_planches.map((p, i) => (
              <tr key={i}>
                <td>{p.board_number}</td>
                <td>{p.area_total.toFixed(2)}</td>
                <td>{p.area_used.toFixed(2)}</td>
                <td>{p.area_rest.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Aucune planche optimisée.</p>
      )}

      <h3>Schéma d’agencement :</h3>
      {schema ? (
        <div
          dangerouslySetInnerHTML={{ __html: schema }} // ✅ affiche le SVG généré
          style={{ border: "1px solid #ccc", marginTop: "10px" }}
        />
      ) : (
        <p>Aucun schéma généré pour le moment.</p>
      )}

      <div style={{ marginTop: "20px" }}>
        {!article.valide && (
          <button onClick={handleConfirmerValidation} style={{ marginRight: "10px" }}>
            Confirmer la validation
          </button>
        )}
        <button onClick={handlevalider} style={{ marginRight: "10px" }}>Valider</button>
        <button onClick={handleExportPDF} style={{ marginRight: "10px" }}>Exporter en PDF</button>
        <button onClick={handleRetour}>Retour</button>
      </div>
    </div>
  );
}

export default ValidationArticle;
