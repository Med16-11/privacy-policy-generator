// routes/github.js
const express = require('express');
const axios = require('axios');
const fs = require('fs-extra');
const unzipper = require('unzipper');
const path = require('path');
const { analyzeCodebase } = require('../detectors/analyzeCode');
const handlebars = require('handlebars');

const router = express.Router();

function getGitHubRepoInfo(url) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/);
  if (!match) return null;

  const [, user, repo, branch = null] = match;
  return { user, repo, branch };
}

async function tryDownloadZip(user, repo, branch, tmpZipPath) {
  const url = `https://github.com/${user}/${repo}/archive/refs/heads/${branch}.zip`;
  try {
    const writer = fs.createWriteStream(tmpZipPath);
    const response = await axios({ method: 'GET', url, responseType: 'stream' });

    await new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    return true; // success
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return false; // not found
    }
    throw err; // other error
  }
}

async function generateFromTemplate(templateName, data) {
  const templatePath = path.join(__dirname, '..', 'templates', templateName);
  const source = await fs.readFile(templatePath, 'utf-8');
  const template = handlebars.compile(source);
  return template(data);
}

router.post('/', async (req, res) => {
  console.log("📥 GitHub Import hit");
  console.log("Body:", req.body);
  
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) return res.status(400).json({ error: 'Missing GitHub URL' });

    const parsed = getGitHubRepoInfo(repoUrl);
    if (!parsed) return res.status(400).json({ error: 'Invalid GitHub URL format.' });

    const { user, repo, branch: givenBranch } = parsed;
    const timestamp = Date.now();
    const tmpZipPath = path.join(__dirname, '..', 'uploads', `${repo}-${timestamp}.zip`);
    const extractPath = tmpZipPath.replace('.zip', '_extracted');

    // Try downloading ZIP
    const branchList = givenBranch ? [givenBranch] : ['main', 'master'];
    let downloaded = false;

    for (const branch of branchList) {
      downloaded = await tryDownloadZip(user, repo, branch, tmpZipPath);
      if (downloaded) break;
    }

    if (!downloaded) {
      return res.status(404).json({ error: 'GitHub repo not found or branch invalid (main/master).' });
    }

    // Extract ZIP
    await fs.createReadStream(tmpZipPath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .promise();

    const [topLevelFolder] = await fs.readdir(extractPath);
    const projectPath = path.join(extractPath, topLevelFolder);

    const analysis = await analyzeCodebase(projectPath);
    const privacyText = await generateFromTemplate('privacy.hbs', analysis);
    const termsText = await generateFromTemplate('terms.hbs', analysis);

    await fs.remove(tmpZipPath);
    await fs.remove(extractPath);

    res.json({ privacy: privacyText, terms: termsText });
  } catch (err) {
    console.error('[GitHub Import Error]', err.message);
    res.status(500).json({ error: 'Failed to process GitHub repo.' });
  }
});

module.exports = router;
