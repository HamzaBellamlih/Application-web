// src/pages/Articles.jsx
import React from "react";
import "./css/Type_articles.css"; // si tu veux garder ton style .textbois
import Table from "./images/Table.jpg";
import Chaise from "./images/Chaise.jpg";
import Armoire from "./images/Armoire.jpg";
import Étagère from "./images/Étagère.jpg";
import Bureau from "./images/Bureau.jpg";
import Lit from "./images/Lit.jpg";
import Commode from "./images/Commode.jpg";
import Canapé from "./images/Canapé.jpg";
import Bibliothèque from "./images/Bibliothèque.jpg";

function Type_Articles() {
  const articles = [
    { nom: "Table", Image: Table },
    { nom: "Chaise", Image: Chaise },
    { nom: "Armoire", Image: Armoire },
    { nom: "Étagère", Image: Étagère },
    { nom: "Bureau", Image: Bureau },
    { nom: "Lit", Image: Lit },
    { nom: "Commode", Image: Commode },
    { nom: "Canapé", Image: Canapé },
    { nom: "Bibliothèque", Image: Bibliothèque },
  ];

  const handleRetour = () => {
    window.history.back();
  };

  return (
    <div className="body">
      <h1 className="titre">🪑 Articles & Prix</h1>

      <div className="Types">
        {articles.map((item, index) => (
          <div
            key={index}
            className="textbois"
          >
            <div className="bois">
              <img src={item.Image} alt={item.nom} />
              <h1 className="textbois">{item.nom}</h1>
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleRetour} type="button" className="Retour">Retour</button>
    </div>
  );
}

export default Type_Articles;