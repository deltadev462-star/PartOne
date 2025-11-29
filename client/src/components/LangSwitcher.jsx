import { useState, useEffect } from "react";
import { Languages } from "lucide-react";
import i18n from "i18next";

export default function LangSwitcher() {
  const [open, setOpen] = useState(false);
  const toggleDropdown = () => setOpen(!open);

 
  useEffect(() => {
    const savedDir = localStorage.getItem("documentDir");
    const savedLang = localStorage.getItem("i18nextLng");
    
    if (savedDir) {
      document.documentElement.dir = savedDir;
      document.documentElement.lang = savedLang || "en";
    } else {
   
      const defaultLang = i18n.language || "en";
      const defaultDir = defaultLang === "ar" ? "rtl" : "ltr";
      document.documentElement.dir = defaultDir;
      document.documentElement.lang = defaultLang;
    }
  }, []);

  const handleChangeLang = (newLang) => {
  
    i18n.changeLanguage(newLang);
    
     
    const newDir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = newDir;
    document.documentElement.lang = newLang;
    
    
    document.body.classList.remove("rtl", "ltr");
    document.body.classList.add(newDir);
     
    localStorage.setItem("documentDir", newDir);
    localStorage.setItem("i18nextLng", newLang);
   
    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={toggleDropdown}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800   transition bg-white dark:bg-zinc-800 shadow rounded-lg   hover:scale-105 active:scale-95"
      >
        <Languages className="w-5 h-5   " />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-32 overflow-hidden bg-white dark:bg-[#101010] border border-gray-200 dark:border-gray-800 rounded-md shadow-lg z-20">
          <button
            onClick={() => handleChangeLang("en")}
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
          >
            <img src="/fl (2).png" alt="English" className="w-5 h-4" />
            <span>English</span>
          </button>

          <button
            onClick={() => handleChangeLang("ar")}
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
          >
            <img src="/fl (1).png" alt="العربية" className="w-5 h-4" />
            <span>العربية</span>
          </button>
        </div>
      )}
    </div>
  );
}