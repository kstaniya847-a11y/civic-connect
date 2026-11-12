import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Bell,
  Building2,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Filter,
  LayoutDashboard,
  LogIn,
  MapPinned,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCircle2,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import L from 'leaflet'

import 'leaflet/dist/leaflet.css'

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const demoIssues = [
  {
    id: 'ISS-2048',
    title: 'Garbage accumulation near school gate',
    category: 'garbage',
    status: 'Under Review',
    priority: 'High',
    support: 24,
    supporters: 24,
    latitude: 28.6139,
    longitude: 77.209,
    description: 'Large piles of mixed waste have accumulated beside the school gate, causing blocked footpath access.',
    created_at: '2026-11-12T10:30:00Z',
    image_url: 'https://images.pexels.com/photos/11553984/pexels-photo-11553984.jpeg?auto=compress&cs=tinysrgb&w=900',
    ai_summary: 'Garbage accumulation detected near a school zone.',
  },
  {
    id: 'ISS-2051',
    title: 'Pothole endangering motorists',
    category: 'pothole',
    status: 'Assigned',
    priority: 'Critical',
    support: 31,
    supporters: 31,
    latitude: 28.6204,
    longitude: 77.211,
    description: 'Deep pothole near the bus stop is damaging vehicles and creating unsafe driving conditions.',
    created_at: '2026-11-12T08:00:00Z',
    image_url: 'https://images.pexels.com/photos/11849379/pexels-photo-11849379.jpeg?auto=compress&cs=tinysrgb&w=900',
    ai_summary: 'Severe road defect with risk to traffic safety.',
  },
  {
    id: 'ISS-2057',
    title: 'Draining blockage after rain',
    category: 'blocked-drainage',
    status: 'In Progress',
    priority: 'High',
    support: 19,
    supporters: 19,
    latitude: 28.6087,
    longitude: 77.2043,
    description: 'Stormwater is pooling on the road because the roadside drainage is blocked by waste and silt.',
    created_at: '2026-11-11T15:40:00Z',
    image_url: 'https://images.pexels.com/photos/38239813/pexels-photo-38239813.jpeg?auto=compress&cs=tinysrgb&w=900',
    ai_summary: 'Blocked drainage likely due to debris accumulation.',
  },
  {
    id: 'ISS-2062',
    title: 'Streetlight outage near park',
    category: 'broken-streetlight',
    status: 'Resolved',
    priority: 'Medium',
    support: 12,
    supporters: 12,
    latitude: 28.6158,
    longitude: 77.2182,
    description: 'Broken streetlight is leaving the park side path unsafe after dusk.',
    created_at: '2026-11-10T12:00:00Z',
    image_url: 'https://images.pexels.com/photos/9953451/pexels-photo-9953451.jpeg?auto=compress&cs=tinysrgb&w=900',
    ai_summary: 'The affected lighting circuit has been repaired and validated.',
  },
  {
    id: 'ISS-2068',
    title: 'Water leakage from public pipe',
    category: 'water-leakage',
    status: 'Verified',
    priority: 'High',
    support: 27,
    supporters: 27,
    latitude: 28.6069,
    longitude: 77.2081,
    description: 'Water is continuously leaking from a municipal pipe, creating puddles and risk of damage to the pavement.',
    created_at: '2026-11-12T05:30:00Z',
    image_url: 'https://images.pexels.com/photos/32200999/pexels-photo-32200999.jpeg?auto=compress&cs=tinysrgb&w=900',
    ai_summary: 'Water leakage is active with visible pavement weakening.',
  },
  {
    id: 'ISS-2074',
    title: 'Damaged public bench in community park',
    category: 'public-property',
    status: 'Assigned',
    priority: 'Medium',
    support: 14,
    supporters: 14,
    latitude: 28.6114,
    longitude: 77.2141,
    description: 'A broken public bench and damaged park railings have not been repaired despite repeated community complaints.',
    created_at: '2026-11-09T09:10:00Z',
    image_url: 'https://images.pexels.com/photos/7078287/pexels-photo-7078287.jpeg?auto=compress&cs=tinysrgb&w=900',
    ai_summary: 'Public infrastructure damage observed in a community space with moderate safety risk.',
  },
]

const demoStats = {
  total_issues: 5,
  pending_issues: 4,
  resolved_issues: 1,
  critical_issues: 1,
  active_volunteers: 3,
  average_resolution_time: '4.3 days',
  category_counts: {
    garbage: 1,
    pothole: 1,
    'blocked-drainage': 1,
    'broken-streetlight': 1,
    'water-leakage': 1,
  },
  priority_counts: {
    Critical: 1,
    High: 3,
    Medium: 1,
    Low: 0,
  },
}

const priorityColors = {
  Critical: '#ef4444',
  High: '#f59e0b',
  Medium: '#3b82f6',
  Low: '#10b981',
}

const categoryLabel = {
  garbage: 'Garbage',
  pothole: 'Pothole',
  'water-leakage': 'Water Leakage',
  'blocked-drainage': 'Blocked Drainage',
  'broken-streetlight': 'Broken Streetlight',
  'public-property': 'Public Property',
}

