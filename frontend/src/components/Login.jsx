import React, { useState } from 'react';
import './css/Login.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setToken } from '../utils/auth';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Exemple simple avec des identifiants en dur
    if (username === 'admin' && password === '1234') {
      setToken('fake-jwt-token');
      navigate('/Home');
    } else if (username === 'Valideur' && password === '2345') {
      setToken('valideur-jwt-token');
      navigate('/Valideur');
    } else {
      // Vérification côté backend pour un client
      try {
        const response = await axios.post('http://localhost:8000/api/login/', {
          username,
          password
        });
        // Vérifier que le token est bien présent dans la réponse
        if (response.data.token) {
          setToken(response.data.token);
          console.log('✅ Token stocké:', response.data.token);
          navigate('/Client');
        } else {
          setError('Token non reçu du serveur');
        }
      } catch (error) {
        setError(
          error.response?.data?.message ||
          'Nom d’utilisateur ou mot de passe incorrect'
        );
      }
    }
  };

  return (
    <div className="login-container">
      <h2>Connexion</h2>
      <form onSubmit={handleLogin} className="login-form">
        <div className='login'>
          <input
            type="text"
            placeholder="Nom d’utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-login">Se connecter</button>
        <button
          type="button"
          className="btn-signup"
          onClick={() => navigate('/Inscription')}
        >
          Créer un compte
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default Login;