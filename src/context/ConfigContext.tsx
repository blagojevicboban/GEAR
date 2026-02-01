import React, { createContext, useContext, useState, useEffect } from 'react';

interface PublicConfig {
    brand_name: string;
    brand_color: string;
    global_announcement: string;
    maintenance_mode: string;
    allow_public_registration: string;
}

interface ConfigContextType {
    config: PublicConfig;
    loading: boolean;
    refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<PublicConfig>({
        brand_name: 'THE GEAR',
        brand_color: '#4f46e5',
        global_announcement: '',
        maintenance_mode: 'false',
        allow_public_registration: 'true',
    });
    const [loading, setLoading] = useState(true);

    const refreshConfig = async () => {
        try {
            const res = await fetch('/api/config/public');
            if (res.ok) {
                const data = await res.json();
                setConfig((prev) => ({ ...prev, ...data }));
            }
        } catch (err) {
            console.error('Failed to fetch public config', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshConfig();
    }, []);

    // Apply primary color to CSS variable
    useEffect(() => {
        if (config.brand_color) {
            document.documentElement.style.setProperty('--brand-primary', config.brand_color);
            // Also generate a glow/secondary color if needed
            document.documentElement.style.setProperty('--brand-primary-glow', `${config.brand_color}33`); // 20% alpha
        }
    }, [config.brand_color]);

    return (
        <ConfigContext.Provider value={{ config, loading, refreshConfig }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};
