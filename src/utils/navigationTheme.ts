export function getNavigationTheme(isDarkMode: boolean) {
    return {
        background: isDarkMode ? '#1b1b1f' : '#f7f7f8',
        foreground: isDarkMode ? '#fafafa' : '#1f1f23',
        muted: isDarkMode ? '#b3b3bc' : '#74747c',
        surface: isDarkMode ? '#222227' : '#ffffff',
        surfaceSecondary: isDarkMode ? '#2a2a30' : '#f0f0f2',
        border: isDarkMode ? '#3a3a41' : '#e3e3e7',
        accent: '#2f98d2',
    };
}
