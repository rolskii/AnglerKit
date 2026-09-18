import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Fade out the static launch splash once React has taken over the page.
requestAnimationFrame(() => requestAnimationFrame(() => {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.classList.add('splash-hide');
    setTimeout(() => splash.remove(), 400);
  }
}))