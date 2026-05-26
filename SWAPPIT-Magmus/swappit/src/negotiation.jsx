import React, { useState } from 'react';
import styles from '../style/negotiation.module.css';

const MOCK_NEGOTIATIONS = [
  { id: 1, product: 'iPhone 13', partner: 'Alice', status: 'pending', value: '300,000 FCFA' },
  { id: 2, product: 'Montre Seiko', partner: 'Bob', status: 'accepted', value: '45,000 FCFA' },
  { id: 3, product: 'Chaise Bureau', partner: 'Charlie', status: 'rejected', value: '12,000 FCFA' },
];

const NegotiationPage = () => {
  const [filter, setFilter] = useState('all');

  const filteredData = filter === 'all' 
    ? MOCK_NEGOTIATIONS 
    : MOCK_NEGOTIATIONS.filter(n => n.status === filter);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2>Centre de Négociation</h2>
        <div className={styles.tabs}>
          {['all', 'pending', 'accepted', 'rejected'].map(tab => (
            <button 
              key={tab} 
              className={filter === tab ? styles.activeTab : ''}
              onClick={() => setFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div className={styles.list}>
        {filteredData.map(nego => (
          <div key={nego.id} className={styles.card}>
            <div className={styles.cardInfo}>
              <h4>Échange pour : {nego.product}</h4>
              <p>Partenaire : <strong>{nego.partner}</strong> | Valeur : {nego.value}</p>
            </div>
            <div className={`${styles.badge} ${styles[nego.status]}`}>
              {nego.status.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NegotiationPage;
