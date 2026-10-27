import { BrowserRouter, Route, Routes } from "react-router-dom"

import { AppLayout } from "@/components/AppLayout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AuthProvider } from "@/lib/auth"
import { DashboardPage } from "@/pages/Dashboard"
import { DatasetsPage } from "@/pages/Datasets"
import { JobsPage } from "@/pages/Jobs"
import { LoginPage } from "@/pages/Login"
import { RegisterPage } from "@/pages/Register"
import { TrainPage } from "@/pages/Train"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/datasets" element={<DatasetsPage />} />
              <Route path="/train" element={<TrainPage />} />
              <Route path="/jobs" element={<JobsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
