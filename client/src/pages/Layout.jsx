import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { CreateOrganization, SignIn, useAuth, useUser } from '@clerk/clerk-react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchWorkspaces } from '../features/workspaceSlice'
import { loadTheme } from '../features/themeSlice'
import { Loader2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true) // Default to true for desktop
    const { user, isLoaded } = useUser()
    const { workspaces, loading } = useSelector((state) => state.workspace)
    const { getToken } = useAuth()
    const dispatch = useDispatch()
    const { i18n } = useTranslation()

    // Initial load of theme and set document direction based on language
    useEffect(() => {
        dispatch(loadTheme())
        
        // Set RTL/LTR based on current language
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
    }, [])

    // Update document direction when language changes
    useEffect(() => {
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
    }, [i18n.language])

    // Initial load of workspaces
    useEffect(() => {
        if (isLoaded && user && workspaces.length === 0) {
            dispatch(fetchWorkspaces({ getToken }))
        }
    }, [user, isLoaded])

    if (!user) {
        return (
            <div className="flex justify-center items-center h-screen bg-white dark:bg-zinc-950">
                <SignIn />
            </div>
        )
    }

    if (loading) return (
        <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
            <Loader2Icon className="size-7 text-blue-500 animate-spin" />
        </div>
    )

    if (user && workspaces.length === 0) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <CreateOrganization />
            </div>
        )
    }

    return (
        <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col h-screen">
                <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default Layout
