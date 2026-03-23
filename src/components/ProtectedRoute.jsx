import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
        // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute; 