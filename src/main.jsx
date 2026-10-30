import {createRoot} from 'react-dom/client'
import './styles/main.scss'
import './index.scss'
import App from './App.jsx'
import {Provider} from "react-redux";
import {store} from "./services/store.jsx";
import {ThemeProvider} from "./context/ThemeContext/index.jsx";
import {LanguageProvider} from "./context/LanguageContext/index.jsx";

// Deploy köhnə JS fayllarını silir: deploy-dan əvvəl açılmış tabda lazy səhifə (məs. blog redaktoru)
// köhnə chunk-ı istəyir və React xəta ekranı çıxır. Belə halda səhifə bir dəfə yenilənir və yeni versiya yüklənir.
// sessionStorage qoruyucusu sonsuz yenilənmənin qarşısını alır (chunk həqiqətən yoxdursa xəta göstərilir).
const RELOAD_KEY = "chunk-reload-at"
window.addEventListener("vite:preloadError", (event) => {
    let last = 0
    try { last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0 } catch { /* əlçatan deyil */ }
    if (Date.now() - last < 10000) return
    try { sessionStorage.setItem(RELOAD_KEY, String(Date.now())) } catch { /* əlçatan deyil */ }
    event.preventDefault()
    window.location.reload()
})

createRoot(document.getElementById('root')).render(
    <ThemeProvider>
        <LanguageProvider>
            <Provider store={store}>
                <App/>
            </Provider>
        </LanguageProvider>
    </ThemeProvider>
)