"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useConfigs, Config } from "@/store/use-configs"
import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, Plus, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const {
    configs,
    activeConfigId,
    addConfig,
    updateConfig,
    deleteConfig,
    setActiveConfig,
    getActiveConfig
  } = useConfigs()

  const { toast } = useToast()
  const [isNewConfig, setIsNewConfig] = useState(false)
  const [configName, setConfigName] = useState('')
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    if (open) {
      const activeConfig = getActiveConfig()
      if (activeConfig) {
        setConfigName(activeConfig.name)
        setUrl(activeConfig.apiBaseUrl)
        setToken(activeConfig.authToken)
        setApiKey(activeConfig.resendApiKey)
        setIsNewConfig(false)
      } else {
        // 没有配置时，显示新建表单
        setIsNewConfig(true)
        setConfigName('')
        setUrl('')
        setToken('')
        setApiKey('')
      }
    }
  }, [open, activeConfigId, getActiveConfig])

  const handleSave = () => {
    if (!configName.trim()) {
      toast({
        title: "错误",
        description: "请输入配置名称",
        variant: "destructive",
      })
      return
    }

    if (!url.trim() || !token.trim()) {
      toast({
        title: "错误",
        description: "请输入 API 地址和认证令牌",
        variant: "destructive",
      })
      return
    }

    // 验证 URL 格式
    const urlTrimmed = url.trim()
    if (!urlTrimmed.startsWith('http://') && !urlTrimmed.startsWith('https://')) {
      toast({
        title: "错误",
        description: "API 地址必须以 http:// 或 https:// 开头",
        variant: "destructive",
      })
      return
    }

    // 检查常见的拼写错误
    if (urlTrimmed.startsWith('httsp://') || urlTrimmed.startsWith('htps://')) {
      toast({
        title: "错误",
        description: "URL 格式错误，应该是 https:// 而不是 httsp:// 或 htps://",
        variant: "destructive",
      })
      return
    }

    if (isNewConfig) {
      const newConfig = addConfig({
        name: configName.trim(),
        apiBaseUrl: urlTrimmed,
        authToken: token.trim(),
        resendApiKey: apiKey.trim(),
      })
      // 自动激活新创建的配置
      setActiveConfig(newConfig.id)
      toast({
        description: `配置 "${configName}" 已创建并激活`,
      })
      setIsNewConfig(false)
    } else if (activeConfigId) {
      updateConfig(activeConfigId, {
        name: configName.trim(),
        apiBaseUrl: urlTrimmed,
        authToken: token.trim(),
        resendApiKey: apiKey.trim(),
      })
      toast({
        description: `配置 "${configName}" 已更新`,
      })
    }

    onOpenChange(false)
  }

  const handleDelete = () => {
    if (activeConfigId && configs.length > 0) {
      const configToDelete = configs.find(c => c.id === activeConfigId)
      deleteConfig(activeConfigId)
      toast({
        description: `配置 "${configToDelete?.name}" 已删除`,
      })

      // 如果删除后还有配置，切换到第一个
      if (configs.length > 1) {
        const remainingConfigs = configs.filter(c => c.id !== activeConfigId)
        if (remainingConfigs.length > 0) {
          setActiveConfig(remainingConfigs[0].id)
        }
      } else {
        // 没有配置了，显示新建表单
        setIsNewConfig(true)
        setConfigName('')
        setUrl('')
        setToken('')
        setApiKey('')
      }
    }
  }

  const handleNewConfig = () => {
    setIsNewConfig(true)
    setConfigName('')
    setUrl('')
    setToken('')
    setApiKey('')
  }

  const handleConfigChange = (configId: string) => {
    setActiveConfig(configId)
    const config = configs.find(c => c.id === configId)
    if (config) {
      setConfigName(config.name)
      setUrl(config.apiBaseUrl)
      setToken(config.authToken)
      setApiKey(config.resendApiKey)
      setIsNewConfig(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>系统设置</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* 配置选择器 */}
          <div className="space-y-2">
            <Label>选择配置</Label>
            <div className="flex gap-2">
              <Select
                value={isNewConfig ? 'new' : activeConfigId || undefined}
                onValueChange={(value) => {
                  if (value === 'new') {
                    handleNewConfig()
                  } else {
                    handleConfigChange(value)
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="选择一个配置" />
                </SelectTrigger>
                <SelectContent>
                  {configs.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      新建配置
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {!isNewConfig && activeConfigId && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDelete}
                  disabled={configs.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* 配置表单 */}
          <div className="space-y-2">
            <Label>配置名称</Label>
            <Input
              placeholder="例如：生产环境"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>API 地址</Label>
            <Input
              placeholder="请输入 API 地址"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>认证令牌</Label>
            <Input
              type="password"
              placeholder="请输入认证令牌"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Resend API Key（可选）</Label>
            <Input
              type="password"
              placeholder="请输入 Resend API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            {isNewConfig ? '创建' : '保存'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}