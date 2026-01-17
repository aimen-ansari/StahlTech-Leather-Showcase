import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const ProductContext = createContext(null);

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Create the controller to handle React Strict Mode double-renders
    const controller = new AbortController();
    
  async function fetchProducts() {
  try {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setProducts(data || []);
  } catch (error) {
    // This part is crucial: it ignores the AbortError so your app keeps running
    if (error.name !== 'AbortError') {
      console.error('Connection failed:', error.message);
    }
  } finally {
    setLoading(false);
  }
}

    fetchProducts();
    
    // 4. Cleanup: Abort the previous request if the component re-renders
    return () => controller.abort();
  }, []);

  const addProduct = async (newProduct) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select();

      if (error) throw error;
      setProducts(prev => [data[0], ...prev]);
      toast.success('Masterpiece Published');
      return { success: true };
    } catch (error) {
      // Helps identify if columns like 'color' are missing
      alert("Database Error: " + error.message);
      return { success: false, error };
    }
  };

  const updateProduct = async (id, updatedFields) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updatedFields)
        .eq('id', id)
        .select();

      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === id ? data[0] : p));
      toast.success('Inventory Updated');
      return { success: true };
    } catch (error) {
      toast.error('Update failed');
      return { success: false };
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this masterpiece?")) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product removed');
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <ProductContext.Provider value={{ products, loading, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => useContext(ProductContext);