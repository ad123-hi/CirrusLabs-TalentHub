const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    let message = 'Request failed.'

    try {
      const errorData = await response.json()
      message = errorData.detail || message
    } catch {
      message = response.statusText || message
    }

    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export async function loginUser({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function registerUser({ name, email, password, phone = '', company = '' }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, phone, company }),
  })
}

export async function loginWithSSO({ email, name = '', provider = 'cirrus-sso' }) {
  return request('/auth/sso-login', {
    method: 'POST',
    body: JSON.stringify({ email, name, provider }),
  })
}

export async function getSSOConfig() {
  return request('/auth/sso/config')
}

export const SSO_LOGIN_URL = `${API_BASE_URL}/auth/sso/login`

export async function getCurrentUser() {
  return request('/auth/me')
}

export async function logoutUser() {
  return request('/auth/logout', {
    method: 'POST',
  })
}

export async function getJobs(filters = {}) {
  const params = new URLSearchParams()
  if (filters.searchTerm) params.set('search_term', filters.searchTerm)
  if (filters.location) params.set('location', filters.location)
  const query = params.toString()
  return request(`/employee/jobs${query ? `?${query}` : ''}`)
}

export async function getJobById(id) {
  return request(`/employee/jobs/${id}`)
}

export async function applyToJob(jobId) {
  return request(`/employee/jobs/${jobId}/apply`, {
    method: 'POST',
  })
}

export async function getCandidateApplications() {
  return request('/employee/applications')
}

export async function createReferral(jobId, payload) {
  return request(`/employee/jobs/${jobId}/referrals`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getMyReferrals() {
  return request('/employee/referrals')
}

export async function getReferralById(referralId) {
  return request(`/employee/referrals/${referralId}`)
}

export async function generateInterviewPlanner(jobId, payload) {
  return request(`/employee/jobs/${jobId}/planner`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getCandidateProfile() {
  return request('/employee/profile')
}

export async function updateCandidateProfile(payload) {
  return request('/employee/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function getRecruiterJobs() {
  return request('/recruiter/jobs')
}

export async function createRecruiterJob(payload) {
  return request('/recruiter/jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateRecruiterJob(jobId, payload) {
  return request(`/recruiter/jobs/${jobId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteRecruiterJob(jobId) {
  return request(`/recruiter/jobs/${jobId}`, {
    method: 'DELETE',
  })
}

export async function getApplicants(jobId) {
  return request(`/recruiter/jobs/${jobId}/applicants`)
}

export async function updateApplicationStatus(applicationId, status) {
  return request(`/recruiter/applications/${applicationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function getRecruiterProfile() {
  return request('/recruiter/profile')
}

export async function updateRecruiterProfile(payload) {
  return request('/recruiter/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function getRecruiterReferrals() {
  return request('/recruiter/referrals')
}

export async function getRecruiterReferralById(referralId) {
  return request(`/recruiter/referrals/${referralId}`)
}

export async function updateReferralStatus(referralId, referral_status) {
  return request(`/recruiter/referrals/${referralId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ referral_status }),
  })
}

export async function updateReferralJoining(referralId, joining_date) {
  return request(`/recruiter/referrals/${referralId}/joining`, {
    method: 'PATCH',
    body: JSON.stringify({ joining_date }),
  })
}

export async function approveReferralBonus(referralId, bonus_amount) {
  return request(`/recruiter/referrals/${referralId}/bonus/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ bonus_amount }),
  })
}

export async function rejectReferralBonus(referralId, bonus_amount) {
  return request(`/recruiter/referrals/${referralId}/bonus/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ bonus_amount }),
  })
}

export async function markReferralBonusPaid(referralId) {
  return request(`/recruiter/referrals/${referralId}/bonus/paid`, {
    method: 'PATCH',
  })
}
