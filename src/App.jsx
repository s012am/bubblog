import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useState } from 'react'
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
import NotificationSettings from './pages/NotificationSettings'
import PasswordChange from './pages/PasswordChange'
import DeleteAccount from './pages/DeleteAccount'
import BlockedUsers from './pages/BlockedUsers'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Terms from './pages/Terms'
import OpenSource from './pages/OpenSource'
import AuthCallback from './pages/AuthCallback'
import ProfileSetup from './components/ProfileSetup'
import { PostsProvider } from './context/PostsContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProfileProvider, useProfile } from './context/ProfileContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { RebubbleProvider } from './context/RebubbleContext'
import { FollowProvider } from './context/FollowContext'
import { NotificationProvider } from './context/NotificationContext'
import { DraftProvider } from './context/DraftContext'
import { BookmarkProvider } from './context/BookmarkContext'


function PrivateRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return null
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return null
  return isLoggedIn ? <Navigate to="/" replace /> : children
}

function AppInner() {
  const { pathname } = useLocation()
  const { isLoggedIn, loading } = useAuth()
  const { profile, profileLoaded } = useProfile()
  const isPost = pathname.startsWith('/post/')
  const isWrite = pathname.startsWith('/write/')

  if (loading) return null

  // Show profile setup for new users who haven't set a nickname yet
  if (isLoggedIn && profileLoaded && !profile.name) {
    return <ProfileSetup />
  }

  return (
    <div className={`min-h-dvh ${isPost || isWrite ? 'pb-2' : 'pb-16'}`}>
      <PullToRefresh />
      <Navbar />
      <main>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><BubbleHome /></PrivateRoute>} />
          <Route path="/list" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/post/:id" element={<PrivateRoute><PostDetail /></PrivateRoute>} />
          <Route path="/write/:type" element={<PrivateRoute><Write /></PrivateRoute>} />
          <Route path="/write/edit/:id" element={<PrivateRoute><Write /></PrivateRoute>} />
          <Route path="/home" element={<PrivateRoute><FollowFeed /></PrivateRoute>} />
          <Route path="/user/:name" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
          <Route path="/explore" element={<PrivateRoute><Explore /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Alert /></PrivateRoute>} />
          <Route path="/tag/:tag" element={<PrivateRoute><TagPage /></PrivateRoute>} />
          <Route path="/bookmarks" element={<PrivateRoute><Bookmarks /></PrivateRoute>} />
          <Route path="/stats" element={<PrivateRoute><Stats /></PrivateRoute>} />
          <Route path="/activity" element={<PrivateRoute><Activity /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/settings/notifications" element={<PrivateRoute><NotificationSettings /></PrivateRoute>} />
          <Route path="/settings/password" element={<PrivateRoute><PasswordChange /></PrivateRoute>} />
          <Route path="/settings/delete-account" element={<PrivateRoute><DeleteAccount /></PrivateRoute>} />
          <Route path="/settings/blocked" element={<PrivateRoute><BlockedUsers /></PrivateRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/opensource" element={<OpenSource />} />
        </Routes>
      </main>
      {isLoggedIn && <BottomTabBar />}
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
    <AuthProvider>
    <ProfileProvider>
      {splash && <SplashScreen onDone={() => setSplash(false)} />}
      {!splash && onboarding && <Onboarding onDone={handleOnboardingDone} />}
      <PostsProvider>
        <FollowProvider>
          <RebubbleProvider>
            <NotificationProvider>
              <DraftProvider>
                <BookmarkProvider>
                  {!splash && <AppInner />}
                </BookmarkProvider>
              </DraftProvider>
            </NotificationProvider>
          </RebubbleProvider>
        </FollowProvider>
      </PostsProvider>
    </ProfileProvider>
    </AuthProvider>
    </ThemeProvider>
  )
}
