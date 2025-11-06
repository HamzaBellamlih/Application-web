import React from "react";
import { motion } from "framer-motion";
import "./css/Saas.css";

export default function SaaSHome() {
  return (
    <div className="saas-container">
      <motion.header
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="header"
      >
        <h1 className="logo">🌐 WoodManage SaaS</h1>
        <nav>
          <a href="#features">Fonctionnalités</a>
          <a href="#pricing">Tarifs</a>
          <a href="#contact">Contact</a>
        </nav>
      </motion.header>

      <main className="main">
        <motion.div
          className="hero-text"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
        >
          <h2>
            Gérez votre entreprise <span>plus intelligemment</span>.
          </h2>
          <p>
            Une solution SaaS tout-en-un pour gérer vos clients, vos articles et vos ventes — 
            simple, rapide et sécurisée.
          </p>
          <div className="btn-group">
            <button className="btn-primary">Démarrer gratuitement</button>
            <button className="btn-secondary">Voir la démo</button>
          </div>
        </motion.div>

        <motion.img
          src="https://cdn.dribbble.com/users/1144876/screenshots/15425756/media/bfc83a53e76469f3e12f388a1a53df93.png"
          alt="SaaS Dashboard"
          className="hero-image"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4 }}
        />
      </main>

      <motion.section
        id="features"
        className="features"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <h3>🚀 Fonctionnalités clés</h3>
        <div className="features-grid">
          <div className="feature-card">📊 Tableau de bord intuitif</div>
          <div className="feature-card">🧮 Gestion automatique des stocks</div>
          <div className="feature-card">🔒 Sécurité et sauvegarde cloud</div>
          <div className="feature-card">⚡ Optimisation en temps réel</div>
        </div>
      </motion.section>

      <footer>
        <p>© 2025 WoodManage SaaS — Tous droits réservés.</p>
      </footer>
    </div>
  );
}