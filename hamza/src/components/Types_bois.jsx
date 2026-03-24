// src/pages/Bois.jsx
import React from "react";
import "./css/Type_bois.css"; // si tu veux garder ton style .textbois
import Chêne from "./images/Chêne.jpg";
import Sapin from "./images/Sapin.jpg";
import Iroko from "./images/Iroko.jpg";
import Érable from "./images/Érable.jpg";
import Acajou from "./images/Acajou.jpg";
import Hêtre from "./images/Hêtre.jpg";
import Bouleau from "./images/Bouleau.jpg";
import Meranti from "./images/Meranti.jpg";
import Teck from "./images/Teck.jpg";
import Pin from "./images/Pin.jpg";

function Bois() {
  const bois = [
    { nom: "Chêne", prix: "250 DH/m²", image: Chêne },
    { nom: "Sapin", prix: "120 DH/m²", image: Sapin },
    { nom: "Iroko", prix: "400 DH/m²", image: Iroko },
    { nom: "Érable", prix: "280 DH/m²", image: Érable },
    { nom: "Acajou", prix: "350 DH/m²", image: Acajou },
    { nom: "Hêtre", prix: "220 DH/m²", image: Hêtre },
    { nom: "Bouleau", prix: "200 DH/m²", image: Bouleau },
    { nom: "Meranti", prix: "300 DH/m²", image: Meranti },
    { nom: "Teck", prix: "500 DH/m²", image: Teck },
    { nom: "Pin", prix: "150 DH/m²", image: Pin },
  ];

  const handleRetour = () => {
    window.history.back();
  };

  return (
    <div className="body">
      <h1 className="titre">
        🌳 Types de Bois & Prix
      </h1>

      <div className="Types">
        {bois.map((item, index) => (
          <div
            key={index}
            className="bois"
          >
            <img
              src={item.image}
              alt={item.nom}
            />
            <div className="textbois">
              <span className="textbois">{item.nom}</span>
              <span className="textbois">{item.prix}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleRetour}
        type="button"
        className="Retour"
      >
        Retour
      </button>
    </div>
  );
}

export default Bois;