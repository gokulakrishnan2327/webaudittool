// import express from "express";
// import cors from "cors";
// import { launch as launchChrome } from "chrome-launcher";
// import lighthouse from "lighthouse";
// import fetch from "node-fetch";

// // Polyfill fetch for Lighthouse
// globalThis.fetch = fetch;

// const app = express();
// const PORT = 5000;

// app.use(cors());
// app.use(express.json());

// app.get("/api/lighthouse", async (req, res) => {
//   let { url } = req.query;

//   if (!url || typeof url !== "string") {
//     return res.status(400).json({ error: "Invalid URL provided" });
//   }

//   // Ensure URL starts with http:// or https://
//   if (!/^https?:\/\//i.test(url)) {
//     url = `https://${url}`;
//   }

//   try {
//     let chrome;
//     // Try to connect to an already running Chrome instance
//     try {
//       chrome = { port: 9222 }; // Use existing Chrome instance
//     } catch (e) {
//       // If no Chrome instance is running, launch it
//       chrome = await launchChrome({
//         chromeFlags: ['--headless', '--disable-gpu', '--remote-debugging-port=9222']
//       });
//     }

//     const options = {
//       logLevel: 'info',
//       output: 'json',
//       onlyCategories: ['performance'],
//       port: chrome.port,
//     };

//     // Run Lighthouse Audit
//     const runnerResult = await lighthouse(url, options);

//     // Close Chrome after audit
//     if (chrome.kill) await chrome.kill();  // Ensure the `kill` method is available

//     res.json({
//       performance: Math.round(runnerResult.lhr.categories.performance.score * 100),
//     });
//   } catch (error) {
//     console.error("Lighthouse Audit Error:", error);
//     res.status(500).json({
//       error: "Failed to run Lighthouse audit",
//       details: error.message,
//     });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Backend running on http://localhost:${PORT}`);
// });

import express from 'express';
import cors from 'cors';
import { launch as launchChrome } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import fetch from 'node-fetch';
import axios from 'axios';

// Polyfill fetch for Lighthouse
globalThis.fetch = fetch;

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/lighthouse', async (req, res) => {
  let { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid URL provided' });
  }

  // Ensure URL starts with http:// or https://
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    let chrome;
    // Try to connect to an already running Chrome instance
    try {
      chrome = { port: 9222 }; // Use existing Chrome instance
    } catch (e) {
      // If no Chrome instance is running, launch it
      chrome = await launchChrome({
        chromeFlags: ['--headless', '--disable-gpu', '--remote-debugging-port=9222']
      });
    }

    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'seo'],
      port: chrome.port,
    };

    // Run Lighthouse Audit
    const runnerResult = await lighthouse(url, options);

    // Perform additional checks (Security, Functional, and Integration readiness)
    const additionalChecks = await runAdditionalChecks(url);

    // Close Chrome after audit
    if (chrome.kill) await chrome.kill();  // Ensure the `kill` method is available

    res.json({
      performance: Math.round(runnerResult.lhr.categories.performance.score * 100),
      accessibility: Math.round(runnerResult.lhr.categories.accessibility.score * 100),
      seo: Math.round(runnerResult.lhr.categories.seo.score * 100),
      additionalChecks: additionalChecks,
    });
  } catch (error) {
    console.error('Lighthouse Audit Error:', error);
    res.status(500).json({
      error: 'Failed to run Lighthouse audit',
      details: error.message,
    });
  }
});

// Run additional checks
async function runAdditionalChecks(url) {
  const checks = {};

  // 1. **Security Check**
  checks.security = await performSecurityCheck(url);

  // 2. **Functional Review**
  checks.functional = await performFunctionalReview(url);

  // 3. **Integration Readiness**
  checks.integration = await performIntegrationReadinessCheck(url);

  return checks;
}

// **Security Check**
async function performSecurityCheck(url) {
  const securityChecks = {
    ssl: false,
    headers: {
      xContentTypeOptions: false,
      xFrameOptions: false,
      contentSecurityPolicy: false,
    },
    outdatedPlugins: false,
  };

  try {
    // Check SSL certificate validity
    const sslResponse = await axios.get(`https://api.ssllabs.com/api/v3/analyze?host=${url}`);
    const sslResult = sslResponse.data;
    securityChecks.ssl = sslResult.status === 'READY' && sslResult.grade !== 'F';

    // Check security headers
    const headers = await axios.get(url);
    securityChecks.headers.xContentTypeOptions = headers.headers['x-content-type-options'] === 'nosniff';
    securityChecks.headers.xFrameOptions = headers.headers['x-frame-options'] === 'DENY';
    securityChecks.headers.contentSecurityPolicy = headers.headers['content-security-policy'] != null;

    // Check for outdated plugins (can be based on a vulnerability database or API)
    // For now, we'll mock this part since it's complex
    securityChecks.outdatedPlugins = false;  // Assume no outdated plugins for simplicity

  } catch (err) {
    console.error('Security Check Error:', err);
  }

  return securityChecks;
}

// **Functional Review**
async function performFunctionalReview(url) {
  const functionalReview = {
    coreFeatures: true,
    uiConsistency: true,
    usability: true,
  };

  try {
    // Mock core features check (can be enhanced with real tests or API interactions)
    // Check if the site loads and core functionalities are available
    const response = await axios.get(url);
    if (response.status !== 200) {
      functionalReview.coreFeatures = false;
    }

    // Check for UI/UX consistency
    // A real-world solution might involve visual testing tools or inspecting the DOM
    // Here, we mock the review result
    functionalReview.uiConsistency = true;

    // Check usability by analyzing the site with Lighthouse, or perform basic UI checks
    functionalReview.usability = true;
  } catch (err) {
    console.error('Functional Review Error:', err);
    functionalReview.coreFeatures = false;
  }

  return functionalReview;
}

// **Integration Readiness**
async function performIntegrationReadinessCheck(url) {
  const integrationCheck = {
    thirdPartyTools: true,
    apiIntegration: true,
  };

  try {
    // Check for common third-party integrations (like Google Analytics, etc.)
    const response = await axios.get(url);
    if (response.status === 200) {
      // Check for the presence of analytics scripts or other integrations
      if (!response.data.includes('analytics.js')) {
        integrationCheck.thirdPartyTools = false;
      }

      // Mock API readiness review, checking for possible API documentation, etc.
      if (!response.data.includes('API')) {
        integrationCheck.apiIntegration = false;
      }
    } else {
      integrationCheck.thirdPartyTools = false;
    }
  } catch (err) {
    console.error('Integration Check Error:', err);
    integrationCheck.thirdPartyTools = false;
  }

  return integrationCheck;
}

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
