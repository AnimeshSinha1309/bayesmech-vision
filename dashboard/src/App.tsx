import './App.css'
import { ThemeProvider } from './context/ThemeContext'
import { DashboardProvider } from './context/DashboardContext'
import Header from './components/Header'
import StreamSection from './components/StreamSection'

function App() {
  return (
    <ThemeProvider>
      <DashboardProvider>
        <Header />
        <div className="container">
          <StreamSection />
        </div>
      </DashboardProvider>
    </ThemeProvider>
  )
}

export default App
