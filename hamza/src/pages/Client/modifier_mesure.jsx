// src/pages/Client/ModifierMesure.jsx
import React, { useEffect, useState } from "react";
import "./css/modifier_mesure.css";
import { useParams, useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../../utils/auth";

function ModifierMesure() {
  const { article_id } = useParams();
  const navigate = useNavigate();

  const [mesures, setMesures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modifs, setModifs] = useState({});

  // 🔹 Charger les mesures liées à l’article
  useEffect(() => {
    const fetchMesures = async () => {
      try {
        const data = await authenticatedFetch(
          `http://localhost:8000/api/articles/${article_id}/mesures/`
        );

        setMesures(data);

        // Initialisation des valeurs de modification
        const initial = {};
        data.forEach((m) => {
          initial[m.id] = {
            longueur: m.longueur || "",
            largeur: m.largeur || "",
            nombre_de_fois: m.nombre_de_fois || 1,
            D: !!m.encadrement_droite,
            G: !!m.encadrement_gauche,
            H: !!m.encadrement_haut,
            B: !!m.encadrement_bas,
          };
        });
        setModifs(initial);
      } catch (err) {
        setError("❌ Impossible de charger les mesures : " + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (article_id) fetchMesures();
  }, [article_id]);

  // 🔹 Gestion des changements dans les champs
  const handleChange = (mesureId, field, value) => {
    setModifs((prev) => ({
      ...prev,
      [mesureId]: {
        ...prev[mesureId],
        [field]: value,
      },
    }));
  };

  // 🔹 Gestion des cases à cocher
  const handleCheck = (mesureId, field) => {
    setModifs((prev) => ({
      ...prev,
      [mesureId]: {
        ...prev[mesureId],
        [field]: !prev[mesureId][field],
      },
    }));
  };

  const callModifyMesure = async (mesureId, payload) => {
    // URLs / méthodes à essayer (commence par la forme Django REST la plus courante)
    const tries = [
      { url: `http://localhost:8000/api/modifier_mesure_client/${mesureId}/`, method: "PUT" },
      { url: `http://localhost:8000/api/modifier_mesure_client/${mesureId}`, method: "PUT" },
      { url: `http://localhost:8000/api/modifier_mesure_client/${mesureId}/`, method: "PATCH" },
    ];

    const token = localStorage.getItem("token"); // adapte si tu stockes le token ailleurs

    for (const t of tries) {
      try {
        console.debug("Tentative API:", t.method, t.url, "payload:", payload);
        const res = await fetch(t.url, {
          method: t.method,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        let data;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }

        console.debug("Réponse API:", { url: t.url, status: res.status, ok: res.ok, data });

        if (res.ok) return { ok: true, url: t.url, status: res.status, data };
        // Si 404, on continue pour essayer la prochaine URL
        if (res.status === 404) {
          continue;
        }
        // Pour 401/403 on renvoie l'erreur (auth)
        if (res.status === 401 || res.status === 403) {
          return { ok: false, url: t.url, status: res.status, error: data || `Auth ${res.status}` };
        }
        // autre erreur : retourne détails
        return { ok: false, url: t.url, status: res.status, error: data || `HTTP ${res.status}` };
      } catch (err) {
        console.error("Erreur réseau pour", t.url, err);
        // essaye la suivante
        continue;
      }
    }

    return { ok: false, error: "Toutes les tentatives d'URL/méthode ont échoué ou retourné 404." };
  };

  const handleSaveAll = async () => {
    setMessage("");
    setError("");
    try {
      console.log("Début sauvegarde - modifs:", modifs);
      const results = [];

      for (const mesureId of Object.keys(modifs)) {
        const m = modifs[mesureId];

        // validation minimale
        if (m.longueur === "" || m.largeur === "") {
          results.push({ mesureId, ok: false, error: "Longueur ou largeur manquante" });
          continue;
        }

        const payload = {
          longueur: Number(m.longueur),
          largeur: Number(m.largeur),
          nombre_de_fois: Number(m.nombre_de_fois || 1),
          encadrement_droite: !!m.D,
          encadrement_gauche: !!m.G,
          encadrement_haut: !!m.H,
          encadrement_bas: !!m.B,
        };

        const r = await callModifyMesure(mesureId, payload);
        results.push({ mesureId, ...r });

        // petite pause pour ne pas spammer le serveur
        await new Promise((res) => setTimeout(res, 120));
      }

      console.log("Résultats sauvegarde:", results);

      const fails = results.filter((r) => !r.ok);
      if (fails.length > 0) {
        // affiche le premier échec détaillé
        const f = fails[0];
        const errMsg = f.error || JSON.stringify(f.data) || `status ${f.status}`;
        setError(`Erreur (mesure ${f.mesureId}): ${errMsg}`);
        console.error("Échecs détaillés:", fails);
        return;
      }
      setMessage("✅ Toutes les mesures ont été enregistrées avec succès.");
    } catch (e) {
      console.error("Erreur handleSaveAll:", e);
      setError("Erreur inattendue: " + (e.message || e));
    }
  };

  if (loading) return <p className="loading">Chargement…</p>;

  return (
    <div className="modifier-mesure-container">
      <h2 className="modifier-title">Modifier les mesures</h2>

      <div className="mesures-place">
        {mesures.length === 0 ? (
          <p className="no-mesure">Aucune mesure trouvée.</p>
        ) : (
          mesures.map((mesure) => (
            <div className="mesure-card" key={mesure.id}>
              <label className="form-select">Longueur (cm) :</label>
              <input
                type="number"
                value={modifs[mesure.id]?.longueur || ""}
                onChange={(e) => handleChange(mesure.id, "longueur", e.target.value)}
                required
              />

              <label className="form-select">Largeur (cm) :</label>
              <input
                type="number"
                value={modifs[mesure.id]?.largeur || ""}
                onChange={(e) => handleChange(mesure.id, "largeur", e.target.value)}
                required
              />

              <label className="form-select">Nombre de fois :</label>
              <input
                type="number"
                min={1}
                value={modifs[mesure.id]?.nombre_de_fois || 1}
                onChange={(e) =>
                  handleChange(mesure.id, "nombre_de_fois", e.target.value)
                }
                required
              />

              <label className="form-select">Encadrements :</label>
              <div className="checkbox-group">
                {["D", "G", "H", "B"].map((side) => (
                  <label key={side}>
                    <input
                      type="checkbox"
                      checked={!!modifs[mesure.id]?.[side]}
                      onChange={() => handleCheck(mesure.id, side)}
                    />
                    {side === "D"
                      ? "Droite"
                      : side === "G"
                      ? "Gauche"
                      : side === "H"
                      ? "Haut"
                      : "Bas"}
                  </label>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ✅ Boutons globaux */}
      <div className="buttons-container">
        <button className="btn-submit" onClick={handleSaveAll}>
          💾 Enregistrer toutes les mesures
        </button>
        <button className="btn-cancel" type="button" onClick={() => navigate(-1)}>
          Retour
        </button>
      </div>

      {message && <p className="message success">{message}</p>}
      {error && <p className="message error">{error}</p>}
    </div>
  );
}

export default ModifierMesure;