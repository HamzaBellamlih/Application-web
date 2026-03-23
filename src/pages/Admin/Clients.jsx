import { useNavigate } from 'react-router-dom';
import './css/Clients.css';
import React, { useEffect, useState } from 'react';

function Clients() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('http://localhost:8000/api/liste_clients/')
            .then(res => {
                if (!res.ok) throw new Error('Erreur lors du chargement des clients');
                return res.json();
            })
            .then(data => setClients(data))
            .catch(err => setError(err.message));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/HomeAdmin');
    };

    return (
    <div className="liste-container">
      <h2 className="liste-title">Liste des Clients</h2>

      {error && <p className="error-message">{error}</p>}

      {clients.length === 0 ? (
        <p className="no-data">Aucun client trouvé.</p>
      ) : (
        <table className="liste-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Adresse</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id} className="table-row">
                <td>{client.id}</td>
                <td>{client.nom}</td>
                <td>{client.prenom}</td>
                <td>{client.email}</td>
                <td>{client.telephone}</td>
                <td>{client.adresse}</td>
                <td>
                  <button
                    className="btn-modifier"
                    onClick={() => navigate(`/modifier_client/${client.id}`)}
                  >
                    Modifier
                  </button>
                  <button
                    className="btn-supprimer"
                    onClick={() => navigate(`/supprimer_client/${client.id}`)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button className="back-button" onClick={handleLogout}>
        Retour Home
      </button>
    </div>
  );
}

export default Clients;