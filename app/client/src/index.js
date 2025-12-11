/**
 * Main application entry point
 * Renders the React application into the DOM
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Get the root element from the DOM
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the application
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
