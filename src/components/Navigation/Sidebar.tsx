import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, InformationCircleIcon, NewspaperIcon } from '@heroicons/react/24/solid';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
    return (
        <div className="text-white h-full w-64 fixed">
            <nav className="flex-col h-full w-full">
                <ul className="space-y-2 p-4 flex-grow">
                    <li>
                        <Link to="/" onClick={toggleSidebar}>
                            <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-800 pr-4 w-full">
                                <HomeIcon className="h-5 w-5" />
                                <span>Home</span>
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link to="/about" onClick={toggleSidebar}>
                            <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-800 pr-4 w-full">
                                <InformationCircleIcon className="h-5 w-5" />
                                <span>About</span>
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link to="/sources" onClick={toggleSidebar}>
                            <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-800 pr-4 w-full">
                                <NewspaperIcon className="h-5 w-5" />
                                <span>News Sources</span>
                            </div>
                        </Link>
                    </li>
                </ul>
                <div className="flex-grow"></div>
            </nav>
        </div>
    );
};


export default Sidebar;