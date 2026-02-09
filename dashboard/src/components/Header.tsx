import { useTheme } from '../context/ThemeContext'
import { useDashboard } from '../context/DashboardContext'
import UploadButton from './UploadButton'

const Header = () => {
  const { theme, toggleTheme } = useTheme()
  const { connectionStatus } = useDashboard()

  const isConnected = connectionStatus === 'Connected'

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <img src="/logo.png" alt="Logo" style={{ height: 32 }} />
          <h1>BayesMech CamAlytics</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UploadButton />
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <span className="icon">{theme === 'light' ? '\u{1F319}' : '\u{2600}\u{FE0F}'}</span>
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          <div className={`status-badge${isConnected ? '' : ' disconnected'}`}>
            <span className="status-dot" />
            {connectionStatus}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
