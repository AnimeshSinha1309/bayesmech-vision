import { useEffect } from 'react'
import './App.css'
import { DashboardProvider } from './context/DashboardContext'
import Header from './components/Header'
import DashboardPage from './components/DashboardPage'

function App() {
  useEffect(() => {
    document.body.classList.add('dark-mode')
  }, [])

  return (
    <DashboardProvider>
      <Header />
      <div className="container">
        <DashboardPage />
      </div>
    </DashboardProvider>
  )
}

export default App
