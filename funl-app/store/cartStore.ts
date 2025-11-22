import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StickerStyle {
  id: string
  name: string
  template: string
  preview_url?: string
}

export interface CartItem {
  batch_id: string
  batch_name: string
  size: string // 'small', 'medium', 'large'
  style: StickerStyle
  quantity: number
  unit_price: number
  total_price: number
}

export interface ShippingAddress {
  full_name: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
}

interface CartState {
  items: CartItem[]
  shippingAddress: ShippingAddress | null

  // Actions
  addItem: (item: Omit<CartItem, 'total_price'>) => void
  updateQuantity: (batch_id: string, size: string, style_id: string, quantity: number) => void
  removeItem: (batch_id: string, size: string, style_id: string) => void
  clearCart: () => void
  setShippingAddress: (address: ShippingAddress) => void

  // Computed values
  getSubtotal: () => number
  getTax: () => number
  getShipping: () => number
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      shippingAddress: null,

      addItem: (item) => {
        const total_price = item.quantity * item.unit_price
        const newItem = { ...item, total_price }

        set((state) => {
          // Check if item already exists (same batch, size, style)
          const existingIndex = state.items.findIndex(
            (i) =>
              i.batch_id === item.batch_id &&
              i.size === item.size &&
              i.style.id === item.style.id
          )

          if (existingIndex >= 0) {
            // Update quantity and price
            const updatedItems = [...state.items]
            updatedItems[existingIndex].quantity += item.quantity
            updatedItems[existingIndex].total_price =
              updatedItems[existingIndex].quantity * updatedItems[existingIndex].unit_price
            return { items: updatedItems }
          } else {
            // Add new item
            return { items: [...state.items, newItem] }
          }
        })
      },

      updateQuantity: (batch_id, size, style_id, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.batch_id === batch_id &&
            item.size === size &&
            item.style.id === style_id
              ? {
                  ...item,
                  quantity,
                  total_price: quantity * item.unit_price
                }
              : item
          )
        }))
      },

      removeItem: (batch_id, size, style_id) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.batch_id === batch_id &&
                item.size === size &&
                item.style.id === style_id
              )
          )
        }))
      },

      clearCart: () => {
        set({ items: [], shippingAddress: null })
      },

      setShippingAddress: (address) => {
        set({ shippingAddress: address })
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.total_price, 0)
      },

      getTax: () => {
        const subtotal = get().getSubtotal()
        // 10% GST (Australian tax)
        return subtotal * 0.1
      },

      getShipping: () => {
        const itemCount = get().getItemCount()
        if (itemCount === 0) return 0

        // Flat rate shipping: $5 base + $0.50 per item
        return 5 + (itemCount * 0.5)
      },

      getTotal: () => {
        return get().getSubtotal() + get().getTax() + get().getShipping()
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      }
    }),
    {
      name: 'funl-cart-storage',
      // Only persist items and shipping address
      partialize: (state) => ({
        items: state.items,
        shippingAddress: state.shippingAddress
      })
    }
  )
)
