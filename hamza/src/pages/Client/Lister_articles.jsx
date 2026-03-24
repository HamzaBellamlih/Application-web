import React, { useEffect, useState } from 'react';
import './css/Lister_articles.css';
import { authenticatedFetch } from "../../utils/auth";
import { useNavigate } from 'react-router-dom';

function ListeArticlesClient() {
  const [client, setClient] = useState(null);
  const [articles, setArticles] = useState([]);
  const [erreur, setErreur] = useState('');
  const navigate = useNavigate();

  const handleRetour = () => {
    navigate('/Client');
  };

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const data = await authenticatedFetch("http://localhost:8000/api/client_info/");
        setClient(data);
      } catch (err) {
        setErreur("Erreur lors de la récupération des données: " + err.message);
      }
    };
    fetchClientData();
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      if (!client) return;
      try {
        const response = await authenticatedFetch(`http://localhost:8000/api/liste_articles_client`);
        setArticles(response);
      } catch (err) {
        setErreur("Erreur lors du chargement des articles: " + err.message);
      }
    };
    fetchArticles();
  }, [client]);

  const handleExporterText = async (articleId) => {
    try {
      const url = `http://localhost:8000/api/exporter_articles_text/${articleId}/`;
      const response = await fetch(url, { method: "GET" });

      // ✅ Vérification correcte de l'erreur
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status} : ${response.statusText}`);
      }

      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = `article_${articleId}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      alert("⚠️"+ articleId + error.message);
    }
  };

  // 🔹 Export CSV pour un article donné
  const handleExporterCSV = async (articleId) => {
    try {
      const url = `http://localhost:8000/api/exporter_articles_csv/${articleId}/`;
      const response = await fetch(url, { method: "GET" });
      if (!response.ok) throw new Error(erreur.message);

      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = `article_${articleId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      alert("⚠️" + error.message);
    }
  };

  return (
    <div className="wood-container">
      <h2 className="wood-title">Mes Articles</h2>
      {erreur && <p style={{ color: 'red' }}>{erreur}</p>}

      {!client ? (
        <p>Chargement du client...</p>
      ) : (
        <div className='table-container'>
          <table className="wood-table" border="1" cellPadding="5">
            <thead>
              <tr>
                <th>Date de Creation</th>
                <th>Date de modification</th>
                <th>Id</th>
                <th>Nom</th>
                <th>Planche</th>
                <th>Type de bois</th>
                <th>Épaisseur (cm)</th>
                <th>Mesures</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 && (
                <tr><td colSpan="5"><em>Aucun article trouvé.</em></td></tr>
              )}
              {articles.map((article) => (
                <tr key={article.id}>
                  {/* Date de création */}
                  <td>{article.date_creation}</td>
                  {/* Date de modification */}
                  <td>{article.date_modification}</td>
                  {/* Colonne ID */}
                  <td>{article.id}</td>
                  {/* Nom de l'article */}
                  <td>{article.nom || "N/A"}</td>

                  {/* Planches */}
                  <td>
                    {article.planche ? (
                      <div>
                        {article.planche.longueur_initiale_mm/10} × {article.planche.largeur_initiale_mm/10} cm
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </td>

                  {/* Type de bois */}
                  <td>{article.type || "N/A"}</td>

                  {/* Epaisseur */}
                  <td>{article.epaisseur || "N/A"}</td>

                  {/* Mesures */}
                  <td>
                    {Array.isArray(article.mesures) && article.mesures.length > 0 ? (
                      article.mesures.map((m, i) => (
                        <div key={i} style={{ marginBottom: '8px' }}>
                          <strong>{m.longueur} × {m.largeur}</strong> {m.nombre_de_fois} fois
                          | Encadrement :
                          {m.encadrement_droite ? "D " : ""}
                          {m.encadrement_gauche ? "G " : ""}
                          {m.encadrement_haut ? "H " : ""}
                          {m.encadrement_bas ? "B " : ""}
                          {!m.encadrement_droite && !m.encadrement_gauche && !m.encadrement_haut && !m.encadrement_bas && <em>aucun</em>}
                        </div>
                      ))
                    ) : (
                      <em>Aucune mesure</em>
                    )}
                  </td>
                  {/* Actions */}
                  <td className="action-buttons">
                    <button
                      onClick={() => window.location.href = `/modifier_article_client/${article.id}`}
                    > Modifier Article </button><br />
                    <button
                      onClick={() => window.location.href = `/supprimer_article_client/${article.id}`}
                    > Supprimer Article </button><br />
                    <button type="button"
                        onClick={() => window.location.href = `/ajouter_mesure_client/${article.id}`}
                        > Ajouter Mesure </button><br />
                    <button onClick={() => window.location.href = `/modifier_mesure_client/${article.id}`}
                        > Modifier Mesure </button><br />
                    <button onClick={() => window.location.href = `/supprimer_mesure_client/${article.id}`}
                        > Supprimer Mesure </button><br />
                    <button onClick={() => handleExporterText(article.id)}
                        > Convertir TXT </button><br />
                    <button onClick={() => handleExporterCSV(article.id)}
                        > Convertir CSV </button><br />
                    <button onClick={() => window.location.href = `/paiement/${article.id}`}
                        > Paiment </button><br />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button
        onClick={handleRetour}
        className='back-button'
        style={{
          cursor: "pointer"
        }}
        >Retour</button>
    </div>
  );
}

export default ListeArticlesClient;