// src/components/UploadForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [privacy, setPrivacy] = useState('');
  const [terms, setTerms] = useState('');
  const [loading, setLoading] = useState(false);
  const [branchUsed, setBranchUsed] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [view, setView] = useState('privacy');
  const [githubURL, setGithubURL] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPrivacy('');
    setTerms('');
  };

  const handleGithubSubmit = async (e) => {
    e.preventDefault();

    if (!githubURL) return alert("Please enter a GitHub repo URL");

    setLoading(true);
    setErrorMsg('');
    setBranchUsed('');
    setPrivacy('');
    setTerms('');
    try {
      const res = await axios.post("http://localhost:4000/github", {
        repoUrl: githubURL,
      });

      setPrivacy(res.data.privacy);
      setTerms(res.data.terms);
      setBranchUsed(res.data.branch || 'main or master');
    } catch (err) {
      console.error("GitHub import failed", err);
      setErrorMsg("🚫 GitHub import failed. Please check the repo URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const content = view === 'privacy' ? privacy : terms;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${view}.txt`;
    a.click();
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📄 Privacy Policy Generator</h1>

      <form onSubmit={handleGithubSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          className="border px-3 py-2 rounded w-full"
          placeholder="Paste GitHub repo URL"
          value={githubURL}
          onChange={(e) => setGithubURL(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Import
        </button>
      </form>

      {loading && <p className="mt-4 text-gray-600">⏳ Importing from GitHub...</p>}
      {branchUsed && <p className="mt-2 text-green-600">✅ Branch used: {branchUsed}</p>}
      {errorMsg && <p className="mt-2 text-red-600">{errorMsg}</p>}

      {(privacy || terms) && (
        <>
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setView('privacy')}
              className={`px-4 py-2 rounded ${view === 'privacy' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
            >
              🛡️ Privacy Policy
            </button>
            <button
              onClick={() => setView('terms')}
              className={`px-4 py-2 rounded ${view === 'terms' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
            >
              📜 Terms of Use
            </button>
            <button
              onClick={handleDownload}
              className="ml-auto bg-green-600 text-white px-4 py-2 rounded"
            >
              ⬇ Download as .txt
            </button>
          </div>

          <pre className="bg-gray-100 p-4 mt-4 whitespace-pre-wrap text-sm text-left">
            {view === 'privacy' ? privacy : terms}
          </pre>
        </>
      )}
    </div>
  );
};

export default UploadForm;
