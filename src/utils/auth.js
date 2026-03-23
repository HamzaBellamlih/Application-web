// Utilitaires pour la gestion de l'authentification

export const getToken = () => {
    return localStorage.getItem('token');
};

export const setToken = (token) => {
    localStorage.setItem('token', token);
};

export const removeToken = () => {
    localStorage.removeItem('token');
};

export const isAuthenticated = () => {
    const token = getToken();
    return token && token !== 'undefined' && token !== 'null';
};

export const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// Fonction pour faire des appels API authentifiés
export const authenticatedFetch = async (url, options = {}) => {
    const token = getToken();
    
    if (!token) {
        throw new Error('Aucun token d\'authentification trouvé');
    }

    const config = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        },
        ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
}; 