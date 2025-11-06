import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import HomeAdmin from "./pages/Admin/Home";
import Home from "./pages/Admin/Home";
import Clients from "./pages/Admin/Clients";
import Client from "./pages/Client/acceuil";
import Articles from "./pages/Admin/Articles";
import Valideur from "./pages/Valideur/Valideur";
import Incription from "./components/Incription";
import AjoutArticle from "./pages/Client/ajouter_article";
import ListeArticles from "./pages/Client/Lister_articles";
import SupprimerArticleClient from "./pages/Client/supprimer_article";
import ModifierArticle from "./pages/Client/modifier_article";
import SupprimerMesure from "./pages/Client/supprimer_mesure";
import ModifierMesure from "./pages/Client/modifier_mesure";
import AjoutMesure from "./pages/Client/Ajout_mesure";
import Paiement from "./pages/Client/paiement";
import Convertirtxt from "./pages/Client/convertir_txt";
import Convertircsv from "./pages/Client/convertir_csv";
import ModifierClient from "./pages/Admin/modifier_client";
import SupprimerClient from "./pages/Admin/supprimer_client";
import OptimisationPage from './pages/Valideur/optimiser_découpe';
import Accueil from "./components/Accueil";
import TypeArticles from "./components/Types_articles";
import Typebois from "./components/Types_bois";

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<Accueil />} />
        <Route path="/TypeArticles" element={<TypeArticles />} />
        <Route path="/TypeBois" element={<Typebois />} />
        <Route path="/inscription" element={<Incription />} />
        <Route path="/login" element={<Login />} />

        {/* Routes protégées */}

        <Route
          path="/Home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <Clients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client"
          element={
            <ProtectedRoute>
              <Client />
            </ProtectedRoute>
          }
        />
        <Route
          path="/articles"
          element={
            <ProtectedRoute>
              <Articles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/valideur"
          element={
            <ProtectedRoute>
              <Valideur />
            </ProtectedRoute>
          }
        />

        {/* Routes client */}
        <Route path="/lister_articles" element={<ListeArticles />} />
        <Route path="/ajout_article" element={<AjoutArticle />} />
        <Route path="/ajouter_mesure_client/:article_id" element={<AjoutMesure />} />
        <Route path="/supprimer_article_client/:article_id" element={<SupprimerArticleClient />} />
        <Route path="/modifier_article_client/:article_id" element={<ModifierArticle />} />
        <Route path="/supprimer_mesure_client/:article_id" element={<SupprimerMesure />} />
        <Route path="/modifier_mesure_client/:article_id" element={<ModifierMesure />} />
        <Route path="/convertir_txt/:article_id" element={<Convertirtxt />} />
        <Route path="/convertir_csv/:article_id" element={<Convertircsv />} />
        <Route path="/paiement/:article_id" element={<Paiement />} />

        {/* Routes admin */}
        <Route path="/modifier_client/:id" element={<ModifierClient />} />
        <Route path="/supprimer_client/:id" element={<SupprimerClient />} />

        {/* Route Valideur / Optimisation découpage */}
        <Route path="/optimiser_decoupage/:articleId" element={<OptimisationPage />} />
        <Route path="/HomeAdmin" element={<HomeAdmin />} />
      </Routes>
    </Router>
  );
}

export default App;