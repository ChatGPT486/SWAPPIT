import React, { useState } from 'react';
import styles from '../style/recommendation.module.css';

const RecommendationPage = () => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Données de recommandation envoyées vers Django:", { rating, comment });
    // Ici, appel API POST vers /api/reviews/
  };

  return (
    <div className={styles.container}>
      <header>
        <h2>Recommander un partenaire</h2>
        <p>Votre expérience aide la communauté Squad 16 à grandir.</p>
      </header>

      <div className={styles.card}>
        <div className={styles.profileSummary}>
          <div className={styles.avatar}>A</div>
          <div>
            <h3>Alice Dupont</h3>
            <span className={styles.badge}>Échange réussi : iPhone 13</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.ratingSection}>
            <label>Note globale :</label>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span 
                  key={star} 
                  className={star <= rating ? styles.active : ''}
                  onClick={() => setRating(star)}
                >★</span>
              ))}
            </div>
          </div>

          <textarea 
            placeholder="Partagez votre expérience (ex: ponctualité, état du produit...)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          
          <button type="submit" className={styles.btnPrimary}>Publier la recommandation</button>
        </form>
      </div>
    </div>
  );
};

export default RecommendationPage;
