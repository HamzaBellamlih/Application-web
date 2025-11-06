// src/pages/Client/modifier_article.jsx
import React, { useEffect, useState } from "react";
import './css/modifier_article.css';
import { useParams, useNavigate, Link } from "react-router-dom";
import { authenticatedFetch } from "../../utils/auth";

function ModifierArticleClient() {
    const { article_id: articleIdParam } = useParams();
    const articleId = Number(articleIdParam);
    const navigate = useNavigate();

    const [article, setArticle] = useState(null);
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [nom, setNom] = useState("");
    const [epaisseur, setEpaisseur] = useState("");
    const [longueur_initiale_mm, setLongueur_initiale_mm] = useState("");
    const [largeur_initiale_mm, setLargeur_initiale_mm] = useState("");
    const [type, setType] = useState("");
    const [date_modification, setDate_modification] = useState(new Date().toISOString());
    
    const nomArticles = [
        "Table", "Chaise", "Armoire", "Étagère", "Bureau",
        "Lit", "Commode", "Canapé", "Bibliothèque"
    ];

    const typesBois = [
        "Chêne", "Sapin", "Iroko", "Érable", "Acajou",
        "Hêtre", "Bouleau", "Meranti", "Teck", "Pin"
    ];

    const epaisseursBois = [5, 10, 15, 20, 25, 30];

    // Charger info client
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

    // Charger article depuis liste
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
            const articles = await authenticatedFetch("http://localhost:8000/api/liste_articles_client");
            if (!Array.isArray(articles)) {
            throw new Error("Réponse inattendue : tableau d’articles attendu.");
            }
            const found = articles.find(a => Number(a.id) === articleId);
            if (!found) {
            throw new Error(`Aucun article avec l’ID ${articleId}.`);
            }
            setArticle(found);
            setNom(found.nom || "");
            setEpaisseur(found.epaisseur || "");
            setType(found.type || "");
            setDate_modification(new Date().toISOString());
            if (found.planches?.length > 0) {
            setLongueur_initiale_mm((found.planches[0].longueur_initiale_mm || 0) / 10);
            setLargeur_initiale_mm((found.planches[0].largeur_initiale_mm || 0) / 10);
            }
        } catch (e) {
            setErr(e?.message || "Erreur lors du chargement de l’article.");
        } finally {
            setLoading(false);
        }
        })();
    }, [articleId]);

    // Modifier
    const handleModifier = async (e) => {
        e.preventDefault();
        if (!article) return;

        setLoading(true);
        setErr("");

        try {
        const payload = {
            nom,
            epaisseur,
            type,
            longueur_initiale_mm,
            largeur_initiale_mm,
            date_modification
        };

        const res = await authenticatedFetch(
            `http://localhost:8000/api/modifier_article/${articleId}`, // 🔹 adapte à ton backend
            {
            method: "POST", // ou PUT si ton backend attend PUT
            body: JSON.stringify(payload),
            }
        );

        if (res?.message) {
            alert("✅ " + res.message);
            navigate("/Lister_articles");
        } else {
            alert("✅ Article modifié.");
            navigate("/Lister_articles");
        }
        } catch (e) {
        setErr(e?.message || "Erreur lors de la modification.");
        } finally {
        setLoading(false);
        }
    };

    // UI
    if (loading && !article) return <p>Chargement…</p>;
    if (err && !article) return <p style={{ color: "red" }}>{err}</p>;
    if (!article) return <p>Aucun article pour l’ID <strong>{articleId}</strong>. <Link to="/Lister_articles">Retour</Link></p>;

    return (
        <div className="ajouter-article-container">
            <h2>Modifier un article</h2>

            {client && (
            <p className="client-info">
                Connecté en tant que <strong>{client.username}</strong>
            </p>
            )}

            <form onSubmit={handleModifier}>
            <label className="form-input">Nom :</label>
            <select
                value={nom}
                onChange={(e) => setNom(e.target.value)}
            >
                <option value="">-- Sélectionnez un article --</option>
                {nomArticles.map((article, index) => (
                <option key={index} value={article}>
                    {article}
                </option>
                ))}
            </select>

            <label className="form-input">Épaisseur (mm) :</label>
            <select
                value={epaisseur}
                onChange={(e) => setEpaisseur(e.target.value)}
            >
                <option value="">-- sélectionner un type --</option>
                {epaisseursBois.map((epais, index) => (
                <option key={index} value={epais}>
                    {epais} mm
                </option>
                ))}
            </select>

            <label className="form-input">Type de bois :</label>
            <select
                value={type}
                onChange={(e) => setType(e.target.value)}
            >
                <option value="">-- sélectionner un type --</option>
                {typesBois.map((bois, index) => (
                <option key={index} value={bois}>
                    {bois}
                </option>
                ))}
            </select>

            <label className="form-input">Longueur planche (cm) :</label>
            <input className="form-select"
                type="number"
                value={longueur_initiale_mm}
                onChange={(e) => setLongueur_initiale_mm(e.target.value)}
            />

            <label className="form-input">Largeur planche (cm) :</label>
            <input className="form-select"
                type="number"
                value={largeur_initiale_mm}
                onChange={(e) => setLargeur_initiale_mm(e.target.value)}
            />

            <div className="btn-group" style={{ marginTop: 20 }}>
                <button type="submit" className="btn-wood">Modifier</button>
                <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/Lister_articles")}
                >
                Annuler
                </button>
            </div>
            </form>

            {err && <p className="error">{err}</p>}
        </div>
    );
}

export default ModifierArticleClient;