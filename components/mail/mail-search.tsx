"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface MailSearchProps {
    onSearch: (query: string) => void
    className?: string
}

export function MailSearch({ onSearch, className }: MailSearchProps) {
    const [query, setQuery] = useState("")

    const handleSearch = (value: string) => {
        setQuery(value)
        onSearch(value)
    }

    const handleClear = () => {
        setQuery("")
        onSearch("")
    }

    return (
        <div className={cn("relative", className)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="text"
                placeholder="搜索邮件标题、内容或发件人..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 pr-9"
            />
            {query && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-sm transition-colors"
                    title="清除搜索"
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </button>
            )}
        </div>
    )
}
