// src/pages/Client/AjoutMesure.jsx
import React, { useEffect, useState } from "react";
import "./css/Ajout_mesure.css";
import { useNavigate, useParams } from "react-router-dom";
import { authenticatedFetch } from "../../utils/auth";

function AjoutMesure() {
  const { article_id } = useParams();
  const navigate = useNavigate();

  // États
  const [client, setClient] = useState(null);
  const [article, setArticle] = useState(null);
  const [longueur, setLongueur] = useState("");
  const [largeur, setLargeur] = useState("");
  const [nombreDeFois, setNombreDeFois] = useState(1);
  const [encadrements, setEncadrements] = useState({
    D: false,
    G: false,
    H: false,
    B: false,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [message, setMessage] = useState("");

  // Récupération des infos du client
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const data = await authenticatedFetch(
          "http://localhost:8000/api/client_info/"
        );
        setClient(data);
      } catch (err) {
        setErr("Erreur lors de la récupération des données: " + (err?.message || err));
      }
    };
    fetchClientData();
  }, []);

  // Récupération d'article
  useEffect(() => {
    const fetchArticles = async () => {
      if (!client) return;
      try {
        const response = await authenticatedFetch(`http://localhost:8000/api/liste_articles_client`);
        const found = response.find(a => Number(a.id) === Number(article_id));
        if (found) {
          setArticle(found);
          if (found.mesure?.length > 0) {
            setLongueur(found.mesure[0].longueur || "");
            setLargeur(found.mesure[0].largeur || "");
            setNombreDeFois(found.mesure[0].nombre_de_fois || 1);
            setEncadrements({
              D: !!found.mesure[0].encadrement_droite,
              G: !!found.mesure[0].encadrement_gauche,
              H: !!found.mesure[0].encadrement_haut,
              B: !!found.mesure[0].encadrement_bas,
            });
          }
        }
      } catch (err) {
        setErr("Erreur lors du chargement d'article: " + err.message);
      }
    };
    fetchArticles();
  }, [article_id, client]);

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const payload = {
        longueur,
        largeur,
        nombre_de_fois: nombreDeFois,
        encadrement_droite: encadrements.D,
        encadrement_gauche: encadrements.G,
        encadrement_haut: encadrements.H,
        encadrement_bas: encadrements.B,
      };

      const res = await authenticatedFetch(
        `http://localhost:8000/api/ajouter_mesure_client/${article_id}/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.error) {
        setMessage("❌ Erreur : " + res.error);
      } else {
        setMessage("✅ Mesure ajoutée avec succès !");
        setTimeout(() => navigate("/Lister_articles"), 1200);
      }
    } catch (err) {
      setMessage("❌ Erreur lors de l’ajout : " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Gestion des cases à cocher pour encadrements
  const toggleEncadrement = (key) => {
    setEncadrements((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="mesure-container">
      <div className="mesure-card">
        <h2>➕ Ajouter une mesure</h2>

        {client && <p className="client-info">👤 Client : {client.nom}</p>}
        {article && <p className="article-info">📦 Article : {article.nom} ({article.type})</p>}
        {err && <p className="error">{err}</p>}

        <form onSubmit={handleSubmit} className="mesure-form">
          <div className="form-group">
            <label>Longueur (mm)</label>
            <input type="number" value={longueur} onChange={(e) => setLongueur(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Largeur (mm)</label>
            <input type="number" value={largeur} onChange={(e) => setLargeur(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Nombre de fois</label>
            <input type="number" value={nombreDeFois} onChange={(e) => setNombreDeFois(e.target.value)} min="1" />
          </div>

          <fieldset className="encadrement-group">
            <legend>Encadrements</legend>
            {["D", "G", "H", "B"].map((key) => (
              <label key={key}>
                <input type="checkbox" checked={encadrements[key]} onChange={() => toggleEncadrement(key)} /> {key}
              </label>
            ))}
          </fieldset>

          <div className="btn-group">
            <button type="submit" disabled={loading} className="btn-wood">
              {loading ? "⏳ Ajout en cours..." : "✅ Ajouter"}
            </button>
            <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>
              Annuler
            </button>
          </div>
        </form>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default AjoutMesure;
