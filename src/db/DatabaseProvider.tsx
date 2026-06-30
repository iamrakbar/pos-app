import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from './client';
import migrations from './migrations/migrations';
import { runSeedIfNeeded } from './seed';

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
    const { success, error } = useMigrations(db, migrations);

    React.useEffect(() => {
        if (success) {
            runSeedIfNeeded();
        }
    }, [success]);

    if (error) throw error;

    if (!success) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator />
            </View>
        );
    }

    return <>{children}</>;
}
