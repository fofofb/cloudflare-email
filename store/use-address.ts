import { create } from "zustand"
import { persist } from "zustand/middleware"
import { EmailAddress } from "@/lib/http-client"
import { useMailView } from './use-mail-view'
import { useConfigs } from './use-configs'

interface AddressStore {
  addresses: EmailAddress[]
  currentAddress: EmailAddress | null
  setAddresses: (addresses: EmailAddress[]) => void
  setCurrentAddress: (address: EmailAddress | null) => void
  clearAddresses: () => void
}

// 获取当前配置的存储键
const getStorageKey = () => {
  const activeConfig = useConfigs.getState().getActiveConfig()
  if (!activeConfig) {
    return 'address-storage-default'
  }
  return `address-storage-${activeConfig.id}`
}

export const useAddressStore = create<AddressStore>()(
  persist(
    (set) => ({
      addresses: [],
      currentAddress: null,
      setAddresses: (addresses) => set({ addresses }),
      setCurrentAddress: (address) => {
        set({ currentAddress: address })
        // 切换邮箱时自动跳转到收件箱
        useMailView.getState().setView('inbox')
      },
      clearAddresses: () => set({ addresses: [], currentAddress: null }),
    }),
    {
      name: getStorageKey(),
      // 动态获取存储键
      partialize: (state) => ({
        addresses: state.addresses,
        currentAddress: state.currentAddress,
      }),
    }
  )
)

// 当配置切换时，需要重新加载对应配置的地址数据
export const switchConfigAddresses = (configId: string) => {
  const storageKey = `address-storage-${configId}`
  const stored = localStorage.getItem(storageKey)

  if (stored) {
    try {
      const data = JSON.parse(stored)
      if (data.state) {
        useAddressStore.setState({
          addresses: data.state.addresses || [],
          currentAddress: data.state.currentAddress || null,
        })
      }
    } catch (error) {
      console.error('Failed to load addresses for config:', error)
    }
  } else {
    // 如果没有存储的数据，清空地址列表
    useAddressStore.setState({
      addresses: [],
      currentAddress: null,
    })
  }
}
