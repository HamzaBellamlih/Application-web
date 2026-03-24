import React, { useState, useCallback, useEffect } from "react";
import "./css/ajouter_article.css";
import axios from "axios";
import { authenticatedFetch } from "../../utils/auth";

const AjouterArticle = () => {
  const [nom, setNom] = useState("");
  const [type, setType] = useState("");
  const [epaisseur, setEpaisseur] = useState("");
  const [nbMesures, setNbMesures] = useState(1);
  const [mesures, setMesures] = useState([]);
  const [dateCreation, setDateCreation] = useState(new Date().toISOString());

  // Champs planche
  const [longueurPlanche, setLongueurPlanche] = useState("");
  const [largeurPlanche, setLargeurPlanche] = useState("");

  const [client, setClient] = useState(null);
  const [error, setError] = useState("");

  // Listes pour select
  const nomArticles = [
    "Table", "Chaise", "Armoire", "Étagère", "Bureau",
    "Lit", "Commode", "Canapé", "Bibliothèque"
  ];

  const typesBois = [
    "Chêne", "Sapin", "Iroko", "Érable", "Acajou",
    "Hêtre", "Bouleau", "Meranti", "Teck", "Pin"
  ];
  const epaisseursBois = [5, 10, 15, 20, 25, 30];

  // Récupération infos client
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const data = await authenticatedFetch("http://localhost:8000/api/client_info/");
        setClient(data);
      } catch (err) {
        setError("Erreur lors de la récupération des données: " + err.message);
      }
    };
    fetchClientData();
  }, []);

  const handleRetour = () => {
    window.history.back();
  };

  const handleMesuresChange = useCallback((nb) => {
    const newMesures = Array.from({ length: nb }, (_, i) => mesures[i] || {
      longueur: "",
      largeur: "",
      nombre_de_fois: 1,
      droite: false,
      gauche: false,
      haut: false,
      bas: false,
    });
    setMesures(newMesures);
  }, [mesures]);

  useEffect(() => {
    handleMesuresChange(nbMesures);
  }, [nbMesures, handleMesuresChange]);

  const handleChange = (index, field, value) => {
    const updatedMesures = [...mesures];
    updatedMesures[index][field] = value;
    setMesures(updatedMesures);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const clientData = await authenticatedFetch("http://localhost:8000/api/client_info/");
      if (!clientData || !clientData.username) {
        alert("❌ Erreur: Impossible de vérifier l'identité du client");
        return;
      }

      const token = localStorage.getItem("token");

      const body = {
        dateCreation,
        nom,
        type,
        epaisseur,
        nb_mesures: mesures.length,
        client_username: clientData.username,
        planche: {
          longueur_initiale_mm: parseInt(longueurPlanche),
          largeur_initiale_mm: parseInt(largeurPlanche),
        }
      };

      mesures.forEach((mesure, index) => {
        body[`mesure_${index}`] = {
          longueur: parseFloat(mesure.longueur),
          largeur: parseFloat(mesure.largeur),
          nombre_de_fois: parseInt(mesure.nombre_de_fois),
          encadrement_droite: mesure.droite || false,
          encadrement_gauche: mesure.gauche || false,
          encadrement_haut: mesure.haut || false,
          encadrement_bas: mesure.bas || false,
        };
      });

      await axios.post(
        "http://localhost:8000/api/ajouter_article_client",
        body,
        {
          headers: {
            Authorization: `Bearer ${token} Client (${clientData.id}) ${clientData.username}:${clientData.nom}:${clientData.prenom}:${clientData.email}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert(`✅ Article et planche ajoutés avec succès pour ${clientData.nom} ${clientData.prenom} !`);
      setDateCreation(new Date().toISOString());
      setNom("");
      setType("");
      setEpaisseur("");
      setNbMesures(1);
      setMesures([]);
      setLongueurPlanche("");
      setLargeurPlanche("");
    } catch (error) {
      alert("❌ Erreur lors de l'ajout: " + (error.response?.data?.message || error.message));
    }
  };

return (
    <div className="ajouter-article-container">
      <h2>Ajouter un article</h2>

      {error && <p className="error">{error}</p>}
      {client && <p className="client-info">👤 {client.nom} {client.prenom}</p>}

      <form onSubmit={handleSubmit} className="mesure-card">
        <label>Nom de l’article :</label>
        <select value={nom} onChange={(e) => setNom(e.target.value)} required>
          <option value="">-- Choisir --</option>
          {nomArticles.map((n, i) => <option key={i} value={n}>{n}</option>)}
        </select>

        <label>Type de bois :</label>
        <select value={type} onChange={(e) => setType(e.target.value)} required>
          <option value="">-- Choisir --</option>
          {typesBois.map((t, i) => <option key={i} value={t}>{t}</option>)}
        </select>

        <label>Épaisseur :</label>
        <select value={epaisseur} onChange={(e) => setEpaisseur(e.target.value)} required>
          <option value="">-- Choisir --</option>
          {epaisseursBois.map((e, i) => <option key={i} value={e}>{e} mm</option>)}
        </select>

        <h3>📏 Dimensions de la planche</h3>
        <div className="form-grid">
          <input type="number" placeholder="Longueur (mm)" value={longueurPlanche} onChange={(e) => setLongueurPlanche(e.target.value)} required />
          <input type="number" placeholder="Largeur (mm)" value={largeurPlanche} onChange={(e) => setLargeurPlanche(e.target.value)} required />
        </div>

        <label>Nombre de mesures :</label>
        <input type="number" min="1" value={nbMesures} onChange={(e) => setNbMesures(parseInt(e.target.value))} />

        {mesures.map((m, i) => (
          <div key={i} className="mesure-card">
            <h4>Mesure {i + 1}</h4>
            <input type="number" placeholder="Longueur (mm)" value={m.longueur} onChange={(e) => handleChange(i, "longueur", e.target.value)} required />
            <input type="number" placeholder="Largeur (mm)" value={m.largeur} onChange={(e) => handleChange(i, "largeur", e.target.value)} required />
            <input type="number" placeholder="Quantité" value={m.nombre_de_fois} onChange={(e) => handleChange(i, "nombre_de_fois", e.target.value)} required />
            <div className="bords">
              {["droite", "gauche", "haut", "bas"].map((side) => (
                <label key={side}>
                  <input
                    type="checkbox"
                    checked={m[side]}
                    onChange={(e) => handleChange(i, side, e.target.checked)}
                  /> {side}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="btn-group">
          <button type="submit" className="btn-wood">✅ Ajouter</button>
          <button type="button" className="btn-secondary" onClick={handleRetour}>↩ Retour</button>
        </div>
      </form>
    </div>
  );
};

export default AjouterArticle;