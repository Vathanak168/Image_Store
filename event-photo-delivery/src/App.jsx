import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage      from './pages/LandingPage'
import GalleryPage      from './pages/GalleryPage'
import AdminPage        from './pages/AdminPage'
import QRScanPage       from './pages/QRScanPage'
import TablePage        from './pages/TablePage'
import TableGalleryPage from './pages/TableGalleryPage'
import FaceScanPage     from './pages/FaceScanPage'

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
          <Route path="/"                       element={<LandingPage />} />
          <Route path="/g/:token"               element={<GalleryPage />} />
          <Route path="/face-scan"              element={<FaceScanPage />} />
          <Route path="/face-scan/:token"       element={<FaceScanPage />} />
          <Route path="/scan-qr"                element={<QRScanPage />} />
          <Route path="/table"                  element={<TablePage />} />
          <Route path="/browse/table/:tableNumber" element={<TableGalleryPage />} />

          {/* Admin */}
          <Route path="/admin"                  element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
