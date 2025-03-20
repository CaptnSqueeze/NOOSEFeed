// components/Navigation/SidebarOverlay.tsx
import React from 'react';

interface SidebarOverlayProps {
    isOpen: boolean;
    closeSidebar: () => void;
}

const SidebarOverlay: React.FC<SidebarOverlayProps> = ({ isOpen, closeSidebar }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 w-screen h-screen bg-black bg-opacity-50 z-50 md:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
        />
    );
};

export default SidebarOverlay;