// components/Layout/PageWrapper.tsx
import React from 'react';

interface PageWrapperProps {
    children: React.ReactNode;
}

// This component can be used to wrap your pages for consistent styling
const PageWrapper = ({ children }: PageWrapperProps) => {
    return (
        <div className="bg-gray-800 p-4 md:p-6 min-h-screen w-full">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </div>
    );
};

export default PageWrapper;
