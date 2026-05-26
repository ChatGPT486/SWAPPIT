import React, { useState } from 'react';
import styles from '../style/profile.module.css';

const ProfilePage = () => {
  const [userData, setUserData] = useState({
    username: 'John Doe',
    email: 'john@example.com',
    bio: 'Avid trader looking for quality items.',
    phone: '+237 6XX XXX XXX', // Donnée privée
    address: 'Yaoundé, Cameroun' // Donnée privée
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // Ici, tu appelleras ton endpoint Django (ex: /api/profile/update/)
    console.log("Envoi des données vers Django:", userData);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Mon Espace</h1>
        <p>Gérez vos informations personnelles et sécurisées.</p>
      </div>

      <div className={styles.grid}>
        {/* Section Photo & Info Publique */}
        <div className={styles.card}>
          <h3>Profil Public</h3>
          <div className={styles.avatarSection}>
            <div className={styles.avatarPlaceholder}>JD</div>
            <button className={styles.secondaryBtn}>Changer la photo</button>
          </div>
          
          <div className={styles.formGroup}>
            <label>Nom complet</label>
            <input name="username" value={userData.username} onChange={handleInputChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Bio</label>
            <textarea name="bio" value={userData.bio} onChange={handleInputChange} rows="4" />
          </div>
        </div>

        {/* Section Données Privées */}
        <div className={styles.card}>
          <h3 className={styles.privateTitle}>🔒 Informations Privées</h3>
          <p className={styles.hint}>Ces informations ne seront jamais visibles par les autres utilisateurs.</p>
          
          <div className={styles.formGroup}>
            <label>Email de contact</label>
            <input type="email" name="email" value={userData.email} onChange={handleInputChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Numéro de téléphone</label>
            <input type="text" name="phone" value={userData.phone} onChange={handleInputChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Adresse de livraison</label>
            <input type="text" name="address" value={userData.address} onChange={handleInputChange} />
          </div>
        </div>
      </div>

      <button className={styles.primaryBtn} onClick={handleSave}>Enregistrer les modifications</button>
    </div>
  );
};

export default ProfilePage;
