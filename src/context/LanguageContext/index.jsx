import {createContext, useContext, useState, useEffect} from 'react';
import i18n from "../../locales/i18n.js";

const LanguageContext = createContext();

export const LanguageProvider = ({children}) => {
    const [language, setLanguage] = useState('az');

    useEffect(() => {
        const savedLang = localStorage.getItem('lang');
        const defaultLang = savedLang || 'az';
        setLanguage(defaultLang);
        i18n.changeLanguage(defaultLang);
        document.documentElement.lang = defaultLang;
    }, []);

    const changeLanguage = (lang) => {
        setLanguage(lang);
        i18n.changeLanguage(lang);
        localStorage.setItem('lang', lang);
        // Ekran oxuyucular və axtarış sistemləri üçün səhifənin dili
        document.documentElement.lang = lang;
    };

    return (
        <LanguageContext.Provider value={{language, changeLanguage}}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
