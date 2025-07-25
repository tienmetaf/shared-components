import { useEffect, useState } from "react"

export function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < breakpoint)
        handler()
        window.addEventListener("resize", handler)
        return () => window.removeEventListener("resize", handler)
    }, [breakpoint])
    return isMobile
}