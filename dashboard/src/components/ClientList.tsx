import React, { useEffect } from 'react'
import { useDashboard } from '../context/DashboardContext'
import ClientCard from './ClientCard'
import EmptyState from './EmptyState'

const ClientList: React.FC = () => {
  const { clients, selectedClientId, selectClient } = useDashboard()

  // Auto-select first client if none selected
  useEffect(() => {
    if (!selectedClientId && clients.length > 0) {
      selectClient(clients[0].client_id)
    }
  }, [clients, selectedClientId, selectClient])

  return (
    <section className="client-list-section">
      <h2 className="section-title">Connected Clients ({clients.length})</h2>
      {clients.length === 0 ? (
        <EmptyState
          icon="\u{1F4F1}"
          title="No clients connected"
          subtitle="Waiting for AR devices to connect..."
        />
      ) : (
        <div
          className="client-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          {clients.map((client) => (
            <ClientCard
              key={client.client_id}
              client={client}
              isActive={client.client_id === selectedClientId}
              onSelect={() => selectClient(client.client_id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default ClientList
