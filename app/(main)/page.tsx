"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { HttpClient, Mail, MailsResponse } from "@/lib/http-client"
import { MailList } from "@/components/mail/mail-list"
import { Inbox, Loader2, Settings as SettingsIcon } from "lucide-react"
import { useAddressStore } from "@/store/use-address"
import { motion, AnimatePresence } from "framer-motion"
import MailEditor from "@/components/mail/mail-editor"
import { useMailView } from "@/store/use-mail-view"
import { useConfigs } from "@/store/use-configs"
import { Button } from "@/components/ui/button"
import { ClientOnly } from "@/components/ui/client-only"

export default function MailContent() {
  const { view } = useMailView()
  const [mails, setMails] = useState<Mail[]>([])
  const [loading, setLoading] = useState(false) // 改为 false 避免 hydration 错误
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(0)
  const currentAddress = useAddressStore(state => state.currentAddress)

  // 直接订阅配置变化
  const activeConfig = useConfigs(state => state.getActiveConfig())
  const apiBaseUrl = activeConfig?.apiBaseUrl || null
  const authToken = activeConfig?.authToken || null

  const fetchMails = useCallback(async (isLoadingMore = false) => {
    // 如果未配置 API，不执行请求
    if (!apiBaseUrl || !authToken) {
      console.log('[fetchMails] 未配置 API:', { apiBaseUrl, authToken })
      setLoading(false)
      return
    }

    console.log('[fetchMails] 开始加载邮件:', {
      isLoadingMore,
      currentAddress: {
        id: currentAddress?.id,
        name: currentAddress?.name,
        全部地址: currentAddress?.id === -1
      },
      apiBaseUrl,
      offset: isLoadingMore ? offsetRef.current : 0
    })

    try {
      if (isLoadingMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      let data: MailsResponse

      if (currentAddress?.id === -1) {
        console.log('[fetchMails] 请求所有邮件')
        data = await HttpClient.getAllMails(20, isLoadingMore ? offsetRef.current : 0)
      } else {
        console.log('[fetchMails] 请求特定地址邮件:', currentAddress?.name)
        data = await HttpClient.getMails(
          currentAddress!.name,
          20,
          isLoadingMore ? offsetRef.current : 0
        )
      }

      console.log('[fetchMails] 收到数据:', {
        itemsCount: data?.items?.length,
        total: data?.total
      })

      if (!data) {
        throw new Error('Failed to fetch mails')
      }

      const newHasMore = data.items.length === 20
      setHasMore(newHasMore)

      if (isLoadingMore) {
        setMails(prev => [...prev, ...data.items])
        offsetRef.current += 20
      } else {
        setMails(data.items)
        offsetRef.current = newHasMore ? 20 : 0
      }

    } catch (error) {
      console.error('[fetchMails] 加载失败:', error)
      setError("加载邮件失败")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [currentAddress, apiBaseUrl, authToken])

  const handleRefresh = useCallback(async () => {
    setMails([])
    offsetRef.current = 0
    setHasMore(true)
    setError(null)
    await fetchMails()
  }, [fetchMails])

  useEffect(() => {
    console.log('[useEffect] 配置变化:', {
      currentAddress: currentAddress?.name,
      apiBaseUrl,
      authToken: authToken ? '已设置' : '未设置'
    })

    if (!currentAddress) return
    if (!apiBaseUrl || !authToken) {
      setLoading(false)
      return
    }

    setMails([])
    offsetRef.current = 0
    setHasMore(true)
    setError(null)
    setLoading(true) // 在客户端设置 loading 状态

    fetchMails()
  }, [currentAddress, fetchMails, apiBaseUrl, authToken])

  // 渲染主要内容
  const renderContent = () => {
    switch (view) {
      case 'compose':
        return (
          <div className="h-full p-4">
            <h1 className="text-2xl font-bold mb-4">写邮件</h1>
            <MailEditor />
          </div>
        )
      case 'inbox':
        // 如果未配置 API，显示配置提示
        if (!apiBaseUrl || !authToken) {
          return (
            <ClientOnly>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-muted-foreground"
              >
                <SettingsIcon className="h-12 w-12 mb-4" />
                <p className="mb-4">请先在设置中配置 API 地址和令牌</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    // 这里可以触发打开设置对话框
                    (document.querySelector('[data-settings-trigger="true"]') as HTMLElement)?.click()
                  }}
                >
                  前往设置
                </Button>
              </motion.div>
            </ClientOnly>
          )
        }

        if (loading) {
          return (
            <ClientOnly>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-muted-foreground"
              >
                <Loader2 className="h-12 w-12 mb-4 animate-spin" />
                <p>加载邮件中...</p>
              </motion.div>
            </ClientOnly>
          )
        }

        if (error) {
          return (
            <ClientOnly>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full text-destructive"
              >
                {error}
              </motion.div>
            </ClientOnly>
          )
        }

        if (!mails || mails.length === 0) {
          return (
            <ClientOnly>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-muted-foreground"
              >
                <Inbox className="h-12 w-12 mb-4" />
                <p>没有邮件</p>
              </motion.div>
            </ClientOnly>
          )
        }

        return (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentAddress?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <MailList
                mails={mails}
                hasMore={hasMore}
                loadingMore={loadingMore}
                onLoadMore={() => fetchMails(true)}
                onRefresh={handleRefresh}
              />
            </motion.div>
          </AnimatePresence>
        )
      default:
        return null
    }
  }

  return (
    <div className="h-full">
      {renderContent()}
    </div>
  )
} 