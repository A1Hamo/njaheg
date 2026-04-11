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
  if (!admin.apps.length) {
    throw new Error('Firebase not initialized - configure FIREBASE_PRIVATE_KEY and FIREBASE_PROJECT_ID');
  }
  try {
    const file = admin.storage().bucket().file(destPath);
    await file.save(buffer, { metadata: { contentType: mimeType }, resumable: false });
    await file.makePublic();
    return `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${destPath}`;
  } catch (err) {
    logger.warn('Mocking Firebase upload, saving to local disk instead: ' + err.message);
    const fs = require('fs');
    const path = require('path');
    const filename = destPath.split('/').pop();
    const localDir = path.join(__dirname, '../../public/uploads');
    fs.mkdirSync(localDir, { recursive: true });
    fs.writeFileSync(path.join(localDir, filename), buffer);
    return `http://localhost:5000/uploads/${filename}`; // Return real local URL
  }
}

async function deleteFromFirebase(destPath) {
  if (!admin.apps.length) {
    logger.warn('Firebase not initialized, skipping file deletion');
    return;
  }
  await admin.storage().bucket().file(destPath).delete({ ignoreNotFound: true });
}

module.exports = { initFirebase, uploadToFirebase, deleteFromFirebase };
