import React, { useEffect, useState } from 'react';
import './css/accueil.css';
import { useNavigate } from 'react-router-dom';
import { removeToken, authenticatedFetch } from '../../utils/auth';

function AcceuilClient() {
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [error, setError] = useState('');

    const handleLogout = () => {
        removeToken();
        navigate('/');
    };

    const handAjout = () => {
        navigate('/ajout_article');
    }

    const handlister = () => {
        navigate('/Lister_articles');
    }

    useEffect(() => {
        const fetchClientData = async () => {
            try {
                const data = await authenticatedFetch("http://localhost:8000/api/client_info/");
                console.log("✅ Données client reçues:", data);
                setClient(data);
            } catch (err) {
                console.error("❌ Erreur lors de la récupération des données:", err.message);
                setError("Erreur lors de la récupération des données: " + err.message);
            }
        };

        fetchClientData();
    }, []);

    return (
        <div className="client-container">
        <h2 className="client-title">Bienvenue sur votre espace client 🌿</h2>

        {error && <p className="error">{error}</p>}

        {client ? (
            <div className="client-card">
            <ul>
                <li><strong>Nom :</strong> {client.nom}</li>
                <li><strong>Prénom :</strong> {client.prenom}</li>
                <li><strong>Email :</strong> {client.email}</li>
                <li><strong>Adresse :</strong> {client.adresse}</li>
                <li><strong>Téléphone :</strong> {client.telephone}</li>
            </ul>
            </div>
        ) : (
            <p className="loading">Chargement des informations...</p>
        )}

        <div className="button-group">
            <button onClick={handAjout} className="btn-wood">➕ Ajouter un article</button>
            <button onClick={handlister} className="btn-wood">📋 Lister les articles</button>
            <button onClick={handleLogout} className="btn-logout">🚪 Déconnexion</button>
        </div>
        </div>
    );
}

export default AcceuilClient;