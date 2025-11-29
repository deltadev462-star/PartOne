import { SearchIcon, PanelLeft, X, PanelRight } from 'lucide-react'
import { UserButton } from '@clerk/clerk-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '../features/themeSlice'
import { MoonIcon, SunIcon } from 'lucide-react'
import LangSwitcher from './LangSwitcher'
import { useTranslation } from 'react-i18next'

const Navbar = ({ setIsSidebarOpen, isSidebarOpen }) => {

    const dispatch = useDispatch();
    const { theme } = useSelector(state => state.theme);
    const { t } = useTranslation();

    return (
        <div className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-3 sm:px-6 xl:px-16 py-2 sm:py-3 flex-shrink-0">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
                {/* Left section */}
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    {/* Sidebar Trigger for Mobile */}
                    <button onClick={() => setIsSidebarOpen((prev) => !prev)} className="sm:hidden p-1.5 rounded-lg transition-colors text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800" >
                        <PanelLeft
                            size={18}
                            className="cursor-pointer"
                        />
                    </button>

                    {/* Sidebar Trigger for Desktop (md and lg screens) */}
                    <button onClick={() => setIsSidebarOpen((prev) => !prev)} className="hidden sm:block p-2 rounded-lg transition-colors text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800" >
                        {isSidebarOpen ? (
                            <PanelRight
                                size={20}
                                className="cursor-pointer"
                            />
                        ) : (
                            <PanelLeft
                                size={20}
                                className="cursor-pointer"
                            />
                        )}
                    </button>

                    {/* Search Input - Hidden on mobile, visible on sm+ */}
                    <div className="relative flex-1 max-w-sm hidden sm:block">
                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-400 size-3.5" />
                        <input
                            type="text"
                            placeholder={t("navbar.searchPlaceholder")}
                            className="pl-8 pr-4 py-2 w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                    </div>
                </div>

                {/* Right section - Smaller on mobile */}
                <div className="flex items-center gap-1 sm:gap-3">
                    <LangSwitcher/>
                    {/* Theme Toggle */}
                    <button onClick={() => dispatch(toggleTheme())} className="size-7 sm:size-8 flex items-center justify-center bg-white dark:bg-zinc-800 shadow rounded-lg transition hover:scale-105 active:scale-95">
                        {
                            theme === "light"
                                ? (<MoonIcon className="size-3.5 sm:size-4 text-gray-800 dark:text-gray-200" />)
                                : (<SunIcon className="size-3.5 sm:size-4 text-yellow-400" />)
                        }
                    </button>

                    {/* User Button */}
                    <UserButton />
                </div>
            </div>
        </div>
    )
}

export default Navbar
