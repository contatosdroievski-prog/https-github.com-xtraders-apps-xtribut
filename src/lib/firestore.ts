import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface UserData {
    trades: any[];
    withdrawals: any[];
    lastUpdated: string;
}

export const saveTrades = async (userId: string, trades: any[]) => {
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            trades,
            lastUpdated: new Date().toISOString()
        }, { merge: true });
        console.log('Trades saved successfully');
    } catch (error) {
        console.error('Error saving trades:', error);
        throw error;
    }
};

export const getTrades = async (userId: string) => {
    try {
        const userRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            return docSnap.data().trades || [];
        }
        return [];
    } catch (error) {
        console.error('Error getting trades:', error);
        throw error;
    }
};

export const saveWithdrawals = async (userId: string, withdrawals: any[]) => {
    try {
        // Serialize dates to strings
        const serialized = withdrawals.map(w => ({
            ...w,
            date: w.date instanceof Date ? w.date.toISOString() : w.date
        }));

        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            withdrawals: serialized,
            lastUpdated: new Date().toISOString()
        }, { merge: true });
        console.log('Withdrawals saved successfully');
    } catch (error) {
        console.error('Error saving withdrawals:', error);
        throw error;
    }
};

export const getWithdrawals = async (userId: string) => {
    try {
        const userRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            return docSnap.data().withdrawals || [];
        }
        return [];
    } catch (error) {
        console.error('Error getting withdrawals:', error);
        throw error;
    }
};
