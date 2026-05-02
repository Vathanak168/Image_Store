import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage      from './pages/LandingPage'
import GalleryPage      from './pages/GalleryPage'
import AdminPage        from './pages/AdminPage'
import QRScanPage       from './pages/QRScanPage'
import TablePage        from './pages/TablePage'
import TableGalleryPage from './pages/TableGalleryPage'
import FaceScanPage     from './pages/FaceScanPage'

// New Layouts and Pages
import EventWorkspaceLayout from './layouts/EventWorkspaceLayout'
import TablesPage           from './pages/admin/TablesPage'

const qc = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          {/* Guest flows */}
          <Route path="/"                       element={<Navigate to="/admin" replace />} />
          <Route path="/e/:eventId"             element={<LandingPage />} />
          <Route path="/e/:eventId/gallery"     element={<GalleryPage />} />
          <Route path="/e/:eventId/gallery/:sessionId" element={<GalleryPage />} />
          
          <Route path="/face-scan"              element={<FaceScanPage />} />
          <Route path="/face-scan/:token"       element={<FaceScanPage />} />
          <Route path="/scan-qr"                element={<QRScanPage />} />
          <Route path="/table"                  element={<TablePage />} />
          <Route path="/browse/table/:tableNumber" element={<TableGalleryPage />} />

          {/* Legacy Global Admin */}
          <Route path="/admin"                  element={<AdminPage />} />

          {/* New Event Workspace Admin */}
          <Route path="/admin/events/:eventId" element={<EventWorkspaceLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<div className="p-8">Overview Page (WIP)</div>} />
            <Route path="guests" element={<div className="p-8">Guests Page (WIP)</div>} />
            <Route path="photos" element={<div className="p-8">Photos Page (WIP)</div>} />
            <Route path="tables" element={<TablesPage />} />
            <Route path="sessions" element={<div className="p-8">Sessions Page (WIP)</div>} />
            <Route path="delivery" element={<div className="p-8">Delivery Page (WIP)</div>} />
            <Route path="analytics" element={<div className="p-8">Analytics Page (WIP)</div>} />
            <Route path="settings" element={<div className="p-8">Settings Page (WIP)</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

