import React, { useState } from 'react';
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
    <div>
      <h2>Inscription Client</h2>
      <form onSubmit={handleInscription}>
        <input
          type="text"
          placeholder="Nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
        /><br />
        <input
          type="text"
          placeholder="Prénom"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          required
        /><br />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br />
        <input
          type="text"
          placeholder="Adresse"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          required
        /><br />
        <input
          type="text"
          placeholder="Téléphone"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          required
        /><br /><br />
        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        /><br />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br />
        <button type="submit">S'inscrire</button>
      </form>
      {/* Affiche le message uniquement après soumission */}
      {message && <p>{message}</p>}
      <p>
        Déjà un compte ? <button type="button" onClick={() => navigate('/')}> Se connecter</button>
      </p>
    </div>
  );
}

export default Inscription;