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
        try {
            const res = await axios.get('/api/menu/items');
            setMenuItems(res.data);
        } catch (err) {
            console.error('Failed to fetch menu:', err);
        } finally {
            setLoading(false);
        }
    };

    const addItem = async (item) => {
        const res = await axios.post('/api/menu/items', item);
        setMenuItems([...menuItems, res.data]);
    };

    const updateItem = async (id, data) => {
        const res = await axios.put(`/api/menu/items/${id}`, data);
        setMenuItems(menuItems.map(item => item.id === id ? res.data : item));
    };

    const deleteItem = async (id) => {
        await axios.delete(`/api/menu/items/${id}`);
        setMenuItems(menuItems.filter(item => item.id !== id));
    };




    return (
        <MenuContext.Provider value={{ menuItems, addItem, updateItem, deleteItem, setMenuItems, loading }}>
            {children}
        </MenuContext.Provider>
    );
};
