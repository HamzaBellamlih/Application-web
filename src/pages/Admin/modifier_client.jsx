import React, { useEffect, useState } from "react";
import "./css/modifier_client.css";
import { useParams, useNavigate } from "react-router-dom";

function ModifierClient() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Charger le client
  useEffect(() => {
    fetch(`http://localhost:8000/api/liste_clients/`)
      .then((res) => res.json())
      .then((data) => {
        const c = data.find((item) => item.id === parseInt(id));
        if (c) setClient(c);
      })
      .catch((err) => setMessage("Erreur chargement: " + err))
      .finally(() => setLoading(false));
  }, [id]);

  // Gérer les changements
  const handleChange = (e) => {
    setClient({ ...client, [e.target.name]: e.target.value });
  };

  // Sauvegarder
  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`http://localhost:8000/api/modifier_client/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(client),
    })
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message);
        if (data.success) {
          setTimeout(() => navigate("/clients"), 1500);
        }
      })
      .catch((err) => setMessage("Erreur : " + err));
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="form-container">
      <h2 className="form-title">Modifier Client</h2>
      {message && <p className="form-message">{message}</p>}

      <form onSubmit={handleSubmit} className="client-form">
        {["nom", "prenom", "email", "telephone", "adresse"].map((field) => (
          <div className="form-group" key={field}>
            <label>{field.charAt(0).toUpperCase() + field.slice(1)} :</label>
            <input
              type={field === "email" ? "email" : "text"}
              name={field}
              value={client[field]}
              onChange={handleChange}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              required
            />
          </div>
        ))}

        <div className="form-buttons">
          <button type="submit" className="btn-save">💾 Enregistrer</button>
          <button type="button" className="btn-back" onClick={() => navigate(-1)}>Retour</button>
        </div>
      </form>
    </div>
  );
}

export default ModifierClient;