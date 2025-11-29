import { useEffect, useRef } from 'react'
import WorkspaceDropdown from './WorkspaceDropdown'
import {
  FolderOpenIcon,
  LayoutDashboardIcon,
  CalendarDaysIcon,
  UsersRoundIcon,
  FileTextIcon,
  CheckSquareIcon,
  BarChart2Icon,
  MoonIcon,
  SunIcon,
  SettingsIcon,
  UsersIcon,
  CreditCardIcon,
  ShieldIcon
} from 'lucide-react'

import MyTasksSidebar from './MyTasksSidebar'
import ProjectSidebar from './ProjectsSidebar'
import { NavLink } from 'react-router-dom'
import { useClerk } from '@clerk/clerk-react'
import { useTranslation } from 'react-i18next'

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {

    const { openUserProfile } = useClerk()
    const { t } = useTranslation()
 
    const menuItems = [
      { name: t('navigation.dashboard'), href: '/', icon: LayoutDashboardIcon },
      { name: t('navigation.projects'), href: '/projects', icon: FolderOpenIcon },
      { name: t('navigation.meetings'), href: '/meetings', icon: CalendarDaysIcon },
      { name: t('navigation.stakeholders'), href: '/stakeholders', icon: UsersRoundIcon },
      { name: t('navigation.requirements'), href: '/requirements', icon: FileTextIcon },
      { name: t('navigation.riskManagement'), href: '/risk-management', icon: ShieldIcon },
      { name: t('navigation.tasks'), href: '/tasks', icon: CheckSquareIcon },
      { name: t('navigation.myTasks'), href: '/my-tasks', icon: CheckSquareIcon },
      { name: t('navigation.team'), href: '/team', icon: UsersIcon },
      { name: t('navigation.reports'), href: '/reports', icon: BarChart2Icon },
      { name: t('navigation.pricing'), href: '/pricing', icon: CreditCardIcon },
    ]
 
    const sidebarRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            // Only close sidebar on click outside for mobile screens (< 640px)
            const isMobile = window.innerWidth < 640;
            if (isMobile && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsSidebarOpen(false);
            }
        }
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setIsSidebarOpen]);

    return (
        <div ref={sidebarRef} className={`z-10 bg-white dark:bg-zinc-900 min-w-68 flex flex-col h-screen border-e border-gray-200 dark:border-zinc-800 max-sm:absolute md:relative transition-all ${isSidebarOpen ? 'start-0 md:block' : '-start-full md:hidden'} `} >
            <WorkspaceDropdown />
            <hr className='border-gray-200 dark:border-zinc-800' />
            <div className='flex-1 overflow-y-scroll no-scrollbar flex flex-col'>
                <div>
                    <div className='p-4'>
                        {menuItems.map((item) => (
                            <NavLink to={item.href} key={item.name} className={({ isActive }) => `flex items-center gap-3 py-2 px-4 text-gray-800 dark:text-zinc-100 cursor-pointer rounded transition-all  ${isActive ? 'bg-gray-100 dark:bg-zinc-900 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-800/50  dark:ring-zinc-800' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/60'}`} >
                                <item.icon size={16} />
                                <p className='text-sm truncate'>{item.name}</p>
                            </NavLink>
                        ))}
                        <button onClick={openUserProfile} className='flex w-full items-center gap-3 py-2 px-4 text-gray-800 dark:text-zinc-100 cursor-pointer rounded hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-all'>
                            <SettingsIcon size={16} />
                            <p className='text-sm truncate'>{t('navigation.settings')}</p>
                        </button>
                    </div>
                    <MyTasksSidebar />
                    <ProjectSidebar />
                </div>


            </div>

        </div>
    )
}

export default Sidebar
