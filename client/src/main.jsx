import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initMetaPixel } from './utils/metaPixel'

const pixelId = import.meta.env.VITE_META_PIXEL_ID;
if (pixelId) {
  initMetaPixel(pixelId);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
