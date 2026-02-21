import { useDashboard } from '../context/DashboardContext'
import UploadButton from './UploadButton'

const Header = () => {
  const { connectionStatus } = useDashboard()

  const isConnected = connectionStatus === 'Connected'

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <img src="/logo.png" alt="Logo" style={{ height: 32 }} />
          <h1>Bayesmech Vision</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UploadButton />
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
