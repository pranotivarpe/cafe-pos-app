import React, { createContext, useContext, useState, useEffect } from 'react';
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

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/menu/items');
            setMenuItems(res.data || []);
        } catch (err) {
            console.error('Failed to fetch menu:', err);
            setMenuItems([]);
        } finally {
            setLoading(false);
        }
    };

    const addItem = async (item) => {
        const res = await axios.post('/api/menu/items', item);
        setMenuItems((prev) => [...prev, res.data]);
        return res.data;
    };

    const updateItem = async (id, data) => {
        const res = await axios.put(`/api/menu/items/${id}`, data);
        setMenuItems((prev) => prev.map((m) => (m.id === id ? res.data : m)));
        return res.data;
    };

    const deleteItem = async (id) => {
        await axios.delete(`/api/menu/items/${id}`);
        setMenuItems((prev) => prev.filter((m) => m.id !== id));
    };

    return (
        <MenuContext.Provider
            value={{
                menuItems,
                setMenuItems, // exported so consumers like MenuPage can update directly when needed
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