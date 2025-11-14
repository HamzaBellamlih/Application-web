import React, { useState, useEffect } from "react";
import "./css/Saas.css";

export default function OffersPage() {
  const [selectedPrice, setSelectedPrice] = useState(599);
  const [selectedOffer, setSelectedOffer] = useState("premium");

  const offers = [
    {
      id: "basique",
      name: "Forfait Basique",
      price: 299,
      features: [
        "Installation de 1 à 2 fenêtres",
        "Bois standard (pin ou sapin)",
        "Garantie 1 an",
        "Conseil technique inclus"
      ]
    },
    {
      id: "premium",
      name: "Forfait Premium",
      price: 599,
      popular: true,
      features: [
        "Installation de 3 à 5 fenêtres",
        "Bois noble (chêne, noyer)",
        "Garantie 5 ans",
        "Design personnalisé",
        "Entretien gratuit pendant 1 an"
      ]
    },
    {
      id: "surmesure",
      name: "Projet Sur Mesure",
      price: 1200,
      features: [
        "Projet entièrement personnalisé",
        "Bois et finition au choix",
        "Garantie 10 ans",
        "Conception 3D incluse",
        "Maintenance annuelle",
        "Accompagnement sur toute la durée"
      ]
    }
  ];

  const selectOffer = (offer) => {
    setSelectedPrice(offer.price);
    setSelectedOffer(offer.id);
  };

  const payer = () => {
    const offerName = offers.find(o => o.id === selectedOffer).name;
    alert(
      `Merci ! Vous avez sélectionné : ${offerName} (${selectedPrice} €)\n\nVotre paiement sera traité sous peu.`
    );
  };

  return (
    <div className="container">
      <header>
        <h1>Choisissez votre offre</h1>
        <p>Des solutions sur mesure pour vos projets de menuiserie</p>
      </header>

      <div className="offers">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className={`offer 
              ${offer.popular ? "offer-popular" : ""}
              ${selectedOffer === offer.id ? "selected" : ""}
            `}
            onClick={() => selectOffer(offer)}
          >
            {offer.popular && <div className="popular-badge">Le plus populaire</div>}

            <h3 className="offer-title">{offer.name}</h3>
            <div className="offer-price">{offer.price} €</div>

            <ul className="offer-features">
              {offer.features.map((f, index) => (
                <li key={index}>{f}</li>
              ))}
            </ul>

            <button>Sélectionner</button>
          </div>
        ))}
      </div>

      <div className="total-section">
        <p>Vous avez choisi :</p>
        <div className="total">Total : {selectedPrice} €</div>
        <button className="btn-payer" onClick={payer}>
          Payer maintenant
        </button>
        <div className="footer-note">
          Paiement sécurisé • Cryptage SSL • <a href="#">Conditions</a>
        </div>
      </div>
    </div>
  );
}