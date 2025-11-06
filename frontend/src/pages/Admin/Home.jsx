import React from 'react';
import './css/Home.css';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    // 1. Supprimer les données de session (token, user, etc.)
    localStorage.removeItem('token'); // ou sessionStorage.removeItem('token')
    
    // 2. Redirection vers la page de login
    navigate('/'); // ou '/', selon ton app
  };

  return (
    <div className="menu-container">
      <h2 className="menu-title">Menu Principal</h2>

      <button
        className="menu-button"
        onClick={() => navigate("/clients")}
      >
        Voir les Clients
      </button>

      <button
        className="menu-button"
        onClick={() => navigate("/articles")}
      >
        Voir les Articles
      </button>

      <button
        className="menu-button"
        onClick={handleLogout}
      >
        Déconnexion
      </button>
    </div>
  );
}

export default Home;