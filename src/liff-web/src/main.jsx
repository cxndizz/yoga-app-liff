import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import './i18n'; // Initialize i18next
import { AutoTranslateProvider } from './lib/autoTranslate';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AutoTranslateProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AutoTranslateProvider>
  </React.StrictMode>,
);
