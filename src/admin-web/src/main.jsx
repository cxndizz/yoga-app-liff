import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AdminAuthProvider } from './auth/AdminAuthContext';
import { SocketProvider } from './contexts/SocketContext';
import './styles/admin-theme.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/admin">
      <AdminAuthProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);