const categoryVisuals = {
  garbage: {
    imageUrl: 'https://images.pexels.com/photos/11553984/pexels-photo-11553984.jpeg?auto=compress&cs=tinysrgb&w=900',
    description: 'Overflowing dustbins and unmanaged waste in public spaces.',
  },
  pothole: {
    imageUrl: 'https://images.pexels.com/photos/11849379/pexels-photo-11849379.jpeg?auto=compress&cs=tinysrgb&w=900',
    description: 'Damaged roads and potholes creating traffic hazards.',
  },
  'water-leakage': {
    imageUrl: 'https://images.pexels.com/photos/32200999/pexels-photo-32200999.jpeg?auto=compress&cs=tinysrgb&w=900',
    description: 'Leaking pipes and water wastage on streets and sidewalks.',
  },
  'blocked-drainage': {
    imageUrl: 'https://images.pexels.com/photos/38239813/pexels-photo-38239813.jpeg?auto=compress&cs=tinysrgb&w=900',
    description: 'Blocked drains and waterlogging after rain.',
  },
  'broken-streetlight': {
    imageUrl: 'https://images.pexels.com/photos/9953451/pexels-photo-9953451.jpeg?auto=compress&cs=tinysrgb&w=900',
    description: 'Non-functional streetlighting affecting roads and parks.',
  },
  'public-property': {
    imageUrl: 'https://images.pexels.com/photos/7078287/pexels-photo-7078287.jpeg?auto=compress&cs=tinysrgb&w=900',
    description: 'Damaged benches, park infrastructure, and civic amenities.',
  },
}

const categoryOptions = Object.entries(categoryVisuals).map(([value, meta]) => ({
  value,
  label: categoryLabel[value] || value,
  description: meta.description,
  imageUrl: meta.imageUrl,
}))

const statusOrder = ['Submitted', 'Under Review', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Closed']

const getIssueImage = (issue) => issue?.image_url || categoryVisuals[issue?.category]?.imageUrl || categoryVisuals.garbage.imageUrl

const handleIssueImageError = (event, issue) => {
  const fallback = categoryVisuals[issue?.category]?.imageUrl || categoryVisuals.garbage.imageUrl
  if (event.currentTarget.src !== fallback) {
    event.currentTarget.src = fallback
  }
}

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const createMarkerIcon = (priority) =>
  new L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${priorityColors[priority] || '#0f172a'}; width:18px; height:18px; border-radius:9999px; border:3px solid white; box-shadow:0 8px 18px rgba(15, 23, 42, 0.2);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })

function App() {
  const [issues, setIssues] = useState([])
  const [stats, setStats] = useState(demoStats)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('civicconnect-user')) || null
    } catch {
      return null
    }
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [issuesResponse, statsResponse] = await Promise.all([
          axios.get(`${apiBase}/api/issues`),
          axios.get(`${apiBase}/api/dashboard/stats`),
        ])
        setIssues(issuesResponse.data)
        setStats(statsResponse.data)
      } catch (error) {
        console.error('Falling back to demo data:', error)
        setIssues(demoIssues)
        setStats(demoStats)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleIssueCreated = (issue) => {
    setIssues((current) => [issue, ...current.filter((item) => item.id !== issue.id)])
    axios.get(`${apiBase}/api/dashboard/stats`).then((response) => setStats(response.data)).catch((error) => console.error('Could not refresh dashboard stats:', error))
  }

  const handleIssueUpdated = (updatedIssue) => {
    setIssues((current) => current.map((item) => item.id === updatedIssue.id ? updatedIssue : item))
    axios.get(`${apiBase}/api/dashboard/stats`).then((response) => setStats(response.data)).catch((error) => console.error('Could not refresh dashboard stats:', error))
  }

  const handleLogin = (authUser, token) => {
    localStorage.setItem('civicconnect-user', JSON.stringify(authUser))
    localStorage.setItem('civicconnect-token', token)
    setUser(authUser)
  }

  const handleLogout = () => {
    localStorage.removeItem('civicconnect-user')
    localStorage.removeItem('civicconnect-token')
    setUser(null)
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-100 text-slate-800">
        <AppShell issues={issues} stats={stats} loading={loading} user={user} onLogin={handleLogin} onLogout={handleLogout} onIssueCreated={handleIssueCreated} onIssueUpdated={handleIssueUpdated} />
      </div>
    </BrowserRouter>
  )
}

