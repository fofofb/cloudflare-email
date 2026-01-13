"use client"

import { useEffect, useState } from "react"

interface ClientOnlyProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

/**
 * 只在客户端渲染的组件，避免 hydration 错误
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <>{fallback}</>
    }

    return <>{children}</>
}
