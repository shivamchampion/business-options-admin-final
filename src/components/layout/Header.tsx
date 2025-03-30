import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  Menu as MenuIcon,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  isScrolled?: boolean;
}

export default function Header({ toggleSidebar, isSidebarOpen, isScrolled = false }: HeaderProps) {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className={`bg-white z-20 transition-all duration-300 ${isScrolled ? 'shadow-md' : 'border-b border-gray-200'
      }`}>
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center">
          {/* Mobile menu toggle */}
          <button
            type="button"
            className="lg:hidden text-gray-700 p-2 rounded-md hover:bg-gray-100 transition-colors duration-200 
              focus:outline-none focus:ring-2 focus:ring-[#0031ac] focus:ring-offset-2"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <MenuIcon className="h-5 w-5 text-gray-600" />
          </button>

          {/* Logo when sidebar is collapsed - only on desktop */}
          <div className={`items-center ml-2 ${isSidebarOpen ? 'hidden lg:hidden' : 'flex'}`}>
            <img src="/logo.svg" alt="Business Options" className="h-8 w-auto mr-3" />
            <span className="font-semibold text-gray-800 text-lg whitespace-nowrap">
              Business Options Admin Panel
            </span>
          </div>

          {/* Page title when sidebar is open */}
          <div className={`font-semibold text-gray-800 text-lg ml-2 lg:ml-0 ${!isSidebarOpen ? 'hidden' : 'block'}`}>
            Business Options Admin Panel
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Notification Bell */}
          <div className="relative">
            <Menu as="div">
              <Menu.Button className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#0031ac] focus:ring-offset-2">
                <span className="sr-only">View notifications</span>
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-150"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                        4 new
                      </span>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    <div className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                      <div className="flex">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">New user registration</p>
                          <p className="text-xs text-gray-500 mt-1">User John Doe has registered as an Advisor</p>
                          <p className="text-xs text-gray-400 mt-1">10 minutes ago</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                      <div className="flex">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">System update</p>
                          <p className="text-xs text-gray-500 mt-1">The system will be updated tonight at 2 AM</p>
                          <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 border-t border-gray-100">
                    <button className="w-full text-center text-xs text-[#0031ac] hover:text-blue-700 font-medium p-2 hover:bg-blue-50 rounded-md transition-colors duration-150">
                      View all notifications
                    </button>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>

          {/* User Profile with Dropdown */}
          <Menu as="div" className="relative">
            <div>
              <Menu.Button className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-[#0031ac] focus:ring-offset-2 p-1 group">
                <div className="flex items-center">
                  <div className="relative">
                    <div className="h-8 w-8 rounded-full border-2 border-[#0031ac] overflow-hidden">
                      {user.profileImageUrl ? (<img
                        src={user.profileImageUrl}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />) : (<div className="h-full w-full rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>)}
                    </div>
                    <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-400 border border-white"></div>
                  </div>

                  <div className="ml-2 mr-1 hidden md:block">
                    <div className="text-sm font-medium text-gray-800">
                      {user?.name || 'Admin User'}
                    </div>
                    <div className="text-xs text-[#0031ac]">
                      {user?.role || 'admin'}
                    </div>
                  </div>
                </div>
              </Menu.Button>
            </div>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {user?.email || 'admin@example.com'}
                  </p>
                </div>
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                          } group flex items-center px-4 py-2 text-sm`}
                      >
                        <User className="mr-3 h-5 w-5 text-gray-500" aria-hidden="true" />
                        My Profile
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                          } group flex items-center px-4 py-2 text-sm`}
                      >
                        <Settings className="mr-3 h-5 w-5 text-gray-500" aria-hidden="true" />
                        Settings
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                          } group flex items-center px-4 py-2 text-sm`}
                      >
                        <HelpCircle className="mr-3 h-5 w-5 text-gray-500" aria-hidden="true" />
                        Help & Support
                      </a>
                    )}
                  </Menu.Item>
                </div>
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleSignOut}
                        className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                          } group flex w-full items-center px-4 py-2 text-sm`}
                      >
                        <LogOut className="mr-3 h-5 w-5 text-red-500" aria-hidden="true" />
                        Sign Out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
}