// detectors/analyzeCode.js
const fs = require('fs-extra');
const path = require('path');

async function analyzeCodebase(basePath) {
  const results = {
    usesCookies: false,
    usesLocalStorage: false,
    usesGA: false,
    usesFirebase: false,
    usesStripe: false,
    usesAuth: false,
    usesGoogleOAuth: false,
    usesAuth0: false,
    usesMongoDB: false,
    usesSupabase: false,
    usesAnalyticsTools: false,
    usesBehaviorTracking: false,
    usesFileUploads: false,
    usesGeoLocation: false,
  };

  async function walk(dir) {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        await walk(fullPath);
      } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.jsx')) {
        const content = await fs.readFile(fullPath, 'utf-8');

        // Existing detectors
        if (/document\.cookie|setCookie/.test(content)) results.usesCookies = true;
        if (/localStorage|sessionStorage/.test(content)) results.usesLocalStorage = true;
        if (/gtag\(|GoogleAnalyticsObject/.test(content)) results.usesGA = true;
        if (/firebase/i.test(content)) results.usesFirebase = true;
        if (/stripe/i.test(content)) results.usesStripe = true;
        if (/email.*password|login|auth/i.test(content)) results.usesAuth = true;

        // NEW detectors
        if (/passport-google|googleapis|google-auth-library/.test(content)) results.usesGoogleOAuth = true;
        if (/auth0|@auth0\/|auth0\.js/.test(content)) results.usesAuth0 = true;
        if (/mongoose|mongodb|MongoClient/.test(content)) results.usesMongoDB = true;
        if (/supabase|@supabase\//.test(content)) results.usesSupabase = true;
        if (/mixpanel|analytics\.js|segment\.io/.test(content)) results.usesAnalyticsTools = true;
        if (/hotjar|fullstory|smartlook/.test(content)) results.usesBehaviorTracking = true;
        if (/formData\.append|multer|upload\.single/.test(content)) results.usesFileUploads = true;
        if (/navigator\.geolocation|getCurrentPosition/.test(content)) results.usesGeoLocation = true;
      }
    }
  }

  await walk(basePath);
  return results;
}

module.exports = { analyzeCodebase };
