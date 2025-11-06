// src/pages/Client/supprimer_article.jsx
import React, { useEffect, useState } from "react";
import './css/supprimer_article.css';
import { useParams, useNavigate, Link } from "react-router-dom";
import { authenticatedFetch } from "../../utils/auth";

function SupprimerArticleClient() {
  const { article_id: articleIdParam } = useParams();
  console.log("Params brut :", { articleIdParam });

  // ✅ convertir en nombre pour éviter l’égalité string/number
  const articleId = Number(articleIdParam);
  console.log("Article ID (number) :", articleId, "type:", typeof articleId);

  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Charger info client (optionnel)
  useEffect(() => {
    (async () => {
      try {
        const data = await authenticatedFetch("http://localhost:8000/api/client_info/");
        setClient(data);
      } catch (e) {
        console.warn("Client non chargé :", e?.message || e);
      }
    })();
  }, []);

  // Charger l’article depuis la **liste** puis filtrer par id
  useEffect(() => {
    if (!Number.isFinite(articleId)) {
      setErr("ID d’article invalide dans l’URL.");
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setErr("");
      try {
        // ⚠️ Utilise l’endpoint qui existe VRAIMENT chez toi
        const articles = await authenticatedFetch("http://localhost:8000/api/liste_articles_client");

        if (!Array.isArray(articles)) {
          throw new Error("Réponse inattendue : un tableau d’articles est attendu.");
        }

        // ✅ on compare nombre à nombre
        const found = articles.find(a => Number(a.id) === articleId);
        console.log("Article trouvé :", found);

        if (!found) {
          throw new Error(`Aucun article avec l’ID ${articleId}.`);
        }
        setArticle(found);
      } catch (e) {
        setErr(e?.message || "Erreur lors du chargement de l’article.");
      } finally {
        setLoading(false);
      }
    })();
  }, [articleId]);

  // Suppression
  const handleSupprimer = async () => {
    if (!article) return;
    const nom = article.nom || `#${articleId}`;
    if (!window.confirm(`Supprimer "${nom}" ? Cette action est irréversible.`)) return;

    setLoading(true);
    setErr("");

    try {
      // ⚠️ Fais correspondre le slash avec ton urls.py.
      // Tu as montré: path('supprimer_article_client/<int:article_id>', ...) => PAS de slash final
      // Donc on appelle SANS slash final :
      const res = await authenticatedFetch(
        `http://localhost:8000/api/supprimer_article_client/${articleId}`,
        { method: "POST" } // ton backend attend POST
      );

      // Si ton helper renvoie directement le JSON :
      if (res?.message) {
        alert("✅ " + res.message);
        navigate("/Lister_articles");
      } else {
        // Si ton helper renvoie Response, adapte :
        // const data = await res.json();
        // if (!res.ok) throw new Error(data.message || "Erreur suppression");
        alert("✅ Article supprimé.");
        navigate("/Lister_articles");
      }
    } catch (e) {
      setErr(e?.message || "Erreur lors de la suppression.");
    } finally {
      setLoading(false);
    }
  };

  // UI
  if (loading && !article) return <p>Chargement…</p>;
  if (err && !article) return <p style={{ color: "red" }}>{err}</p>;
  if (!article) return <p>Aucun article pour l’ID <strong>{articleId}</strong>. <Link to="/Lister_articles">Retour</Link></p>;

  return (
    <div className="supprimer-article-container">
      <h2 className="titre">Supprimer un article</h2>

      {client && (
        <p className="client-info">
          Connecté en tant que <strong>{client.username}</strong>
        </p>
      )}

      <div className="formulaire">
        <p><strong>ID :</strong> {article.id}</p>
        <p><strong>Nom :</strong> {article.nom || "N/A"}</p>
        <p><strong>Type de bois :</strong> {article.type || article.typeBois || "N/A"}</p>
        <p><strong>Épaisseur :</strong> {article.epaisseur} mm</p>
      </div>

      <div className="action-button">
        <button
          className="btn-supprimer"
          onClick={handleSupprimer}
          disabled={loading}
        >
          {loading ? "Suppression…" : "Supprimer"}
        </button>

        <button
          className="btn-annuler"
          onClick={() => navigate("/Lister_articles")}
        >
          Annuler
        </button>
      </div>

      {err && <p className="error">{err}</p>}
    </div>
  );
}

export default SupprimerArticleClient;