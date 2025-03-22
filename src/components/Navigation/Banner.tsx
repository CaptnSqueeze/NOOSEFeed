import React from 'react';
import BurgerButton from './BurgerButton.tsx';
const logo = "/logo2.png";

interface BannerProps {
    toggleSidebar: () => void;
    isSidebarOpen: boolean;
}

const Banner: React.FC<BannerProps> = ({ toggleSidebar, isSidebarOpen }) => {
    return (
        <div className="fixed top-0 left-0 right-0 bg-blue-900 text-white p-2.5 flex z-50">
            <div className="flex items-center w-full justify-between">
                {/* Burger button on mobile, Logo on desktop */}
                <div className="flex items-center">
                    <div className="md:hidden">
                        <BurgerButton isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                    </div>
                    <img src={logo} alt="Logo" className="hidden md:block h-11 md:h-14 scale-[1.4]" />
                </div>

                {/* Text - right on mobile, left on desktop */}
                <div className="flex flex-col text-right md:text-left flex-grow px-0 md:px-1 md:ml-0">
                    <h1 className="text-lg md:text-2xl font-bold">NOOSEFeed</h1>
                    <h2 className="text-xs md:text-sm font-bold">no paywalls, no algorithms... just news</h2>
                </div>

                {/* Logo on mobile, Burger on desktop */}
                <div className="flex items-center">
                    <img src={logo} alt="Logo" className="md:hidden h-11 ml-1 scale-[1.4]" />
                    <div className="hidden md:block">
                        <BurgerButton isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Banner;