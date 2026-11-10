export type LevelId = 'verified' | 'trusted' | 'respected' | 'distinguished' | 'exemplary';
export const LEVELS: LevelId[] = ['verified', 'trusted', 'respected', 'distinguished', 'exemplary'];
export type Role = 'homeowner' | 'company' | 'admin';
export type Plan = 'app' | 'half_page' | 'full_page';

export interface Profile {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  role: Role;
}

export interface PublicCompany {
  id: string;
  name: string;
  owner_name: string | null;
  category: string;
  service_areas: string[];
  phone: string | null;
  website: string | null;
  about: string | null;
  logo: string | null;
  photos: string[] | null;
  level: LevelId;
  level_rank: number;
  years_on_list: number;
}

export interface Company extends PublicCompany {
  owner_user_id: string | null;
  email: string | null;
  status: 'invited' | 'pending' | 'live' | 'paused';
  plan: Plan;
  billing_status: string;
  payouts_ready: boolean;
  editors_guide_client: boolean;
  insurance_expires: string | null;
}

export interface Applicant {
  id: string;
  invite_token: string;
  status: 'invited' | 'submitted' | 'approved' | 'declined';
  applicant_user_id: string | null;
  name: string;
  owner_name: string | null;
  category: string | null;
  service_areas: string[];
  phone: string | null;
  email: string | null;
  website: string | null;
  about: string | null;
  license_number: string | null;
  license_file: string | null;
  insurance_file: string | null;
  insurance_expires: string | null;
  plan: Plan;
  editors_guide_client: boolean;
  referred_by: string | null;
  rating_source: string;
  rating: number | null;
  review_count: number | null;
  license_on_file: boolean;
  insurance_on_file: boolean;
  certificate_requested: boolean;
  admin_notes: string | null;
  created_at: string;
}

export interface Settings {
  level_names: Record<LevelId, string>;
  level_descriptions: Record<LevelId, string>;
  categories: { name: string; on: boolean }[];
  areas: string[];
  auto_charge_hours: number;
  reminder_days: number[];
  starting_level_rule: { default: LevelId; editors_guide_client: LevelId };
  level_rules: Record<string, unknown>;
}

export const DEFAULT_SETTINGS: Settings = {
  level_names: { verified: 'Verified', trusted: 'Trusted', respected: 'Respected', distinguished: 'Distinguished', exemplary: 'Exemplary' },
  level_descriptions: {
    verified: 'License and insurance checked before joining.',
    trusted: 'A record of paid jobs and good reviews on MeritWorx.',
    respected: 'Consistently strong reviews over time.',
    distinguished: 'Top ratings across many completed jobs.',
    exemplary: 'The highest standard of work and service on MeritWorx.',
  },
  categories: [],
  areas: [],
  auto_charge_hours: 48,
  reminder_days: [1, 3, 7],
  starting_level_rule: { default: 'verified', editors_guide_client: 'respected' },
  level_rules: {},
};

export const PLAN_LABELS: Record<Plan, string> = {
  app: 'App listing',
  half_page: 'Half Page (Editor’s Guide)',
  full_page: 'Full Page (Editor’s Guide)',
};

// One place to change the vetting line shown on every company profile.
export const VETTING_LINE = 'License and insurance checked by Editor’s Guide';
