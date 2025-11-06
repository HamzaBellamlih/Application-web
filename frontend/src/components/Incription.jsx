import React, { useState } from 'react';
import './css/Inscription.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Inscription() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');
  const [telephone, setTelephone] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleInscription = async (e) => {
    e.preventDefault();
    setMessage(""); // Efface le message à chaque soumission
    try {
      await axios.post('http://localhost:8000/api/inscription_client/', {
        nom,
        prenom,
        email,
        adresse,
        telephone,
        username,
        password,
      });
      setMessage('Inscription réussie ! Redirection vers la page de connexion...');
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      setMessage("Erreur d'inscription : " + (error.response?.data?.message || 'Veuillez réessayer.'));
    }
  };

  return (
    <div className="inscription-bois-container">
      <div className="form-card">
        <h2 className="form-title">Inscription Client</h2>

        <form onSubmit={handleInscription} className="inscription-form">
          <input type="text" placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required className="input-field" />
          <input type="text" placeholder="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required className="input-field" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" />
          <input type="text" placeholder="Adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} required className="input-field" />
          <input type="text" placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} required className="input-field" />
          <input type="text" placeholder="Nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} required className="input-field" />
          <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" />

          <button type="submit" className="btn-inscrire">S'inscrire</button>
        </form>

        {message && <p className="message">{message}</p>}

        <p className="connexion-text">
          Déjà un compte ?{" "}
          <button type="button" className="btn-connexion" onClick={() => navigate('/')}>
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}

export default Inscription;