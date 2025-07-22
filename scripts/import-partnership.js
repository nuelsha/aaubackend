const mongoose = require('mongoose');
const Partnership = require('../../../../../OneDrive/Documents/Projects/GDG/RBA/src/models/Partnership');
const fs = require('fs');
require('dotenv').config();

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });


    const data = JSON.parse(fs.readFileSync('./data/sample_partnerships.json', 'utf-8'));
    await Partnership.insertMany(data);

  } catch (err) {
    console.error('Import failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();

  }
};

importData();