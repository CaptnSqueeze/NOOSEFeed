// components/Navigation/BurgerButton.tsx
import React from 'react';

interface BurgerButtonProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

const BurgerButton = ({ isOpen, toggleSidebar }: BurgerButtonProps) => {
    return (
        <button
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
        >
            <span
                className={`block h-0.5 w-6 bg-white transition-transform duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''
                    }`}
            />
            <span
                className={`block h-0.5 w-6 bg-white my-1 ${isOpen ? 'opacity-0' : ''
                    } transition-opacity duration-300`}
            />
            <span
                className={`block h-0.5 w-6 bg-white transition-transform duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''
                    }`}
            />
        </button>
    );
};

export default BurgerButton;