
import './index.css';
import 'katex/dist/katex.min.css';
import { createRoot } from 'react-dom/client';
import './i18n'; // Initialize i18n
import App from './App';

import { ConfigProvider } from './context/ConfigContext';
import { ThemeProvider } from './context/ThemeContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Could not find root element to mount to');
}

const root = createRoot(rootElement);
root.render(
    <ConfigProvider>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </ConfigProvider>
);
