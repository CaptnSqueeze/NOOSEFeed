import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, InformationCircleIcon, NewspaperIcon } from '@heroicons/react/24/solid';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
    return (
        <>
            {/* Sidebar content */}
            <div className="fixed top-28 left-0 bottom-0 h-full w-64 text-white z-20">
                <nav className="flex flex-col h-full">
                    <ul className="space-y-2 p-4 flex-grow">
                        <li>
                            <Link to="/" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-800 text-white" onClick={toggleSidebar}>
                                <HomeIcon className="h-5 w-5" />
                                <span>Home</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/about" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-800 text-white" onClick={toggleSidebar}>
                                <InformationCircleIcon className="h-5 w-5" />
                                <span>About</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/sources" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-800 text-white" onClick={toggleSidebar}>
                                <NewspaperIcon className="h-5 w-5" />
                                <span>News Sources</span>
                            </Link>
                        </li>
                    </ul>
                    {/* Fill the bottom of the sidebar */}
                    <div className="flex-grow"></div>
                </nav>
            </div>
        </>
    );
};

export default Sidebar;
