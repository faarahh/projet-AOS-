import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'

// No StrictMode — it double-invokes useEffect in dev causing logout loops
createRoot(document.getElementById('root')).render(<App />)
