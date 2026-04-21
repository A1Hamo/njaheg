// src/config/firebase.js
const admin  = require('firebase-admin');
const logger = require('../utils/logger');

function initFirebase() {
  // Skip Firebase if private key is missing (development without file upload)
  if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_PROJECT_ID) {
    logger.warn('⚠️  Firebase skipped - FIREBASE_PRIVATE_KEY or PROJECT_ID not configured');
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:    process.env.FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      privateKey:   process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail:  process.env.FIREBASE_CLIENT_EMAIL,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
  logger.info('✅ Firebase initialized');
}

async function uploadToFirebase(buffer, destPath, mimeType) {
  const saveLocally = () => {
    const fs = require('fs');
    const path = require('path');
    const filename = destPath.split('/').pop();
    const localDir = path.join(__dirname, '../../public/uploads');
    fs.mkdirSync(localDir, { recursive: true });
    fs.writeFileSync(path.join(localDir, filename), buffer);
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL || 'http://localhost:5000' 
      : 'http://localhost:5000';
    return `${baseUrl}/uploads/${filename}`;
  };

  if (!admin.apps.length) {
    logger.warn('Firebase not initialized, saving to local disk instead.');
    return saveLocally();
  }

  try {
    const file = admin.storage().bucket().file(destPath);
    await file.save(buffer, { metadata: { contentType: mimeType }, resumable: false });
    await file.makePublic();
    return `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${destPath}`;
  } catch (err) {
    logger.warn(`Firebase upload failed (${err.message}), saving to local disk instead.`);
    return saveLocally();
  }
}

async function deleteFromFirebase(destPath) {
  if (!admin.apps.length) {
    logger.warn('Firebase not initialized, skipping file deletion from Firebase.');
    return;
  }
  try {
    await admin.storage().bucket().file(destPath).delete({ ignoreNotFound: true });
  } catch (err) {
    logger.warn(`Failed to delete from Firebase: ${err.message}`);
  }
}

module.exports = { initFirebase, uploadToFirebase, deleteFromFirebase };
