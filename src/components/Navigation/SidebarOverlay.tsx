// components/Navigation/SidebarOverlay.tsx
import React, { useEffect } from 'react';

interface SidebarOverlayProps {
    isOpen: boolean;
    closeSidebar: () => void;
}

const SidebarOverlay: React.FC<SidebarOverlayProps> = ({ isOpen, closeSidebar }) => {
    // Disable scrolling when overlay is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        closeSidebar();
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 max-md:block md:hidden"
            onClick={handleClick}
            style={{ pointerEvents: 'auto' }}
            aria-hidden="true"
        />
    );
};

export default SidebarOverlay;