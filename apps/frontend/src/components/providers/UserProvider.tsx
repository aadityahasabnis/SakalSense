'use client';
// =============================================
// UserProvider - Hydrates current user state from server
// =============================================

import { useEffect } from 'react';

import { useSetAtom } from 'jotai';

import { currentUserAtom, type ICurrentUserState } from '@/jotai/atoms';

interface IUserProviderProps {
    user: ICurrentUserState | null;
    children: React.ReactNode;
}

export const UserProvider = ({ user, children }: IUserProviderProps) => {
    const setCurrentUser = useSetAtom(currentUserAtom);

    useEffect(() => {
        setCurrentUser(user);
    }, [user, setCurrentUser]);

    return <>{children}</>;
};
