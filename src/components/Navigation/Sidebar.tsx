import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomeIcon, InformationCircleIcon, NewspaperIcon } from '@heroicons/react/24/solid';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
    const navigate = useNavigate();

    const handleNavigation = (path: string) => {
        // Only toggle sidebar on mobile screens
        if (window.innerWidth < 768) { // 768px is the standard md breakpoint in Tailwind
            toggleSidebar();
        }
        setTimeout(() => navigate(path), 100);
    };

    return (
        <div className="text-white h-full w-64 fixed">
            <nav className="flex-col h-full w-full">
                <ul className="space-y-2 p-4 flex-grow">
                    <li>
                        <button onClick={() => handleNavigation("/")} className="w-full text-left hover:bg-gray-800 active:bg-gray-700">
                            <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-800 pr-4 w-full">
                                <HomeIcon className="h-5 w-5" />
                                <span>Home</span>
                            </div>
                        </button>
                    </li>
                    <li>
                        <button onClick={() => handleNavigation("/about")} className="w-full text-left hover:bg-gray-800 active:bg-gray-700">
                            <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-800 pr-4 w-full">
                                <InformationCircleIcon className="h-5 w-5" />
                                <span>About</span>
                            </div>
                        </button>
                    </li>
                    <li>
                        <button onClick={() => handleNavigation("/sources")} className="w-full text-left hover:bg-gray-800 active:bg-gray-700">
                            <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-800 pr-4 w-full">
                                <NewspaperIcon className="h-5 w-5" />
                                <span>News Sources</span>
                            </div>
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};


export default Sidebar;