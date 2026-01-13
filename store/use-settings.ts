import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useConfigs } from './use-configs'

interface SettingsState {
  apiBaseUrl: string | null
  authToken: string | null
  resendApiKey: string | null
  setApiBaseUrl: (url: string) => void
  setAuthToken: (token: string) => void
  setResendApiKey: (key: string) => void

  // 从激活的配置获取设置
  getActiveSettings: () => {
    apiBaseUrl: string | null
    authToken: string | null
    resendApiKey: string | null
  }
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      apiBaseUrl: null,
      authToken: null,
      resendApiKey: null,
      setApiBaseUrl: (url) => set({ apiBaseUrl: url }),
      setAuthToken: (token) => set({ authToken: token }),
      setResendApiKey: (key) => set({ resendApiKey: key }),

      getActiveSettings: () => {
        const activeConfig = useConfigs.getState().getActiveConfig()
        const state = get()

        // 优先使用激活的配置，如果没有则使用旧的设置（向后兼容）
        if (activeConfig) {
          return {
            apiBaseUrl: activeConfig.apiBaseUrl,
            authToken: activeConfig.authToken,
            resendApiKey: activeConfig.resendApiKey,
          }
        }

        return {
          apiBaseUrl: state.apiBaseUrl,
          authToken: state.authToken,
          resendApiKey: state.resendApiKey,
        }
      },
    }),
    {
      name: 'settings-storage',
    }
  )
)
