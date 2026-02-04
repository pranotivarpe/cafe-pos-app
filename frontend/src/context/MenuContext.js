import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const MenuContext = createContext();

export const useMenu = () => {
    const context = useContext(MenuContext);
    if (!context) throw new Error('useMenu must be inside MenuProvider');
    return context;
};

export const MenuProvider = ({ children }) => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Memoize api instance so it doesn't change on every render
    const api = useMemo(() => {
        const instance = axios.create({
            baseURL: 'http://localhost:5001/api',
        });

        instance.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        return instance;
    }, []);

    const fetchMenu = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/menu/items');
            setMenuItems(res.data || []);
        } catch (err) {
            console.error('Failed to fetch menu:', err);
            setMenuItems([]);
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchMenu();
    }, [fetchMenu]);

    const addItem = useCallback(async (item) => {
        const res = await api.post('/menu/items', item);
        setMenuItems((prev) => [...prev, res.data]);
        return res.data;
    }, [api]);

    const updateItem = useCallback(async (id, data) => {
        const res = await api.put(`/menu/items/${id}`, data);
        setMenuItems((prev) => prev.map((m) => (m.id === id ? res.data : m)));
        return res.data;
    }, [api]);

    const deleteItem = useCallback(async (id) => {
        await api.delete(`/menu/items/${id}`);
        setMenuItems((prev) => prev.filter((m) => m.id !== id));
    }, [api]);

    return (
        <MenuContext.Provider
            value={{
                menuItems,
                setMenuItems,
                loading,
                fetchMenu,
                addItem,
                updateItem,
                deleteItem,
            }}
        >
            {children}
        </MenuContext.Provider>
    );
};