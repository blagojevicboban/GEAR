import initOC from '../../node_modules/opencascade.js/dist/opencascade.wasm.js';

export default function init() {
    return initOC({
        locateFile: (path) => {
            if (path.endsWith('.wasm')) {
                return '/opencascade.wasm';
            }
            return path;
        },
    });
}
