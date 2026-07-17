export const en = {
    common: {
        retry: 'Retry',
    },
    offline: {
        title: 'You are offline',
        description: 'Some cloud actions are unavailable. Local data remains accessible.',
        errorMessage: 'You appear to be offline. Check your connection and try again.',
        timeoutMessage: 'Request timed out. Check your connection and try again.',
    },
    settings: {
        printer: 'Printer',
        printerDescription: 'Configure thermal printer connection and paper size',
        receipt: 'Receipt',
        receiptDescription: 'Customize receipt layout, store info, and footer',
        updates: 'App Updates',
        updatesDescription: 'Check for app updates and restart when a new version is ready',
        appearance: 'Appearance',
        appearanceDescription: 'Choose how the app follows your device theme',
        themeSystem: 'System',
        themeLight: 'Light',
        themeDark: 'Dark',
        language: 'Language',
        languageDescription: 'Language selection is coming soon',
        english: 'English',
        indonesian: 'Indonesian',
        logout: 'Logout',
    },
};

export type TranslationKey = typeof en;
