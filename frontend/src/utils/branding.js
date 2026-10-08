export const APP_NAME = 'CirrusLabs TalentHub'
export const APP_SHORT_NAME = 'CL'
export const COMPANY_DOMAIN = 'cirruslabs.io'

const ROLE_META = {
  employee: {
    label: 'Employee',
    shortLabel: 'Employee',
    portalHeading: 'Internal Talent & Mobility Platform',
    navbarTitle: 'Internal Talent & Mobility Platform',
    navbarSubtitle: 'Discover internal opportunities, track referrals, and grow your career',
  },
  hiring_manager: {
    label: 'Hiring Manager',
    shortLabel: 'Hiring',
    portalHeading: 'CirrusLabs Hiring Workspace',
    navbarTitle: 'CirrusLabs Hiring Workspace',
    navbarSubtitle: 'Review referrals, manage positions, and approve referral bonuses',
  },
}

export function getRoleMeta(role) {
  return ROLE_META[role] || ROLE_META.employee
}

export function getRoleLabel(role) {
  return getRoleMeta(role).label
}
