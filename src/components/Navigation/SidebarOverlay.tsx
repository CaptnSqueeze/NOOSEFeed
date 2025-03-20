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
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" // Hide on md (768px+) screens
            onClick={closeSidebar}
            aria-hidden="true"
        />
    );
};


export default SidebarOverlay;