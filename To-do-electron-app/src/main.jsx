import './main.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx';
import './styles/globals.css';

// Set dark theme immediately to prevent flash
document.documentElement.classList.add('dark');
document.documentElement.style.colorScheme = 'dark';

ReactDOM.createRoot(document.getElementById("app")).render(<App />);