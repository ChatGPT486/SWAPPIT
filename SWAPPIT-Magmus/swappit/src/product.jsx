import React, { useState } from 'react';
import styles from '../style/product.module.css';

const ProductsPage = () => {
  const [product, setProduct] = useState({ name: '', description: '', value: '' });
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  
  // Simulation d'une valeur de marché (à remplacer par un appel API Django plus tard)
  const MARKET_RANGE = { min: 10000, max: 25000 };

  const handleValidation = (val) => {
    const numVal = parseFloat(val);
    if (!val) return;

    if (numVal < MARKET_RANGE.min) {
      setFeedback({ 
        message: `Valeur sous-évaluée. Le marché suggère une fourchette entre ${MARKET_RANGE.min} et ${MARKET_RANGE.max} FCFA.`, 
        type: 'warning' 
      });
    } else if (numVal > MARKET_RANGE.max) {
      setFeedback({ 
        message: `Valeur sur-évaluée. Ajustez vers la fourchette ${MARKET_RANGE.min} - ${MARKET_RANGE.max} FCFA pour plus de chances d'échange.`, 
        type: 'error' 
      });
    } else {
      setFeedback({ message: 'Valeur correcte.', type: 'success' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
    if (name === 'value') handleValidation(value);
  };

  return (
    <div className={styles.container}>
      <header>
        <h2>Ajouter un Produit</h2>
        <p>Proposez votre article pour le troc.</p>
      </header>

      <div className={styles.formSection}>
        <input name="name" placeholder="Nom du produit" onChange={handleInputChange} className={styles.input} />
        <textarea name="description" placeholder="Description détaillée..." onChange={handleInputChange} className={styles.textarea} />
        
        <div className={styles.priceContainer}>
          <input 
            type="number" 
            name="value" 
            placeholder="Valeur estimée (FCFA)" 
            onChange={handleInputChange} 
            className={styles.input} 
          />
          {feedback.message && (
            <div className={`${styles.feedback} ${styles[feedback.type]}`}>
              {feedback.message}
            </div>
          )}
        </div>
        
        <button className={styles.btnPrimary}>Publier au Catalogue</button>
      </div>

      <div className={styles.catalogue}>
        <h3>Votre Catalogue Actuel</h3>
        {/* Ici, tu mapperaras tes produits venant de Django */}
        <div className={styles.card}>Produit A - 15,000 FCFA</div>
      </div>
    </div>
  );
};

export default ProductsPage;
