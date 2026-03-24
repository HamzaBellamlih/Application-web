// src/pages/Client/Valideur.jsx
import React, { useEffect, useState } from "react";
import "./css/Valideur.css";
import { useNavigate } from "react-router-dom";

function Valideur() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState("");      

  // === Charger les articles (flatten clients -> articles) ===
  useEffect(() => {
    const token = localStorage.getItem("token");
      fetch("http://localhost:8000/api/liste_articles_valideur", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((data) => {
        const allArticles = [];

        (data.clients || []).forEach((clientData) => {
          (clientData.articles || []).forEach((article) => {
            allArticles.push({
              id: article.id,
              client: `${clientData.prenom || ""} ${clientData.nom || "Client inconnu"}`.trim(),
              date: article.date_creation || "Date inconnue",
              mesures: article.mesures || [],
              dimensions:
                article.planches && article.planches.length > 0
                  ? article.planches[0]
                  : null,
              valide: article.valide ?? false,
              rawArticle: article,
            });
          });
        });

        setArticles(allArticles);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Erreur inconnue");
      });
  }, []);

  // === Actions ===
  const handleValider = async (articleId) => {
    navigate(`/optimiser_decoupage/${articleId}`, {
      state: { article: articles.find(a => a.id === articleId)?.rawArticle || null }
    });
  };

  const handleExporterText = async (articleId) => {
    try {
      const token = localStorage.getItem("token");
      const url = `http://localhost:8000/api/exporter_articles_text/${articleId}/`;

      const response = await fetch(url, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur HTTP ${response.status} : ${text}`);
      }

      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = `article_${articleId}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlBlob);
    } catch (err) {
      console.error(err);
      setError(err.message || "Erreur export TXT");
      alert("⚠️ " + (err.message || err));
    }
  };

  const handleExporterCSV = async (articleId) => {
    try {
      const token = localStorage.getItem("token");
      const url = `http://localhost:8000/api/exporter_articles_csv/${articleId}/`;

      const response = await fetch(url, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur HTTP ${response.status} : ${text}`);
      }

      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = `article_${articleId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlBlob);
    } catch (err) {
      console.error(err);
      setError(err.message || "Erreur export CSV");
      alert("⚠️ " + (err.message || err));
    }
  };

  const handleRetour = () => {
    window.history.back();
  };

  // === Rendu ===
  return (
    <div className="page-valideur">
      <h2 className="titre-valideur">Liste des Articles (Valideur)</h2>

      {error && <p className="erreur-message">{error}</p>}

      <table className="table-articles">
        <thead>
          <tr>
            <th>ID</th>
            <th>Client</th>
            <th>Date</th>
            <th>Mesures</th>
            <th>Dimensions planche</th>
            <th>Validé</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {articles.length > 0 ? (
            articles.map((article) => (
              <tr key={article.id}>
                <td>{article.id}</td>
                <td>{article.client || error}</td>
                <td>{article.date || "—"}</td>
                <td>
                  {article.mesures && article.mesures.length > 0
                    ? article.mesures
                        .map(
                          (m) =>
                            `[${m.longueur}x${m.largeur}] x${m.nombre_de_fois}`
                        )
                        .join(", ")
                    : "—"}
                </td>
                <td>
                  {article.dimensions
                    ? `${article.dimensions.longueur_initiale_mm / 10} x ${
                        article.dimensions.largeur_initiale_mm / 10
                      } cm`
                    : "—"}
                </td>
                <td>{article.valide ? "✅ Oui" : "❌ Non"}</td>
                <td className="actions">
                  <button
                    className="btn-valider"
                    onClick={() => handleValider(article.id)}
                  >
                    Valider
                  </button>
                  <button
                    className="btn-export-csv"
                    onClick={() => handleExporterCSV(article.id)}
                  >
                    Exporter CSV
                  </button>
                  <button
                    className="btn-export-txt"
                    onClick={() => handleExporterText(article.id)}
                  >
                    Exporter TXT
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="aucun-article">
                Aucun article trouvé
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="bouton-retour">
        <button type="button" onClick={handleRetour}>
          Retour
        </button>
      </div>
    </div>
  );
}

export default Valideur;