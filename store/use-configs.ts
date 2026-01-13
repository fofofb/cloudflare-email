import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Config {
  id: string
  name: string
  apiBaseUrl: string
  authToken: string
  resendApiKey: string
  createdAt: number
}

interface ConfigsState {
  configs: Config[]
  activeConfigId: string | null
  
  // 配置管理
  addConfig: (config: Omit<Config, 'id' | 'createdAt'>) => Config
  updateConfig: (id: string, config: Partial<Omit<Config, 'id' | 'createdAt'>>) => void
  deleteConfig: (id: string) => void
  setActiveConfig: (id: string) => void
  
  // 获取当前配置
  getActiveConfig: () => Config | null
}

export const useConfigs = create<ConfigsState>()(
  persist(
    (set, get) => ({
      configs: [],
      activeConfigId: null,

      addConfig: (config) => {
        const newConfig: Config = {
          ...config,
          id: `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
        }
        
        set((state) => ({
          configs: [...state.configs, newConfig],
          // 如果是第一个配置，自动设为激活
          activeConfigId: state.configs.length === 0 ? newConfig.id : state.activeConfigId,
        }))
        
        return newConfig
      },

      updateConfig: (id, updates) => {
        set((state) => ({
          configs: state.configs.map((config) =>
            config.id === id ? { ...config, ...updates } : config
          ),
        }))
      },

      deleteConfig: (id) => {
        set((state) => {
          const newConfigs = state.configs.filter((config) => config.id !== id)
          const newActiveId = state.activeConfigId === id 
            ? (newConfigs.length > 0 ? newConfigs[0].id : null)
            : state.activeConfigId
          
          return {
            configs: newConfigs,
            activeConfigId: newActiveId,
          }
        })
      },

      setActiveConfig: (id) => {
        set({ activeConfigId: id })
      },

      getActiveConfig: () => {
        const state = get()
        return state.configs.find((config) => config.id === state.activeConfigId) || null
      },
    }),
    {
      name: 'configs-storage',
    }
  )
)
