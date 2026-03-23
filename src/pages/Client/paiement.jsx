import React, { useState, useEffect } from "react";
import "./css/paiement.css";
import { useParams } from "react-router-dom";
import { authenticatedFetch } from "../../utils/auth";

function Paiement() {
  const { article_id } = useParams();
  const [prixRestant, setPrixRestant] = useState(null);
  const [prixTotal, setPrixTotal] = useState(null);
  const [montantPaye, setMontantPaye] = useState("");
  const [message, setMessage] = useState("");
  const [aRendre, setARendre] = useState(null);
  const [manquant, setManquant] = useState(null);
  const [client, setClient] = useState(null);
  const [article, setArticle] = useState(null);
  const [erreur, setErreur] = useState("");

  // 🔹 Charger les infos client
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

  // 🔹 Charger article
  useEffect(() => {
    const fetchArticles = async () => {
      if (!client) return;
      try {
        const response = await authenticatedFetch(`http://localhost:8000/api/liste_articles_client`);
        const found = response.find(a => Number(a.id) === Number(article_id));
        if (found) setArticle(found);
      } catch (err) {
        setErreur("Erreur lors du chargement de l'article : " + (err?.message || err));
      }
    };
    fetchArticles();
  }, [article_id, client]);

  // 🔹 Charger prix
  useEffect(() => {
    if (!article_id) return;
    const fetchPrix = async () => {
      try {
        const res = await authenticatedFetch(`http://localhost:8000/api/prix_total_detail/${article_id}/`);
        if (res?.article) {
          setPrixTotal(res.article.prix_total);
          setPrixRestant(res.article.prix_restant);
        }
      } catch (e) {
        console.error("Erreur chargement prix :", e);
      }
    };
    fetchPrix();
  }, [article_id]);

  // 🔹 Paiement
  const handlePayer = async (e) => {
    e.preventDefault();
    setMessage(""); setARendre(null); setManquant(null); setErreur("");

    if (!montantPaye || Number(montantPaye) <= 0) {
      setErreur("Veuillez entrer un montant valide.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/paiement/${article_id}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montant_paye: Number(montantPaye) }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setARendre(data.prix_a_rendre ?? null);
      setManquant(data.manquant ?? null);
      setPrixRestant(data.article?.prix_restant ?? prixRestant);
      setPrixTotal(data.article?.prix_total ?? prixTotal);
      setMessage(data.message || "✅ Paiement effectué avec succès !");
      setMontantPaye("");
    } catch (err) {
      console.error(err);
      setErreur("Erreur lors du paiement : " + (err?.message || err));
      setMessage("❌ Erreur lors du paiement.");
    }
  };

  const handleRetour = () => window.history.back();

  return (
    <div className="paiement-container">
      <div className="paiement-card">
        <h2 className="titre">💰 Paiement de l'article #{article_id}</h2>

        {client && <p className="info-client">👤 {client.nom} {client.prenom}</p>}

        {article && (
          <div className="article-details">
            <p><strong>Article :</strong> {article.nom} — {article.type}</p>
            <p><strong>Épaisseur :</strong> {article.epaisseur}</p>
          </div>
        )}

        <div className="prix-section">
          <p>💵 Prix total : <strong>{prixTotal ?? "Chargement..."} MAD</strong></p>
          <p>🧾 Reste à payer : <strong>{prixRestant ?? "Après le paiement"} MAD</strong></p>
        </div>

        <form onSubmit={handlePayer} className="paiement-form">
          <input
            type="number"
            placeholder="💸 Montant payé"
            value={montantPaye}
            onChange={(e) => setMontantPaye(e.target.value)}
            required
          />
          <button type="submit">Payer</button>
        </form>

        {message && <p className="message">{message}</p>}
        {manquant !== null && <p className="alert">⚠️ Montant manquant : {manquant} MAD</p>}
        {aRendre !== null && <p className="alert">💵 À rendre : {aRendre} MAD</p>}
        {erreur && <p className="error">{erreur}</p>}

        <button onClick={handleRetour} className="retour-btn">← Retour</button>
      </div>
    </div>
  );
}

export default Paiement;