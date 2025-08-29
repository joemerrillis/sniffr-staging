'use client';

import { useState } from 'react';
import { BellIcon, UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';

interface Tenant {
  name: string;
  logo?: string;
}

interface TopNavProps {
  tenant?: Tenant;
}

export function TopNav({ tenant }: TopNavProps) {
  const [notifications] = useState(3);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {tenant?.logo && (
            <img src={tenant.logo} alt={tenant.name} className="h-8 w-8" />
          )}
          <h1 className="text-xl font-semibold text-gray-900">
            {tenant?.name || 'Sniffr'}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700">
            <BellIcon className="h-6 w-6" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>

          {/* User Menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
              <UserCircleIcon className="h-8 w-8" />
              <ChevronDownIcon className="h-4 w-4" />
            </Menu.Button>
            
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="/profile"
                      className={`block px-4 py-2 text-sm ${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      Your Profile
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="/settings"
                      className={`block px-4 py-2 text-sm ${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      Settings
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="/logout"
                      className={`block px-4 py-2 text-sm ${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      Sign out
                    </a>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        </div>
      </div>
    </header>
  );
}