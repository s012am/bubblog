import { usePosts } from './PostsContext'

// RebubbleProvider는 이제 아무 역할 없음 (PostsContext가 모든 상태 관리)
export function RebubbleProvider({ children }) {
  return <>{children}</>
}

export function useRebubble() {
  const { rebubbledIds, toggleRebubble, isRebubbled } = usePosts()
  return { rebubbledIds, toggle: toggleRebubble, isRebubbled }
}
