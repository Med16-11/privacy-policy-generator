// routes/generate.js
const express = require('express');
const multer = require('multer');
const unzipper = require('unzipper');
const fs = require('fs-extra');
const path = require('path');
const { analyzeCodebase } = require('../detectors/analyzeCode');
const handlebars = require('handlebars');

const router = express.Router();

// Storage config
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('project'), async (req, res) => {
  try {
    const zipPath = req.file.path;
    const extractPath = path.join(__dirname, '..', 'uploads', req.file.filename + '_extracted');

    // Extract ZIP
    await fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .promise();

    // Analyze Code
    const analysis = await analyzeCodebase(extractPath);

    // Generate templates
    const privacyText = await generateFromTemplate('privacy.hbs', analysis);
    const termsText = await generateFromTemplate('terms.hbs', analysis);

    // Cleanup
    await fs.remove(zipPath);
    await fs.remove(extractPath);

    res.json({ privacy: privacyText, terms: termsText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

async function generateFromTemplate(templateName, data) {
  const templatePath = path.join(__dirname, '..', 'templates', templateName);
  const source = await fs.readFile(templatePath, 'utf-8');
  const template = handlebars.compile(source);
  return template(data);
}

module.exports = router;
