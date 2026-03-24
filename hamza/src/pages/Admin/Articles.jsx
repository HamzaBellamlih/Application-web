// src/pages/Client/ClientsArticles.jsx
import React, { useEffect, useState } from 'react';
import './css/Articles.css';
import { useNavigate } from 'react-router-dom';

function ClientsArticles() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/api/liste_articles_clients')
      .then(res => {
        if (!res.ok) throw new Error('Erreur lors du chargement des clients');
        return res.json();
      })
      .then(data => {
        console.log("Réponse API:", data); // 👈 debug
        setClients(data.clients || []);   // ⚠️ on prend bien data.clients
      })
      .catch(err => setError(err.message));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/HomeAdmin');
  };

  return (
    <div className="liste-container">
      <h2 className="liste-title">Liste des Clients et Articles</h2>

      {error && <p className="error-message">{error}</p>}

      {clients.length === 0 ? (
        <p className="no-data">Aucun client trouvé.</p>
      ) : (
        <table className="liste-table">
          <thead>
            <tr>
              <th>ID Client</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Total des Prix</th>
              <th>Articles</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((entry, idx) => {
              const totalPrixTotal = entry.articles.reduce(
                (sum, a) => sum + (parseFloat(a.prix_total) || 0),
                0
              );
              const totalPrixRestant = entry.articles.reduce(
                (sum, a) => sum + (parseFloat(a.prix_restant) || 0),
                0
              );
              const reste = totalPrixTotal - totalPrixRestant;

              return (
                <tr key={idx}>
                  <td>{entry.client?.id}</td>
                  <td>{entry.client?.nom} {entry.client?.prenom}</td>
                  <td>{entry.client?.email}</td>
                  <td>{entry.client?.telephone}</td>
                  <td>
                    Total: {totalPrixTotal} DH<br />
                    Restant: {totalPrixRestant} DH<br />
                    Payé: {reste} DH
                  </td>
                  <td>
                    {entry.articles && entry.articles.length > 0 ? (
                      <ul className="articles-list">
                        {entry.articles.map(article => (
                          <li key={article.id}>
                            {article.nom} ({article.type}) | {article.epaisseur} mm | Créé le {article.date_creation} | Total: {article.prix_total} DH | Restant: {article.prix_restant} DH
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "Aucun article"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <button className="back-button" onClick={handleLogout}>
        Retour Home
      </button>
    </div>
  );
}

export default ClientsArticles;