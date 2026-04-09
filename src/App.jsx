import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import SplashScreen from './components/SplashScreen'
import Onboarding from './components/Onboarding'
import Navbar from './components/Navbar'
import BottomTabBar from './components/BottomTabBar'
import PullToRefresh from './components/PullToRefresh'
import BubbleHome from './pages/BubbleHome'
import Home from './pages/Home'
import PostDetail from './pages/PostDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Write from './pages/Write'
import Profile from './pages/Profile'
import Explore from './pages/Explore'
import FollowFeed from './pages/FollowFeed'
import UserProfile from './pages/UserProfile'
import Alert from './pages/Alert'
import TagPage from './pages/TagPage'
import Bookmarks from './pages/Bookmarks'
import Stats from './pages/Stats'
import Activity from './pages/Activity'
import Settings from './pages/Settings'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Terms from './pages/Terms'
import OpenSource from './pages/OpenSource'
import { PostsProvider } from './context/PostsContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProfileProvider } from './context/ProfileContext'
import { RebubbleProvider } from './context/RebubbleContext'
import { FollowProvider } from './context/FollowContext'
import { NotificationProvider, useNotification } from './context/NotificationContext'
import { DraftProvider } from './context/DraftContext'
import { BookmarkProvider } from './context/BookmarkContext'
import { usePosts } from './context/PostsContext'

const SAMPLE_USERS = ['minjun', 'soyeon', 'haewon']

function NotificationBridge() {
  const { posts } = usePosts()
  const { addNotification } = useNotification()
  const prevLen = useRef(posts.length)
  const timers = useRef([])

  useEffect(() => {
    if (posts.length <= prevLen.current) { prevLen.current = posts.length; return }
    const post = posts[0]
    prevLen.current = posts.length

    const pick = (exclude) => {
      const pool = SAMPLE_USERS.filter((u) => u !== exclude)
      return pool[Math.floor(Math.random() * pool.length)]
    }
    const u1 = SAMPLE_USERS[Math.floor(Math.random() * SAMPLE_USERS.length)]
    const u2 = pick(u1)

    const t1 = setTimeout(() => addNotification({
      id: `n_${Date.now()}_like`,
      type: 'like',
      from: u1,
      postId: post.id,
      postTitle: post.title,
      date: Date.now(),
      read: false,
    }), 4000)

    const t2 = setTimeout(() => addNotification({
      id: `n_${Date.now()}_rebubble`,
      type: 'rebubble',
      from: u2,
      postId: post.id,
      postTitle: post.title,
      date: Date.now(),
      read: false,
    }), 9000)

    timers.current.push(t1, t2)
    return () => { timers.current.forEach(clearTimeout); timers.current = [] }
  }, [posts.length])

  return null
}

function AppInner() {
  const { pathname } = useLocation()
  const isPost = pathname.startsWith('/post/')
  const isWrite = pathname.startsWith('/write/')

  return (
    <div className={`min-h-dvh ${isPost || isWrite ? 'pb-2' : 'pb-16'}`}>
      <PullToRefresh />
      <Navbar />
      <NotificationBridge />
      <main>
        <Routes>
          <Route path="/" element={<BubbleHome />} />
          <Route path="/list" element={<Home />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/write/:type" element={<Write />} />
          <Route path="/write/edit/:id" element={<Write />} />
          <Route path="/home" element={<FollowFeed />} />
          <Route path="/user/:name" element={<UserProfile />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Alert />} />
          <Route path="/tag/:tag" element={<TagPage />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/opensource" element={<OpenSource />} />
        </Routes>
      </main>
      <BottomTabBar />
    </div>
  )
}

export default function App() {
  const [splash, setSplash] = useState(true)
  const [onboarding, setOnboarding] = useState(() => !localStorage.getItem('bubblog_onboarded'))

  const handleOnboardingDone = () => {
    localStorage.setItem('bubblog_onboarded', '1')
    setOnboarding(false)
  }

  return (
    <ThemeProvider>
    <ProfileProvider>
      {splash && <SplashScreen onDone={() => setSplash(false)} />}
      {!splash && onboarding && <Onboarding onDone={handleOnboardingDone} />}
      <PostsProvider>
        <FollowProvider>
          <RebubbleProvider>
            <NotificationProvider>
              <DraftProvider>
                <BookmarkProvider>
                  <AppInner />
                </BookmarkProvider>
              </DraftProvider>
            </NotificationProvider>
          </RebubbleProvider>
        </FollowProvider>
      </PostsProvider>
    </ProfileProvider>
    </ThemeProvider>
  )
}
