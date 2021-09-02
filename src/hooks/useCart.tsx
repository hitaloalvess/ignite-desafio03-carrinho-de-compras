import { useEffect } from 'react';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart")

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const [stock, setStock] = useState<Stock[]>([])

  useEffect(()=> {
    async function pickStock(){
        const resp = await api('/stock')
        const dataStock = resp.data

        setStock(dataStock);
    }

    pickStock();
  }, [])

  const addProduct = async (productId: number) => {
    try {
      const product = await api(`/products/${productId}`)
      const stockItem = stock[productId - 1]

      let newCart;

      if(stockItem.amount <= 0){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

          const itemExists = cart.find( product => product.id === productId)

          if(itemExists){
            newCart = cart.map(product => {
              if(product.id === productId){
                return {
                    ...product, amount: product.amount + 1
                }
              }
              return product;
            })
          }else{
            newCart = [ 
              ...cart,
              {
                ...product.data,
                amount:1
              }]
          }
          
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter( product => product.id !== productId)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      setCart(newCart); //VERIFICAR DEPOIS PARA VER SE ESTA DENTRO DO CONCEITO DE IMUTABILIDADE

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stockItem = stock[productId - 1];

      if(stockItem.amount <= 0) return;

      if(stockItem.amount < amount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = cart.map( product => {
        if(product.id === productId){
          return {
            ...product, amount: amount
          }
        }

        return product;
      })

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      setCart(newCart);
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
