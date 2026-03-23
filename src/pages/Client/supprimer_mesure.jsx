// src/pages/Client/SupprimerMesures.jsx
import React, { useEffect, useState } from "react";
import "./css/supprimer_mesure.css";
import { useParams, useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../../utils/auth";

function SupprimerMesures() {
  const { article_id } = useParams();
  const navigate = useNavigate();

  const [mesures, setMesures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Charger les mesures liées à l’article
  useEffect(() => {
    (async () => {
      try {
        const data = await authenticatedFetch(
          `http://localhost:8000/api/articles/${article_id}/mesures/`
        );
        console.log("Mesures chargées :", data);
        setMesures(data);
      } catch (err) {
        console.error("Erreur lors du chargement :", err);
        setError("Impossible de charger les mesures : " + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [article_id]);

  // Supprimer une mesure
  const handleSupprimer = async (mesureId) => {
    if (!mesureId) {
      alert("ID de mesure manquant !");
      return;
    }

    if (!window.confirm(`Voulez-vous vraiment supprimer la mesure ID ${mesureId} ?`)) return;

    try {
      const res = await authenticatedFetch(
        `http://localhost:8000/api/supprimer_mesure_client/${mesureId}/`,
        { method: "DELETE" }
      );
      if (res && res.message && res.message.toLowerCase().includes("succès")) {
        setMesures((prev) =>
          prev.filter((m) => (m.id || m.pk) !== mesureId)
        );
      } else if (res && res.message) {
        alert("Erreur : " + res.message);
      } else {
        alert("Erreur lors de la suppression.");
      }
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert("Erreur lors de la suppression : " + (err?.message || err));
    }
  };

  if (loading) return <p>Chargement…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="page-supprimer">
      <h2 className="titre">Gestion des mesures de l’article {article_id}</h2>

      {mesures.length === 0 ? (
        <p className="vide">Aucune mesure trouvée.</p>
      ) : (
        <ul className="liste-mesures">
          {mesures.map((mesure) => {
            const mesureId = mesure.id || mesure.pk;
            return (
              <li
                id={`mesure-${mesureId}`}
                key={mesureId}
                className="mesure-item"
              >
                <span className="mesure-texte">
                  📏 {mesure.longueur} × {mesure.largeur} ({mesure.nombre_de_fois}×)
                  <span className="encadrements">
                    {mesure.encadrement_droite && " D"}
                    {mesure.encadrement_gauche && " G"}
                    {mesure.encadrement_haut && " H"}
                    {mesure.encadrement_bas && " B"}
                  </span>
                </span>

                <button
                  className="btn-supprimer"
                  onClick={() => handleSupprimer(mesureId)}
                >
                  Supprimer
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" onClick={() => navigate(-1)} className="btn-retour">
        ⬅ Retour
      </button>
    </div>
  );
}

export default SupprimerMesures;