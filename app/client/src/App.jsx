import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import HealthPage from './pages/HealthPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import GoogleDoctorOnboardingPage from './pages/GoogleDoctorOnboardingPage';
import SymptomCheckerPage from './pages/SymptomCheckerPage';
import CarePlansPage from './pages/CarePlansPage';
import CarePlanDetailPage from './pages/CarePlanDetailPage';
import InitSuperadmin from './pages/InitSuperadmin';
import DoctorsPage from './pages/DoctorsPage';
import DoctorDetailPage from './pages/DoctorDetailPage';
import AdminLayout from './components/admin/AdminLayout';
import DoctorLayout from './components/doctor/DoctorLayout';
import PatientLayout from './components/patient/PatientLayout';
import SuperadminRoute from './components/admin/SuperadminRoute';
import RoleRoute from './components/auth/RoleRoute';
import AdminDashboard from './pages/AdminDashboard';
import AdminDoctorsPage from './pages/AdminDoctorsPage';
import AdminPatientsPage from './pages/AdminPatientsPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorAppointmentsPage from './pages/DoctorAppointmentsPage';
import DoctorAppointmentDetailPage from './pages/DoctorAppointmentDetailPage';
import DoctorPatientsPage from './pages/DoctorPatientsPage';
import DoctorPatientRecordPage from './pages/DoctorPatientRecordPage';
import DoctorSchedulePage from './pages/DoctorSchedulePage';
import PatientAppointmentsPage from './pages/PatientAppointmentsPage';
import AppointmentPaymentReturnPage from './pages/AppointmentPaymentReturnPage';
import PatientCarePlansPage from './pages/PatientCarePlansPage';
import DoctorCarePlansPage from './pages/DoctorCarePlansPage';
import DoctorCarePlanRequestsPage from './pages/DoctorCarePlanRequestsPage';
import AdminCarePlansPage from './pages/AdminCarePlansPage';
import AdminCarePlanRequestsPage from './pages/AdminCarePlanRequestsPage';

function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-center" />
            <MainLayout>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/health" element={<HealthPage />} />
                    <Route path="/symptom-checker" element={<SymptomCheckerPage />} />
                    <Route path="/care-plans" element={<CarePlansPage />} />
                    <Route path="/care-plans/:id" element={<CarePlanDetailPage />} />
                    <Route path="/doctors" element={<DoctorsPage />} />
                    <Route path="/doctors/:id" element={<DoctorDetailPage />} />
                    <Route
                        path="/patient/payment/khalti/success"
                        element={(
                            <RoleRoute allowedRoles={['patient']}>
                                <AppointmentPaymentReturnPage mode="success" provider="khalti" />
                            </RoleRoute>
                        )}
                    />
                    <Route
                        path="/patient/payment/khalti/failure"
                        element={(
                            <RoleRoute allowedRoles={['patient']}>
                                <AppointmentPaymentReturnPage mode="failure" provider="khalti" />
                            </RoleRoute>
                        )}
                    />
                    <Route
                        path="/patient"
                        element={(
                            <RoleRoute allowedRoles={['patient']}>
                                <PatientLayout />
                            </RoleRoute>
                        )}
                    >
                        <Route index element={<Navigate to="/patient/overview" replace />} />
                        <Route path="dashboard" element={<Navigate to="/patient/overview" replace />} />
                        <Route path="overview" element={<PatientDashboard />} />
                        <Route path="appointments" element={<PatientAppointmentsPage />} />
                        <Route path="care-plans" element={<PatientCarePlansPage />} />
                    </Route>
                    <Route
                        path="/doctor"
                        element={(
                            <RoleRoute allowedRoles={['doctor']}>
                                <DoctorLayout />
                            </RoleRoute>
                        )}
                    >
                        <Route index element={<Navigate to="/doctor/overview" replace />} />
                        <Route path="dashboard" element={<Navigate to="/doctor/overview" replace />} />
                        <Route path="overview" element={<DoctorDashboard />} />
                        <Route path="appointments" element={<DoctorAppointmentsPage />} />
                        <Route path="appointments/:id" element={<DoctorAppointmentDetailPage />} />
                        <Route path="patients" element={<DoctorPatientsPage />} />
                        <Route path="patients/:patientId/record" element={<DoctorPatientRecordPage />} />
                        <Route path="care-plans" element={<DoctorCarePlansPage />} />
                        <Route path="care-plan-requests" element={<DoctorCarePlanRequestsPage />} />
                        <Route path="schedule" element={<DoctorSchedulePage />} />
                    </Route>
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/google/doctor-onboarding" element={<GoogleDoctorOnboardingPage />} />
                    <Route path="/init-superadmin" element={<InitSuperadmin />} />
                    <Route
                        path="/admin"
                        element={
                            <SuperadminRoute>
                                <AdminLayout />
                            </SuperadminRoute>
                        }
                    >
                        <Route index element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="users" element={<Navigate to="/admin/doctors" replace />} />
                        <Route path="doctors" element={<AdminDoctorsPage />} />
                        <Route path="care-plans" element={<AdminCarePlansPage />} />
                        <Route path="care-plan-requests" element={<AdminCarePlanRequestsPage />} />
                        <Route path="patients" element={<AdminPatientsPage />} />
                    </Route>
                    <Route
                        path="*"
                        element={
                            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                                <h1 className="text-4xl font-bold text-white">Page not found</h1>
                                <a
                                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 px-5 py-2.5 font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-400/30"
                                    href="/"
                                >
                                    Go home
                                </a>
                            </div>
                        }
                    />
                </Routes>
            </MainLayout>
        </BrowserRouter>
    );
}

export default App;
