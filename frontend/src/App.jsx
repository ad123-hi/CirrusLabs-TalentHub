import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/auth/Login.jsx'
import SSOCallback from './pages/auth/SSOCallback.jsx'
import CandidateLayout from './pages/candidate/CandidateLayout.jsx'
import CandidateDashboard from './pages/candidate/Dashboard.jsx'
import Jobs from './pages/candidate/Jobs.jsx'
import JobDetails from './pages/candidate/JobDetails.jsx'
import MyApplications from './pages/candidate/MyApplications.jsx'
import InterviewPlanner from './pages/candidate/InterviewPlanner.jsx'
import CandidateProfile from './pages/candidate/Profile.jsx'
import MyReferrals from './pages/candidate/MyReferrals.jsx'
import ReferralDetails from './pages/candidate/ReferralDetails.jsx'
import ReferColleague from './pages/candidate/ReferColleague.jsx'
import RecruiterLayout from './pages/recruiter/RecruiterLayout.jsx'
import RecruiterDashboard from './pages/recruiter/Dashboard.jsx'
import PostJob from './pages/recruiter/PostJob.jsx'
import ManageJobs from './pages/recruiter/ManageJobs.jsx'
import Applicants from './pages/recruiter/Applicants.jsx'
import RecruiterProfile from './pages/recruiter/Profile.jsx'
import RecruiterReferrals from './pages/recruiter/Referrals.jsx'
import RecruiterReferralDetails from './pages/recruiter/ReferralDetails.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/sso/callback" element={<SSOCallback />} />

      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRole="employee">
            <CandidateLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CandidateDashboard />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:id" element={<JobDetails />} />
        <Route path="jobs/:id/refer" element={<ReferColleague />} />
        <Route path="applications" element={<MyApplications />} />
        <Route path="referrals" element={<MyReferrals />} />
        <Route path="referrals/:id" element={<ReferralDetails />} />
        <Route path="planner/:jobId" element={<InterviewPlanner />} />
        <Route path="profile" element={<CandidateProfile />} />
      </Route>

      <Route
        path="/recruiter"
        element={
          <ProtectedRoute allowedRole="hiring_manager">
            <RecruiterLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<RecruiterDashboard />} />
        <Route path="jobs/create" element={<PostJob />} />
        <Route path="jobs" element={<ManageJobs />} />
        <Route path="jobs/:id/applicants" element={<Applicants />} />
        <Route path="referrals" element={<RecruiterReferrals />} />
        <Route path="referrals/:id" element={<RecruiterReferralDetails />} />
        <Route path="profile" element={<RecruiterProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
