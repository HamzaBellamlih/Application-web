// src/pages/Home.jsx
import React from "react";
import "./css/Accueil.css";
import { useNavigate } from "react-router-dom";

function Accueil() {
  const navigate = useNavigate();

  return (
    <div className="bg-wood">
      <h1 className="title">
        Bienvenue dans l'Application de Gestion des Articles du Bois
      </h1>

      <p className="description">
        Notre application intègre un système d’optimisation de découpe qui
        calcule automatiquement la meilleure façon de découper les panneaux de
        bois selon les mesures exactes des articles commandés par le client.
        <br /><br />
        ✅ Cela permet de :
        <br />• Réduire les pertes de matière.
        <br />• Gagner du temps grâce à une organisation claire.
        <br />• Améliorer la précision et éviter les erreurs.
        <br />• Optimiser les coûts de production.
        <br /><br />
        En un mot, ce module transforme les demandes des clients en plans de
        découpe intelligents, garantissant efficacité, économie et qualité.
      </p>

      <div className="btn-group">
        <button
          onClick={() => navigate("/TypeArticles")}
          className="btn-wood"
        >
          Découvrir les Articles
        </button>
        <button
          onClick={() => navigate("/TypeBois")}
          className="btn-wood"
        >
          Découvrir les Bois
        </button>
        <button
          onClick={() => navigate("/Saas")}
          className="btn-wood"
        >
          🌐 Découvrir SaaS
        </button>
        <button
          onClick={() => navigate("/login")}
          className="btn-login"
        >
          🔐 Connexion
        </button>
      </div>
    </div>
  );
}

export default Accueil;