function AppShell({ issues, stats, loading, user, onLogin, onLogout, onIssueCreated, onIssueUpdated }) {
  const navItems = [
    { label: 'Home', to: '/', icon: Sparkles },
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Report', to: '/report', icon: ClipboardList },
    { label: 'Community', to: '/issues', icon: Users },
    { label: 'Map', to: '/map', icon: MapPinned },
    { label: 'Volunteer', to: '/volunteer', icon: Wrench },
    { label: 'Admin', to: '/admin', icon: ShieldCheck },
    { label: 'Profile', to: '/profile', icon: UserCircle2 },
  ]

  return (
    <>
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-700 to-teal-500 text-lg font-bold text-white shadow-md shadow-sky-600/20">
              C
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">CivicConnect</div>
              <div className="text-xs text-slate-500">Report. Connect. Collaborate. Resolve.</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-sky-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button className="hidden rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-600 sm:inline-flex">
              <Bell size={16} />
            </button>
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden text-right md:block">
                  <div className="text-sm font-medium text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.role}</div>
                </div>
                <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-sky-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-800">
                <LogIn size={16} />
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage onLogin={onLogin} user={user} />} />
          <Route path="/dashboard" element={<DashboardPage issues={issues} stats={stats} loading={loading} />} />
          <Route path="/report" element={<ReportIssuePage onIssueCreated={onIssueCreated} />} />
          <Route path="/issues" element={<CommunityIssuesPage issues={issues} />} />
          <Route path="/issues/:issueId" element={<IssueDetailsPage issues={issues} onIssueUpdated={onIssueUpdated} />} />
          <Route path="/map" element={<MapPage issues={issues} />} />
          <Route path="/volunteer" element={<VolunteerDashboard issues={issues} />} />
          <Route path="/admin" element={<AdminDashboard issues={issues} stats={stats} onIssueUpdated={onIssueUpdated} />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="*" element={<div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">Page not found. <Link to="/" className="font-medium text-sky-700">Return home</Link></div>} />
        </Routes>
      </main>
    </>
  )
}

function LandingPage() {
  const highlights = [
    { label: 'AI detection', value: '93%', icon: Sparkles },
    { label: 'Volunteers engaged', value: '2.8k', icon: Users },
    { label: 'Avg. resolution', value: '4.3 days', icon: TrendingUp },
  ]

  return (
    <div className="space-y-16 pb-10">
      <section className="grid gap-10 overflow-hidden rounded-[32px] bg-gradient-to-br from-sky-950 via-sky-900 to-teal-700 p-8 text-white shadow-xl shadow-sky-900/25 lg:grid-cols-[1.2fr_0.8fr] lg:p-12">
        <div className="space-y-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium tracking-[0.2em] text-sky-100 uppercase">
            <CheckCircle2 size={14} />
            Civic intelligence platform
          </span>
          <div className="space-y-4">
            <h1 className="max-w-xl text-4xl font-bold tracking-tight lg:text-6xl">
              Together, Let&apos;s Build Better Communities.
            </h1>
            <p className="max-w-lg text-base text-sky-100/90 lg:text-lg">
              Report local problems, spot duplicates using AI, mobilize volunteers, and track community fixes from submission to resolution.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/report" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-medium text-sky-900 shadow-lg shadow-sky-900/10 transition hover:-translate-y-0.5">
              Report an Issue
              <ArrowRight size={18} />
            </Link>
            <Link to="/issues" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-sky-800/30 px-5 py-3 font-medium text-white transition hover:bg-sky-800/60">
              Explore Community
            </Link>
          </div>
          <div className="grid max-w-xl grid-cols-3 gap-4 pt-3">
            {highlights.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <Icon size={20} className="mb-2 text-teal-300" />
                <div className="text-2xl font-semibold">{value}</div>
                <div className="text-xs text-sky-100/80">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/10 p-5 shadow-2xl shadow-sky-950/30 backdrop-blur-sm">
            <div className="space-y-4 rounded-2xl bg-white p-4 text-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Live Feed</p>
                  <h3 className="text-xl font-semibold text-slate-900">Metro Ward 12</h3>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Operational</span>
              </div>
              <div className="space-y-3">
                {[
                  ['Garbage', 'High', '24 supporters'],
                  ['Pothole', 'Critical', '31 supporters'],
                  ['Water leak', 'High', '27 supporters'],
                ].map(([name, priority, meta]) => (
                  <div key={name} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <div>
                      <div className="font-medium text-slate-800">{name}</div>
                      <div className="text-xs text-slate-500">{meta}</div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {priority}
                    </span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-gradient-to-r from-sky-50 to-teal-50 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Resolution timeline</div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Submitted → Assigned → Resolved
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          {
            title: 'How It Works',
            description: 'Residents report issues with photos, AI classifies them, and duplicate threats are filtered before submission.',
            icon: Search,
            image: categoryVisuals['garbage'].imageUrl,
          },
          {
            title: 'Features',
            description: 'Issue mapping, smart priority scoring, volunteer assignment, and transparent status tracking in one place.',
            icon: Zap,
            image: categoryVisuals['pothole'].imageUrl,
          },
          {
            title: 'Community Impact',
            description: 'Faster resolution, safer neighborhoods, and clear accountability across the public service cycle.',
            icon: Building2,
            image: categoryVisuals['water-leakage'].imageUrl,
          },
        ].map(({ title, description, icon: Icon, image }) => (
          <div key={title} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
            <img src={image} alt={title} className="h-40 w-full object-cover" />
            <div className="p-6">
              <div className="mb-5 inline-flex rounded-2xl bg-sky-100 p-3 text-sky-800">
                <Icon size={22} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">{title}</h3>
              <p className="text-sm leading-6 text-slate-600">{description}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Issue categories</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Civic challenges our communities face</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categoryOptions.map((option) => (
            <div key={option.value} className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 transition duration-200 hover:-translate-y-1 hover:shadow-md">
              <img src={option.imageUrl} alt={option.label} className="h-44 w-full object-cover transition duration-300 group-hover:scale-105" />
              <div className="p-4">
                <div className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">{option.label}</div>
                <p className="text-sm text-slate-600">{option.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Volunteer network</p>
          <h2 className="text-3xl font-bold text-slate-900">Help improve the places you live, work, and spend time.</h2>
          <p className="mt-4 max-w-xl text-slate-600">
            Volunteers can accept nearby tasks, upload evidence, and help track improvement milestones with real-time updates for citizens.
          </p>
          <ul className="mt-6 space-y-4">
            {['Nearby issue discovery', 'Task acceptance and status tracking', 'Community points and recognition'].map((item) => (
              <li key={item} className="flex items-center gap-3 text-slate-700">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 size={16} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid gap-4">
          {[
            { title: 'Task coverage', value: '84%', tone: 'bg-sky-900' },
            { title: 'Average response', value: '2.1 hrs', tone: 'bg-teal-600' },
            { title: 'Volunteer badges', value: '126', tone: 'bg-slate-800' },
          ].map((entry) => (
            <div key={entry.title} className="rounded-2xl bg-slate-50 p-5">
              <div className={`mb-3 h-2 w-20 rounded-full ${entry.tone}`} />
              <div className="text-3xl font-bold text-slate-900">{entry.value}</div>
              <div className="text-sm text-slate-600">{entry.title}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function AuthPage({ onLogin, user }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: 'Demo Citizen',
    email: 'demo@civicconnect.com',
    password: 'civic123',
    role: 'citizen',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = mode === 'register' ? 'register' : 'login'
      const payload = mode === 'register' ? { name: form.name, email: form.email, password: form.password, role: form.role } : { email: form.email, password: form.password }
      const response = await axios.post(`${apiBase}/api/auth/${endpoint}`, payload)
      const authUser = response.data.user || { name: form.name || 'Demo Citizen', email: form.email, role: form.role }
      onLogin(authUser, response.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur-sm lg:p-10">
      <div className="grid min-w-0 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="min-w-0 rounded-[28px] bg-gradient-to-br from-sky-900 via-sky-800 to-teal-600 p-8 text-white shadow-xl shadow-sky-900/20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">Secure access</p>
          <h2 className="text-3xl font-bold leading-tight">Welcome back to CivicConnect.</h2>
          <p className="mt-4 max-w-md text-sky-100/90">
            Sign in to report local issues, track active cases, and collaborate with volunteers and public teams.
          </p>
          <div className="mt-8 space-y-4">
            {['Citizen reporting', 'Volunteer coordination', 'Admin oversight'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <BadgeCheck className="text-teal-300" size={18} />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-sky-100/70">Demo access</div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold">demo@civicconnect.com</div>
                <div className="text-sm text-sky-100/80">Password: civic123</div>
              </div>
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, email: 'demo@civicconnect.com', password: 'civic123' }))}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
              >
                Use demo
              </button>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center">
          <div className="mb-6 flex rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0 transition focus:border-sky-400" placeholder="Your full name" />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
              <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0 transition focus:border-sky-400" placeholder="name@example.com" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0 transition focus:border-sky-400" placeholder="••••••••" />
            </div>

            {mode === 'register' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
                <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0 transition focus:border-sky-400">
                  <option value="citizen">Citizen</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-sky-900 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-sky-900/20 transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? 'Signing in...' : mode === 'login' ? 'Sign in to dashboard' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function DashboardPage({ issues, stats, loading }) {
  const summaryCards = [
    { label: 'Total complaints', value: stats.total_issues ?? issues.length ?? 0, icon: ClipboardList },
    { label: 'Pending', value: stats.pending_issues ?? 0, icon: Activity },
    { label: 'Resolved', value: stats.resolved_issues ?? 0, icon: CheckCircle2 },
    { label: 'Critical', value: stats.critical_issues ?? 0, icon: CircleAlert },
  ]

  const myReports = issues.slice(0, 3)
  const nearbyIssues = issues.slice(0, 3)
  const communityActivity = [
    { title: 'Road resurfacing approved', detail: 'Ward 5 • 2 hours ago', tone: 'emerald' },
    { title: 'Volunteer team joined', detail: 'Drainage cleanup • 5 hours ago', tone: 'sky' },
    { title: 'Duplicate report merged', detail: 'Garbage issue cluster resolved', tone: 'amber' },
  ]

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">Loading dashboard...</div>
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Citizen dashboard</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Welcome back, Asha</h2>
            <p className="mt-2 text-sm text-slate-500">Here’s the current status of your neighborhood and the issues you care about most.</p>
          </div>
          <Link to="/report" className="inline-flex items-center justify-center rounded-full bg-sky-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-sky-800">
            + Report new issue
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">{label}</div>
                <div className="mt-3 text-3xl font-bold text-slate-900">{value}</div>
              </div>
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700"><Icon size={20} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">My reports</h3>
            <Link to="/issues" className="text-sm font-medium text-sky-700">View all</Link>
          </div>
          <div className="space-y-4">
            {myReports.map((issue) => (
              <div key={issue.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <div className="flex flex-col gap-3 md:flex-row">
                  <img src={getIssueImage(issue)} onError={(event) => handleIssueImageError(event, issue)} alt={`${categoryLabel[issue.category] || issue.category} issue`} className="h-28 w-full object-cover md:w-32" />
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-sky-700">{issue.id}</div>
                      <span className="rounded-full px-2 py-1 text-xs font-medium" style={{ backgroundColor: `${priorityColors[issue.priority] || '#0f172a'}20`, color: priorityColors[issue.priority] || '#0f172a' }}>
                        {issue.priority}
                      </span>
                    </div>
                    <div className="mt-2 text-lg font-semibold text-slate-900">{issue.title}</div>
                    <div className="mt-1 text-sm text-slate-500">{categoryLabel[issue.category] || issue.category} • {issue.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Recent community activity</h3>
          <div className="mt-4 space-y-3">
            {communityActivity.map((activity) => (
              <div key={activity.title} className="rounded-2xl bg-slate-50 p-4">
                <div className={`mb-3 h-2.5 w-2.5 rounded-full ${activity.tone === 'emerald' ? 'bg-emerald-500' : activity.tone === 'sky' ? 'bg-sky-500' : 'bg-amber-500'}`} />
                <div className="font-medium text-slate-800">{activity.title}</div>
                <div className="mt-1 text-sm text-slate-500">{activity.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Nearby issues</h3>
          <div className="mt-4 space-y-3">
            {nearbyIssues.map((issue) => (
              <div key={issue.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <img src={getIssueImage(issue)} onError={(event) => handleIssueImageError(event, issue)} alt={`${categoryLabel[issue.category] || issue.category} issue`} className="h-16 w-16 rounded-xl object-cover" />
                <div className="flex-1">
                  <div className="font-medium text-slate-800">{issue.title}</div>
                  <div className="text-sm text-slate-500">{categoryLabel[issue.category] || issue.category}</div>
                </div>
                <span className="rounded-full px-2 py-1 text-xs font-medium" style={{ backgroundColor: `${priorityColors[issue.priority] || '#0f172a'}20`, color: priorityColors[issue.priority] || '#0f172a' }}>
                  {issue.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Recent reports</h3>
            <Link to="/issues" className="text-sm font-medium text-sky-700">View all</Link>
          </div>
          <div className="space-y-3">
            {issues.slice(0, 4).map((issue) => (
              <div key={issue.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700">{issue.id}</span>
                    <span className="rounded-full px-2 py-1 text-xs font-medium" style={{ backgroundColor: `${priorityColors[issue.priority] || '#0f172a'}20`, color: priorityColors[issue.priority] || '#0f172a' }}>
                      {issue.priority}
                    </span>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{issue.title}</div>
                  <div className="text-sm text-slate-500">{categoryLabel[issue.category] || issue.category} • {formatDate(issue.created_at)}</div>
                </div>
                <Link to={`/issues/${issue.id}`} className="text-sm font-medium text-sky-700">
                  Open details →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReportIssuePage({ onIssueCreated }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'garbage',
    latitude: 28.6139,
    longitude: 77.209,
    reporter_name: 'Asha R.',
    image_url: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setForm((current) => ({ ...current, image_url: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const payload = {
        ...form,
        image_url: form.image_url || categoryVisuals[form.category]?.imageUrl,
      }
      const response = await axios.post(`${apiBase}/api/issues/report`, payload)
      setResult(response.data)
      onIssueCreated({ ...response.data.issue, duplicate_candidates: response.data.duplicate_candidates, priority_assessment: response.data.priority })
      navigate(`/issues/${response.data.issue.id}`)
    } catch (error) {
      console.error(error)
      setError(error.response?.data?.detail || 'Issue could not be reported. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm lg:p-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Report an issue</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">Identify and submit a community problem</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Issue title</label>
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" placeholder="Ex: Overflowing garbage near main junction" />
        </div>
        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" placeholder="Describe the issue, impact, and urgency." />
        </div>

        <div className="lg:col-span-2">
          <label className="mb-3 block text-sm font-medium text-slate-700">Select issue category</label>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setForm((current) => ({ ...current, category: option.value }))}
                className={`overflow-hidden rounded-2xl border text-left transition ${form.category === option.value ? 'border-sky-700 bg-sky-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <img src={option.imageUrl} alt={`${option.label} visual`} className="h-24 w-full object-cover" />
                <div className="space-y-1 p-3">
                  <div className="font-semibold text-slate-900">{option.label}</div>
                  <div className="text-xs text-slate-600">{option.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Reporter</label>
          <input value={form.reporter_name} onChange={(event) => setForm({ ...form, reporter_name: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Upload reference photo</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Latitude</label>
          <input value={form.latitude} onChange={(event) => setForm({ ...form, latitude: Number(event.target.value) })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Longitude</label>
          <input value={form.longitude} onChange={(event) => setForm({ ...form, longitude: Number(event.target.value) })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
        </div>

        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 text-sm font-medium text-slate-700">AI image preview</div>
          {form.image_url ? (
            <img src={form.image_url} alt="Uploaded civic issue preview" className="h-56 w-full rounded-2xl object-cover" />
          ) : (
            <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
              No image uploaded yet. The selected category example will be used until a citizen photo is attached.
            </div>
          )}
        </div>

        <div className="lg:col-span-2 flex items-center justify-between rounded-2xl bg-sky-50 p-4">
          <div>
            <div className="text-sm font-medium text-slate-700">AI demo mode is active</div>
            <div className="text-xs text-slate-500">Classification, duplicate detection, and priority scoring are being suggested automatically.</div>
          </div>
          <button type="submit" disabled={submitting} className="rounded-full bg-sky-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {submitting ? 'Submitting...' : 'Submit issue'}
          </button>
        </div>
      </form>

      {error && <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {result && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Issue submitted successfully. Duplicate checks and AI scoring were completed.
        </div>
      )}
    </div>
  )
}

function CommunityIssuesPage({ issues }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    if (!query) return issues
    return issues.filter((issue) => `${issue.title} ${issue.category}`.toLowerCase().includes(query.toLowerCase()))
  }, [issues, query])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Community issues</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Neighborhood problem tracker</h2>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-3.5 text-slate-400" size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search issue or category" className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm" />
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.map((issue) => (
          <div key={issue.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <img src={getIssueImage(issue)} onError={(event) => handleIssueImageError(event, issue)} alt={`${categoryLabel[issue.category] || issue.category} issue`} className="h-40 w-full rounded-2xl object-cover md:w-56" />
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700">{issue.id}</span>
                  <span className="rounded-full px-2 py-1 text-xs font-medium" style={{ backgroundColor: `${priorityColors[issue.priority] || '#0f172a'}20`, color: priorityColors[issue.priority] || '#0f172a' }}>
                    {issue.priority}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{categoryLabel[issue.category] || issue.category}</span>
                </div>
                <Link to={`/issues/${issue.id}`} className="text-xl font-semibold text-slate-900 hover:text-sky-700">{issue.title}</Link>
                <p className="text-sm text-slate-600">{issue.description}</p>
              </div>
              <div className="min-w-[150px] text-left md:text-right">
                <div className="text-sm text-slate-500">{issue.status}</div>
                <div className="mt-2 text-sm font-medium text-slate-700">{issue.supporters ?? issue.support} supporters</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MapPage({ issues }) {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Interactive map</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Live civic issue map</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <Filter size={16} />
          Filters
        </div>
      </div>

      <div className="h-[520px] overflow-hidden rounded-[24px] border border-slate-200">
        <MapContainer center={[28.6139, 77.209]} zoom={12} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {issues.map((issue) => (
            <Marker key={issue.id} position={[issue.latitude, issue.longitude]} icon={createMarkerIcon(issue.priority)}>
              <Popup>
                <div className="space-y-2">
                  <img src={getIssueImage(issue)} onError={(event) => handleIssueImageError(event, issue)} alt={`${categoryLabel[issue.category] || issue.category} issue map preview`} className="h-20 w-full rounded-lg object-cover" />
                  <div className="font-semibold text-slate-900">{issue.title}</div>
                  <div className="text-xs text-slate-600">{categoryLabel[issue.category] || issue.category}</div>
                  <div className="text-xs text-slate-500">Status: {issue.status}</div>
                  <Link to={`/issues/${issue.id}`} className="text-xs font-medium text-sky-700">View details</Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

function IssueDetailsPage({ issues, onIssueUpdated }) {
  const { issueId } = useParams()
  const [supporting, setSupporting] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const issue = issues.find((item) => item.id === issueId)

  if (!issue) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">Issue not found.</div>
  }

  const handleSupport = async () => {
    setSupporting(true)
    setActionMessage('')
    try {
      const response = await axios.post(`${apiBase}/api/issues/${issue.id}/support`, { user_name: 'Community member' })
      onIssueUpdated({ ...issue, supporters: response.data.supporters })
      setActionMessage('Your support has been recorded.')
    } catch (error) {
      setActionMessage(error.response?.data?.detail || 'Could not record support. Please try again.')
    } finally {
      setSupporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">{issue.id}</span>
          <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: `${priorityColors[issue.priority] || '#0f172a'}20`, color: priorityColors[issue.priority] || '#0f172a' }}>
            {issue.priority}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{categoryLabel[issue.category] || issue.category}</span>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
              <img src={getIssueImage(issue)} onError={(event) => handleIssueImageError(event, issue)} alt={`${categoryLabel[issue.category] || issue.category} issue photograph`} className="h-[320px] w-full object-cover" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-slate-900">{issue.title}</h2>
            <p className="mt-4 text-slate-600">{issue.description}</p>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-700">AI summary</div>
              <p className="mt-2 text-sm text-slate-600">{issue.ai_summary || 'AI model suggests a likely civic condition and priority score.'}</p>
              {issue.priority_assessment && <p className="mt-2 text-sm text-slate-600">Suggested priority: {issue.priority_assessment.priority} (score {issue.priority_assessment.score})</p>}
              {issue.duplicate_candidates?.length > 0 && <div role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Potential duplicates found: {issue.duplicate_candidates.map((candidate) => `${candidate.id} — ${candidate.title}`).join('; ')}</div>}
            </div>
          </div>

          <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Status</span>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">{issue.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Supporters</span>
              <span className="font-medium text-slate-800">{issue.supporters ?? issue.support ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Location</span>
              <span className="font-medium text-slate-800">{issue.latitude}, {issue.longitude}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Reported</span>
              <span className="font-medium text-slate-800">{formatDate(issue.created_at)}</span>
            </div>
            <button onClick={handleSupport} disabled={supporting} className="mt-2 w-full rounded-full bg-sky-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60">
              {supporting ? 'Recording support...' : 'Support this issue'}
            </button>
            {actionMessage && <p role="status" className="text-sm text-slate-600">{actionMessage}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Resolution timeline</h3>
        <div className="mt-6 space-y-4">
          {(issue.timeline || statusOrder.map((status) => ({ status, timestamp: new Date().toISOString(), note: status === issue.status ? 'Current state' : 'Related update' }))).map((step, index) => (
            <div key={`${step.status}-${index}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`h-4 w-4 rounded-full ${step.status === issue.status ? 'bg-sky-700' : 'bg-slate-300'}`} />
                {index < (issue.timeline || []).length - 1 && <div className="mt-2 h-12 w-px bg-slate-200" />}
              </div>
              <div className="flex-1 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-medium text-slate-800">{step.status}</div>
                  <div className="text-xs text-slate-500">{formatDate(step.timestamp)}</div>
                </div>
                <div className="mt-2 text-sm text-slate-600">{step.note || 'Issue updated by community operations.'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function VolunteerDashboard({ issues }) {
  const [tasks, setTasks] = useState([
    { task: 'Drainage cleanup in Ward 12', issueId: 'ISS-2057', taskId: 'TASK-12', status: 'In Progress', location: 'Ward 12' },
    { task: 'Road hazard inspection', issueId: 'ISS-2051', taskId: 'TASK-15', status: 'Assigned', location: 'Ward 5' },
  ])
  const [taskError, setTaskError] = useState('')
  const acceptTask = async (taskId) => {
    setTaskError('')
    try {
      const response = await axios.post(`${apiBase}/api/volunteers/tasks/${taskId}/accept`)
      setTasks((current) => current.map((task) => task.taskId === taskId ? { ...task, status: response.data.task.status } : task))
    } catch (error) {
      setTaskError(error.response?.data?.detail || 'Could not accept this task.')
    }
  }

  const badges = ['Waste Hero', 'Safety Champion', 'Rapid Responder']
  const stats = [
    { label: 'Open tasks', value: '04' },
    { label: 'Accepted', value: '02' },
    { label: 'Points', value: '420' },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Volunteer dashboard</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Community impact center</h2>
          </div>
          <div className="flex items-center gap-3 rounded-full bg-slate-100 px-3 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-700 to-teal-500 text-sm font-semibold text-white">NM</div>
            <div>
              <div className="text-sm font-medium text-slate-900">Neha M.</div>
              <div className="text-xs text-slate-500">Cleanup Volunteer</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">{item.label}</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Open tasks</h3>
          {taskError && <p role="alert" className="mt-3 text-sm text-red-700">{taskError}</p>}
          <div className="mt-4 space-y-4">
            {tasks.map(({ task, issueId, taskId, status, location }) => {
              const issue = issues.find((item) => item.id === issueId)
              return (
                <div key={taskId} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3 p-2">
                    <img src={getIssueImage(issue)} onError={(event) => handleIssueImageError(event, issue)} alt={`${categoryLabel[issue?.category] || 'issue'} volunteer task`} className="h-24 w-24 rounded-xl object-cover" />
                    <div className="flex flex-1 flex-col gap-2 pr-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-slate-800">{task}</div>
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">{status}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>Issue {issueId}</span>
                        <span>{location}</span>
                      </div>
                      <button onClick={() => acceptTask(taskId)} disabled={status === 'Accepted'} className="mt-1 inline-flex w-fit rounded-full bg-sky-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-60">{status === 'Accepted' ? 'Task accepted' : 'Accept task'}</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Volunteer profile</h3>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Badges</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span key={badge} className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">{badge}</span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Impact progress</span>
                <span>72%</span>
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-slate-200">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-sky-700 to-teal-500" style={{ width: '72%' }} />
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Nearby issues</div>
              <div className="mt-3 space-y-3">
                {issues.slice(0, 3).map((issue) => (
                  <div key={issue.id} className="flex items-center gap-3 rounded-2xl bg-white p-2">
                    <img src={getIssueImage(issue)} onError={(event) => handleIssueImageError(event, issue)} alt={`${categoryLabel[issue.category] || issue.category} issue`} className="h-12 w-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-slate-800">{issue.title}</div>
                      <div className="text-xs text-slate-500">{categoryLabel[issue.category] || issue.category}</div>
                    </div>
                    <span className="rounded-full px-2 py-1 text-[10px] font-medium" style={{ backgroundColor: `${priorityColors[issue.priority] || '#0f172a'}20`, color: priorityColors[issue.priority] || '#0f172a' }}>
                      {issue.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminDashboard({ issues, stats, onIssueUpdated }) {
  const categoryData = Object.entries(stats.category_counts || {}).map(([name, count]) => ({
    name: categoryLabel[name] || name,
    count,
  }))

  const priorityData = Object.entries(stats.priority_counts || {}).map(([name, count]) => ({
    name,
    count,
  }))

  const weeklyTrend = [
    { day: 'Mon', complaints: 14 },
    { day: 'Tue', complaints: 18 },
    { day: 'Wed', complaints: 16 },
    { day: 'Thu', complaints: 22 },
    { day: 'Fri', complaints: 19 },
    { day: 'Sat', complaints: 24 },
    { day: 'Sun', complaints: 21 },
  ]

  const areaData = [
    { area: 'Ward 12', value: 26 },
    { area: 'Ward 5', value: 20 },
    { area: 'Central', value: 18 },
    { area: 'North', value: 14 },
    { area: 'East', value: 12 },
  ]

  const [search, setSearch] = useState('')
  const filteredIssues = issues.filter((issue) => `${issue.title} ${issue.category} ${issue.status}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-8">
      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Admin Dashboard</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Operational overview</h2>
          </div>
          <div className="flex items-center gap-3 rounded-full bg-slate-100 px-3 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-sky-700 text-sm font-semibold text-white">AD</div>
            <div>
              <div className="text-sm font-medium text-slate-900">Admin Desk</div>
              <div className="text-xs text-slate-500">Municipal Ops</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ['Total complaints', stats.total_issues || issues.length],
          ['Pending', stats.pending_issues || 0],
          ['Critical issues', stats.critical_issues || 0],
          ['Resolved', stats.resolved_issues || 0],
          ['Active volunteers', stats.active_volunteers || 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Weekly complaint trend</h3>
          <div className="h-72 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="complaints" radius={[8, 8, 0, 0]} fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Priority mix</h3>
          <div className="h-72 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityData} dataKey="count" nameKey="name" outerRadius={88} innerRadius={46} paddingAngle={3}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={priorityColors[entry.name] || '#0f172a'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Category distribution</h3>
          <div className="h-72 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="#0ea5a4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Area-wise complaints</h3>
          <div className="mt-6 space-y-4">
            {areaData.map((area) => (
              <div key={area.area}>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>{area.area}</span>
                  <span>{area.value}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div className="h-2.5 rounded-full bg-gradient-to-r from-sky-700 to-teal-500" style={{ width: `${(area.value / 30) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Complaint management</h3>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search issues" className="w-full max-w-xs rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 bg-white text-left">
            <thead className="bg-slate-50 text-sm text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Issue</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
              {filteredIssues.slice(0, 5).map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={getIssueImage(issue)} onError={(event) => handleIssueImageError(event, issue)} alt={`${categoryLabel[issue.category] || issue.category} thumbnail`} className="h-12 w-12 rounded-xl object-cover" />
                      <div>
                        <div className="font-medium text-slate-900">{issue.title}</div>
                        <div className="text-xs text-slate-500">{issue.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{categoryLabel[issue.category] || issue.category}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2 py-1 text-xs font-medium" style={{ backgroundColor: `${priorityColors[issue.priority] || '#0f172a'}20`, color: priorityColors[issue.priority] || '#0f172a' }}>
                      {issue.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3"><select aria-label={`Update status for ${issue.id}`} value={issue.status} onChange={async (event) => {
                    try {
                      const response = await axios.post(`${apiBase}/api/issues/${issue.id}/status`, { status: event.target.value, note: 'Status updated by admin.' })
                      onIssueUpdated(response.data.issue)
                    } catch (error) {
                      console.error('Could not update issue status:', error)
                    }
                  }} className="rounded-lg border border-slate-200 bg-white px-2 py-1">{statusOrder.map((status) => <option key={status} value={status}>{status}</option>)}</select></td>
                  <td className="px-4 py-3">Ward {issue.latitude ? '12' : '5'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function UserProfile() {
  return (
    <div className="mx-auto max-w-4xl rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-700 to-teal-500 text-xl font-semibold text-white">AR</div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Asha R.</h2>
            <p className="text-sm text-slate-500">Citizen • Ward 12</p>
          </div>
        </div>
        <button className="rounded-full bg-sky-900 px-4 py-2 text-sm font-medium text-white">Edit profile</button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ['Contribution points', '420'],
          ['Resolved issues', '8'],
          ['Badges', '2'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
