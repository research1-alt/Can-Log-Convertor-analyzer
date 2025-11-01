import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import * as pdfjsLib from 'pdfjs-dist';

// Configure the PDF.js worker.
// Using `?url` is a Vite-specific feature that provides the URL to the asset.
// This ensures the worker file is correctly located after the build process.
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
