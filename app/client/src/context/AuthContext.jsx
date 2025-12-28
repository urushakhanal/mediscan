import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
    login as loginRequest,
    register as registerRequest,
    logout as logoutRequest,
    me as meRequest,
} from '../lib/auth';

const AuthContext = createContext(null);

const getErrorMessage = (error, fallback) =>
    error?.data?.message || error?.message || fallback;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState('');

    const refreshUser = useCallback(async () => {
        setIsLoading(true);
        setAuthError('');
        try {
            const data = await meRequest();
            setUser(data.user);
        } catch (error) {
            if (error?.status !== 401) {
                const message = getErrorMessage(error, 'Unable to load session.');
                setAuthError(message);
                toast.error(message);
            }
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const signIn = useCallback(async (payload) => {
        setIsLoading(true);
        setAuthError('');
        try {
            const data = await loginRequest(payload);
            setUser(data.user);
            toast.success('Signed in successfully.');
            return data;
        } catch (error) {
            const message = getErrorMessage(error, 'Unable to sign in.');
            setAuthError(message);
            toast.error(message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const signUp = useCallback(async (payload) => {
        setIsLoading(true);
        setAuthError('');
        try {
            const data = await registerRequest(payload);
            setUser(data.user);
            toast.success('Account created successfully.');
            return data;
        } catch (error) {
            const message = getErrorMessage(error, 'Unable to sign up.');
            setAuthError(message);
            toast.error(message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const signOut = useCallback(async () => {
        setIsLoading(true);
        setAuthError('');
        try {
            await logoutRequest();
            setUser(null);
            toast.success('Signed out successfully.');
        } catch (error) {
            const message = getErrorMessage(error, 'Unable to sign out.');
            setAuthError(message);
            toast.error(message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const value = useMemo(
        () => ({
            user,
            isLoading,
            authError,
            signIn,
            signUp,
            signOut,
            refreshUser,
        }),
        [user, isLoading, authError, signIn, signUp, signOut, refreshUser]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
