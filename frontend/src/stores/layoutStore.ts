import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutState {
  // 侧边栏状态
  collapsed: boolean;
  
  // Actions
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      // 初始状态
      collapsed: false,

      // 切换侧边栏折叠状态
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      
      // 设置侧边栏折叠状态
      setCollapsed: (collapsed: boolean) => set({ collapsed: collapsed })
    }),
    {
      name: 'layout-storage',
      partialize: (state) => ({ collapsed: state.collapsed })
    }
  )
);
