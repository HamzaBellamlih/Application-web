// src/pages/Client/SupprimerClient.jsx
import React, { useState } from "react";
import "./css/supprimer_client.css";
import { useParams, useNavigate } from "react-router-dom";

function SupprimerClient() {
  const { id } = useParams(); // récupère l'ID depuis l'URL
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/supprimer_client/${id}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      setMessage(data.message);

      if (data.success) {
        setTimeout(() => navigate("/clients"), 1500); // Retour vers la liste après suppression
      }
    } catch (error) {
      setMessage("❌ Erreur : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delete-container">
      <h2 className="delete-title">Supprimer Client</h2>
      <p className="delete-warning">⚠️ Voulez-vous vraiment supprimer ce client (ID: {id}) ?</p>

      <div className="delete-buttons">
        <button
          className="btn-delete"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "Suppression..." : "Oui, supprimer"}
        </button>

        <button
          className="btn-cancel"
          onClick={() => navigate(-1)}
        >
          Annuler
        </button>
      </div>

      {message && <p className="delete-message">{message}</p>}
    </div>
  );
}

export default SupprimerClient;