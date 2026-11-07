import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Building2,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MoonStar,
  Pencil,
  Plus,
  ReceiptText,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Star,
  SunMedium,
  Trash2,
  Upload,
  UserCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import './App.css'

type PageKey = 'dashboard' | 'sessions' | 'financial' | 'representatives' | 'employees' | 'deductions' | 'messages' | 'backup' | 'settings'
type Status = 'fully_paid' | 'partially_paid' | 'unpaid' | 'pricing_pending'
type OfferMode = 'per_student' | 'package'
type ThemeMode = 'dark' | 'light'
type RepresentativeOffer = 'offer_1' | 'offer_2' | 'offer_3'

type Representative = {
  id: string
  sequenceNumber: number
  fullName: string
  phoneNumber: string
  university: string
  department: string
  username: string
  password: string
  graduationDate: string
  offer: RepresentativeOffer | null
  createdAt: string
}

type RepresentativeStudent = {
  id: string
  representativeId: string
  fullName: string
  createdAt: string
  updatedAt: string
}

type LoginSession =
  | { role: 'admin'; token?: string }
  | { role: 'representative'; representativeId: string; token?: string }

type DetailModalState =
  | { type: 'session'; item: GraduationSession }
  | { type: 'financial'; item: FinancialRecord }
  | { type: 'employee'; item: Employee }
  | { type: 'deduction'; item: Deduction }

type GraduationSession = {
  id: string
  representativeId?: string
  university: string
  department: string
  representativeName: string
  sessionDate: string
  studentCount: number
  phoneNumber: string
  offerName: string
  offerPrice: number
  receivedCards: number
  deliveryDate: string
  createdAt: string
}

type FinancialRecord = {
  id: string
  representativeId?: string
  university: string
  department: string
  representativeName: string
  representativePhone: string
  studentCount: number
  offerName: string
  offerPrice: number
  priceMode: OfferMode
  totalAmount: number
  amountReceived: number
  remainingAmount: number
  fullPaymentDate: string
  pricingPending?: boolean
  createdAt: string
}

type Employee = {
  id: string
  fullName: string
  jobTitle: string
  monthlyEvaluation: number
  phoneNumber: string
  note: string
  createdAt: string
}

type Deduction = {
  id: string
  employeeId: string
  employeeName: string
  employeePhone: string
  amount: number
  deductionDate: string
  reason: string
  createdAt: string
}

type AppSettings = {
  appName: string
  currency: string
  theme: ThemeMode
  version: string
  databaseLocation: string
  backupInfo: string
}

type AppData = {
  sessions: GraduationSession[]
  financialRecords: FinancialRecord[]
  representatives: Representative[]
  nextRepresentativeNumber: number
  students: RepresentativeStudent[]
  employees: Employee[]
  deductions: Deduction[]
  settings: AppSettings
}

type SessionFormState = {
  id?: string
  representativeId?: string
  university: string
  department: string
  representativeName: string
  sessionDate: string
  studentCount: number
  phoneNumber: string
  offerName: string
  offerPrice: number
  receivedCards: number
  deliveryDate: string
}

type FinancialFormState = {
  id?: string
  representativeId?: string
  university: string
  department: string
  representativeName: string
  representativePhone: string
  studentCount: number
  offerName: string
  offerPrice: number
  priceMode: OfferMode
  totalAmount: number
  amountReceived: number
  remainingAmount: number
  fullPaymentDate: string
}

type EmployeeFormState = {
  id?: string
  fullName: string
  jobTitle: string
  monthlyEvaluation: number
  phoneNumber: string
  note: string
}

type DeductionFormState = {
  id?: string
  employeeId: string
  amount: number
  deductionDate: string
  reason: string
}

type RepresentativeFormState = Omit<Representative, 'id' | 'offer' | 'createdAt' | 'sequenceNumber'> & { id?: string }

type StudentFormState = {
  id?: string
  fullName: string
}

type GraduationMessageForm = {
  date: string
  time: string
  department: string
  location: string
  theater: string
}

type BackupPayload = {
  version: string
  createdAt: string
  applicationName: string
  data: AppData
}

const storageKey = 'graduation_manager_data_v1'
const recoveryStorageKey = `${storageKey}_recovery`
const loginStorageKey = 'graduation_manager_logged_in'
const appVersion = '1.0.0'
const onlineMode = import.meta.env.PROD

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
    numberingSystem: 'latn',
  }).format(value)

const formatRepresentativeCode = (sequenceNumber: number) => `#${String(sequenceNumber).padStart(4, '0')}`

const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const getTomorrowDate = () => {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getWeekdayName = (date: string) => date
  ? new Intl.DateTimeFormat('ar-IQ', { weekday: 'long' }).format(new Date(`${date}T12:00:00`))
  : ''

const normalizeWhatsAppPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('00')) return digits.slice(2)
  if (digits.startsWith('0')) return `964${digits.slice(1)}`
  return digits
}

const emptySessionForm = (): SessionFormState => ({
  university: '',
  department: '',
  representativeName: '',
  sessionDate: '',
  studentCount: 0,
  phoneNumber: '',
  offerName: '',
  offerPrice: 0,
  receivedCards: 0,
  deliveryDate: '',
})

const emptyFinancialForm = (): FinancialFormState => ({
  university: '',
  department: '',
  representativeName: '',
  representativePhone: '',
  studentCount: 0,
  offerName: '',
  offerPrice: 0,
  priceMode: 'per_student',
  totalAmount: 0,
  amountReceived: 0,
  remainingAmount: 0,
  fullPaymentDate: '',
})

const emptyEmployeeForm = (): EmployeeFormState => ({
  fullName: '',
  jobTitle: '',
  monthlyEvaluation: 3,
  phoneNumber: '',
  note: '',
})

const emptyDeductionForm = (): DeductionFormState => ({
  employeeId: '',
  amount: 0,
  deductionDate: '',
  reason: '',
})

const emptyRepresentativeForm = (): RepresentativeFormState => ({
  fullName: '',
  phoneNumber: '',
  university: '',
  department: '',
  username: '',
  password: '',
  graduationDate: '',
})

const getDefaultData = (): AppData => ({
  sessions: [],
  financialRecords: [],
  representatives: [],
  nextRepresentativeNumber: 1,
  students: [],
  employees: [],
  deductions: [],
  settings: {
    appName: 'نظام إدارة التخرج',
    currency: 'IQD',
    theme: 'dark',
    version: appVersion,
    databaseLocation: 'التخزين المحلي لهذا المتصفح',
    backupInfo: 'يتم حفظ جميع التغييرات تلقائياً محلياً',
  },
})

const parseAppData = (raw: string): AppData | null => {
  const parsed = JSON.parse(raw) as Partial<AppData>
  if (!parsed || typeof parsed !== 'object') return null
  const sourceRepresentatives = Array.isArray(parsed.representatives) ? parsed.representatives : []
  const highestExistingNumber = sourceRepresentatives.reduce((highest, representative) => Math.max(highest, representative.sequenceNumber ?? 0), 0)
  let nextNumber = highestExistingNumber + 1
  const representatives = sourceRepresentatives.map((representative) => {
    if (Number.isInteger(representative.sequenceNumber) && representative.sequenceNumber > 0) return representative
    return { ...representative, sequenceNumber: nextNumber++ }
  })
  const highestNumber = representatives.reduce((highest, representative) => Math.max(highest, representative.sequenceNumber), 0)
  return {
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    financialRecords: Array.isArray(parsed.financialRecords) ? parsed.financialRecords : [],
    representatives,
    nextRepresentativeNumber: Math.max(parsed.nextRepresentativeNumber ?? 1, highestNumber + 1),
    students: Array.isArray(parsed.students) ? parsed.students : [],
    employees: Array.isArray(parsed.employees) ? parsed.employees : [],
    deductions: Array.isArray(parsed.deductions) ? parsed.deductions : [],
    settings: { ...getDefaultData().settings, ...(parsed.settings ?? {}) },
  }
}

const loadAppData = (): { data: AppData; message: string } => {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      try {
        const data = parseAppData(raw)
        if (data) return { data, message: '' }
      } catch {}
    }

    const recoveryRaw = localStorage.getItem(recoveryStorageKey)
    if (recoveryRaw) {
      const data = parseAppData(recoveryRaw)
      if (data) return { data, message: 'تم استرجاع آخر نسخة محلية سليمة.' }
    }

    return {
      data: getDefaultData(),
      message: raw ? 'تعذر قراءة البيانات المحلية. لم يتم استبدال الملف السابق.' : '',
    }
  } catch {
    return { data: getDefaultData(), message: 'تعذر الوصول إلى التخزين المحلي في هذا المتصفح.' }
  }
}

const saveAppData = (data: AppData) => {
  const previous = localStorage.getItem(storageKey)
  if (previous) {
    try {
      if (parseAppData(previous)) localStorage.setItem(recoveryStorageKey, previous)
    } catch {}
  }
  localStorage.setItem(storageKey, JSON.stringify(data))
}

const getLoginState = (): LoginSession | null => {
  try {
    const raw = sessionStorage.getItem(loginStorageKey)
    if (raw === 'true') return { role: 'admin' }
    if (!raw) return null
    const session = JSON.parse(raw) as LoginSession
    if (session.role === 'admin') return session
    if (session.role === 'representative' && session.representativeId) return session
    return null
  } catch {
    return null
  }
}

const offerNames: Record<RepresentativeOffer, string> = {
  offer_1: 'عرض ١',
  offer_2: 'عرض ٢',
  offer_3: 'عرض ٣',
}

const cardsPerStudent: Record<RepresentativeOffer, number> = {
  offer_1: 1,
  offer_2: 2,
  offer_3: 3,
}

const offerPricesPerStudent: Record<RepresentativeOffer, number> = {
  offer_1: 25000,
  offer_2: 30000,
  offer_3: 35000,
}

const syncRepresentativeTables = (currentData: AppData, representative: Representative): AppData => {
  if (!representative.offer || !representative.university.trim() || !representative.department.trim()) return currentData

  const students = currentData.students.filter((entry) => entry.representativeId === representative.id)
  const studentCount = students.length
  const currentSession = currentData.sessions.find((entry) => entry.representativeId === representative.id)
  const currentFinancial = currentData.financialRecords.find((entry) => entry.representativeId === representative.id)
  const offerPrice = currentFinancial?.offerPrice ?? offerPricesPerStudent[representative.offer]
  const session: GraduationSession = {
    ...currentSession,
    id: currentSession?.id ?? `session_${representative.id}`,
    representativeId: representative.id,
    university: representative.university,
    department: representative.department,
    representativeName: representative.fullName,
    sessionDate: representative.graduationDate,
    studentCount,
    phoneNumber: representative.phoneNumber,
    offerName: offerNames[representative.offer],
    offerPrice,
    receivedCards: studentCount * cardsPerStudent[representative.offer],
    deliveryDate: currentSession?.deliveryDate ?? '',
    createdAt: currentSession?.createdAt ?? representative.createdAt,
  }

  const priceMode: OfferMode = 'per_student'
  const amountReceived = currentFinancial?.amountReceived ?? 0
  const totalAmount = studentCount * offerPrice
  const financialRecord: FinancialRecord = {
    ...currentFinancial,
    id: currentFinancial?.id ?? `financial_${representative.id}`,
    representativeId: representative.id,
    university: representative.university,
    department: representative.department,
    representativeName: representative.fullName,
    representativePhone: representative.phoneNumber,
    studentCount,
    offerName: offerNames[representative.offer],
    offerPrice,
    priceMode,
    totalAmount,
    amountReceived,
    remainingAmount: Math.max(0, totalAmount - amountReceived),
    fullPaymentDate: currentFinancial?.fullPaymentDate ?? '',
    pricingPending: false,
    createdAt: currentFinancial?.createdAt ?? representative.createdAt,
  }

  return {
    ...currentData,
    sessions: [session, ...currentData.sessions.filter((entry) => entry.representativeId !== representative.id)],
    financialRecords: [financialRecord, ...currentData.financialRecords.filter((entry) => entry.representativeId !== representative.id)],
  }
}

const getPaymentStatus = (record: FinancialRecord): Status => {
  if (record.pricingPending) return 'pricing_pending'
  if (record.remainingAmount <= 0) return 'fully_paid'
  if (record.amountReceived > 0) return 'partially_paid'
  return 'unpaid'
}

const normalizeNumber = (value: number) => Number.isFinite(value) ? Math.max(0, Number(value)) : 0

const buildFinancialTotals = (financialRecords: FinancialRecord[]) => {
  const totalAmount = financialRecords.reduce((sum, record) => sum + normalizeNumber(record.totalAmount), 0)
  const totalReceived = financialRecords.reduce((sum, record) => sum + normalizeNumber(record.amountReceived), 0)
  const totalOutstanding = financialRecords.reduce((sum, record) => sum + normalizeNumber(record.remainingAmount), 0)
  return { totalAmount, totalReceived, totalOutstanding }
}

function App() {
  const [initialLoad] = useState(loadAppData)
  const [data, setData] = useState<AppData>(initialLoad.data)
  const [page, setPage] = useState<PageKey>('dashboard')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [authSession, setAuthSession] = useState<LoginSession | null>(() => {
    const savedSession = getLoginState()
    return onlineMode && !savedSession?.token ? null : savedSession
  })
  const [remoteReady, setRemoteReady] = useState(!onlineMode)
  const [storageMessage, setStorageMessage] = useState(initialLoad.message)
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [tableSearch, setTableSearch] = useState('')
  const [sessionForm, setSessionForm] = useState<SessionFormState>(emptySessionForm())
  const [financialForm, setFinancialForm] = useState<FinancialFormState>(emptyFinancialForm())
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormState>(emptyEmployeeForm())
  const [deductionForm, setDeductionForm] = useState<DeductionFormState>(emptyDeductionForm())
  const [representativeForm, setRepresentativeForm] = useState<RepresentativeFormState>(emptyRepresentativeForm())
  const [representativeSchoolForm, setRepresentativeSchoolForm] = useState({ university: '', department: '' })
  const [representativeSetupMessage, setRepresentativeSetupMessage] = useState('')
  const [studentForm, setStudentForm] = useState<StudentFormState>({ fullName: '' })
  const [studentEditId, setStudentEditId] = useState<string | null>(null)
  const [graduationMessageForm, setGraduationMessageForm] = useState<GraduationMessageForm>({ date: getTomorrowDate(), time: '', department: '', location: '', theater: '' })
  const [selectedMessageEmployeeIds, setSelectedMessageEmployeeIds] = useState<string[]>([])
  const [selectedDeductionMessageId, setSelectedDeductionMessageId] = useState('')
  const [sessionFilterUniversity, setSessionFilterUniversity] = useState('الكل')
  const [financialFilterUniversity, setFinancialFilterUniversity] = useState('الكل')
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [financialModalOpen, setFinancialModalOpen] = useState(false)
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false)
  const [deductionModalOpen, setDeductionModalOpen] = useState(false)
  const [representativeModalOpen, setRepresentativeModalOpen] = useState(false)
  const [studentModalOpen, setStudentModalOpen] = useState(false)
  const [representativeDetailId, setRepresentativeDetailId] = useState<string | null>(null)
  const [detailModal, setDetailModal] = useState<DetailModalState | null>(null)
  const [sessionSort, setSessionSort] = useState('sessionDate_desc')
  const [financialSort, setFinancialSort] = useState('createdAt_desc')
  const [sessionRowsPerPage, setSessionRowsPerPage] = useState(8)
  const [financialRowsPerPage, setFinancialRowsPerPage] = useState(8)
  const [sessionPage, setSessionPage] = useState(1)
  const [financialPage, setFinancialPage] = useState(1)
  const [backupStatus, setBackupStatus] = useState('')
  const [importStatus, setImportStatus] = useState('')
  const isAuthenticated = authSession !== null
  const isAdmin = authSession?.role === 'admin'
  const activeRepresentative = authSession?.role === 'representative'
    ? data.representatives.find((entry) => entry.id === authSession.representativeId) ?? null
    : null

  useEffect(() => {
    if (initialLoad.message && data === initialLoad.data) return

    if (onlineMode) {
      if (!authSession?.token || !remoteReady) return
      let canceled = false
      const timer = window.setTimeout(async () => {
        try {
          const response = await fetch('/api/data', {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${authSession.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data }),
          })
          if (!response.ok) throw new Error('تعذر حفظ البيانات على السيرفر.')
          if (!canceled) setStorageMessage('تم الحفظ على السيرفر')
        } catch {
          if (!canceled) setStorageMessage('تعذر الحفظ على السيرفر. تحقق من الاتصال.')
        }
      }, 250)
      return () => {
        canceled = true
        window.clearTimeout(timer)
      }
    }

    try {
      saveAppData(data)
      setStorageMessage('')
    } catch {
      setStorageMessage('تعذر حفظ التغييرات محلياً. صدّر نسخة احتياطية الآن.')
    }
  }, [authSession, data, initialLoad.data, initialLoad.message, remoteReady])

  useEffect(() => {
    if (!onlineMode) {
      setRemoteReady(true)
      return
    }
    if (!authSession?.token) {
      setRemoteReady(false)
      return
    }

    let canceled = false
    setRemoteReady(false)
    fetch('/api/data', { headers: { Authorization: `Bearer ${authSession.token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('تعذر تحميل بيانات السيرفر.')
        return await response.json() as { data: AppData; empty?: boolean }
      })
      .then(async (payload) => {
        if (canceled) return
        const remoteData = parseAppData(JSON.stringify(payload.data)) ?? getDefaultData()
        if (authSession.role === 'admin' && payload.empty && hasAppRecords(initialLoad.data)) {
          const shouldMigrate = window.confirm('قاعدة بيانات السيرفر فارغة، لكن توجد بيانات محفوظة على هذا الجهاز. هل تريد رفعها للسيرفر لأول مرة؟')
          if (shouldMigrate) {
            const response = await fetch('/api/data', {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${authSession.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ data: initialLoad.data }),
            })
            if (!response.ok) throw new Error('تعذر نقل البيانات إلى السيرفر.')
            if (!canceled) setData(initialLoad.data)
          } else if (!canceled) {
            setData(remoteData)
          }
        } else {
          setData(remoteData)
        }
        if (!canceled) {
          setStorageMessage('')
          setRemoteReady(true)
        }
      })
      .catch(() => {
        if (!canceled) {
          setStorageMessage('تعذر الاتصال بالسيرفر. تحقق من إعدادات النشر.')
          setRemoteReady(true)
        }
      })

    return () => {
      canceled = true
    }
  }, [authSession?.token])

  useEffect(() => {
    setData((currentData) => currentData.representatives.reduce(
      (syncedData, representative) => syncRepresentativeTables(syncedData, representative),
      currentData,
    ))
  }, [])

  useEffect(() => {
    document.body.classList.toggle('theme-light', data.settings.theme === 'light')
    document.body.classList.toggle('theme-dark', data.settings.theme === 'dark')
  }, [data.settings.theme])

  useEffect(() => {
    try {
      if (authSession) {
        sessionStorage.setItem(loginStorageKey, JSON.stringify(authSession))
      } else {
        sessionStorage.removeItem(loginStorageKey)
      }
    } catch {
      return
    }
  }, [authSession])

  useEffect(() => {
    if (!activeRepresentative) return
    setRepresentativeSchoolForm({
      university: activeRepresentative.university,
      department: activeRepresentative.department,
    })
  }, [activeRepresentative?.id, activeRepresentative?.university, activeRepresentative?.department])

  const uniqueSessionUniversityNames = useMemo(
    () => Array.from(new Set(data.sessions.map((entry) => entry.university))).filter(Boolean),
    [data.sessions],
  )

  const uniqueFinancialUniversityNames = useMemo(
    () => Array.from(new Set(data.financialRecords.map((entry) => entry.university))).filter(Boolean),
    [data.financialRecords],
  )

  const dashboardStats = useMemo(() => {
    const universities = new Set([...data.sessions.map((record) => record.university), ...data.financialRecords.map((record) => record.university)])
    const totalStudents = data.sessions.reduce((sum, record) => sum + normalizeNumber(record.studentCount), 0)
    const totalSessions = data.sessions.length
    const financial = buildFinancialTotals(data.financialRecords)
    const totalDeductions = data.deductions.reduce((sum, record) => sum + normalizeNumber(record.amount), 0)
    const totalEmployees = data.employees.length
    return {
      universities: universities.size,
      totalStudents,
      totalSessions,
      financialAmount: financial.totalAmount,
      totalReceived: financial.totalReceived,
      outstanding: financial.totalOutstanding,
      employees: totalEmployees,
      deductions: totalDeductions,
    }
  }, [data])

  const recentActivities = useMemo(() => {
    const items = [
      ...data.sessions.map((entry) => ({
        id: entry.id,
        type: 'session',
        title: `${entry.university} / ${entry.department}`,
        subtitle: `جلسة ${entry.representativeName}`,
        time: entry.createdAt,
      })),
      ...data.financialRecords.map((entry) => ({
        id: entry.id,
        type: 'financial',
        title: `${entry.university} / ${entry.department}`,
        subtitle: `مبلغ ${formatCurrency(entry.totalAmount)}`,
        time: entry.createdAt,
      })),
      ...data.employees.map((entry) => ({
        id: entry.id,
        type: 'employee',
        title: entry.fullName,
        subtitle: `وظيفة ${entry.jobTitle}`,
        time: entry.createdAt,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    return items.slice(0, 6)
  }, [data])

  const handleLogin = async () => {
    if (onlineMode) {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        })
        if (!response.ok) throw new Error('بيانات الدخول غير صحيحة.')
        const session = await response.json() as LoginSession
        if (!session.token || (session.role !== 'admin' && session.role !== 'representative')) {
          throw new Error('استجابة تسجيل الدخول من السيرفر غير صالحة.')
        }
        setAuthSession(session)
        setLoginError('')
        setCredentials({ username: '', password: '' })
      } catch {
        setLoginError('تعذر تسجيل الدخول. تحقق من بياناتك واتصال السيرفر.')
      }
      return
    }

    if (credentials.username === 'MANO2099' && credentials.password === 'MARK2099') {
      setAuthSession({ role: 'admin' })
      setLoginError('')
      return
    }

    const representative = data.representatives.find((entry) => entry.username === credentials.username && entry.password === credentials.password)
    if (representative) {
      setAuthSession({ role: 'representative', representativeId: representative.id })
      setLoginError('')
      return
    }

    setLoginError('بيانات الدخول غير صحيحة. يرجى التحقق من اسم المستخدم وكلمة المرور.')
  }

  const handleLogout = () => {
    setAuthSession(null)
    setCredentials({ username: '', password: '' })
  }

  const openRepresentativeModal = (entry?: Representative) => {
    setRepresentativeForm(entry ? {
      id: entry.id,
      fullName: entry.fullName,
      phoneNumber: entry.phoneNumber,
      university: entry.university,
      department: entry.department,
      username: entry.username,
      password: entry.password,
      graduationDate: entry.graduationDate,
    } : emptyRepresentativeForm())
    setRepresentativeModalOpen(true)
  }

  const saveRepresentative = () => {
    const form = representativeForm
    if (!form.phoneNumber.trim() || !form.username.trim() || !form.password || !form.graduationDate) {
      setBackupStatus('أكمل بيانات الممثل وموعد التخرج قبل الحفظ.')
      return
    }
    if (form.fullName.trim().split(/\s+/).length < 3) {
      setBackupStatus('اكتب الاسم الثلاثي للممثل بشكل صحيح.')
      return
    }
    if (data.representatives.some((entry) => entry.username === form.username.trim() && entry.id !== form.id)) {
      setBackupStatus('اسم المستخدم مستخدم لحساب ممثل آخر.')
      return
    }

    const existingRepresentative = data.representatives.find((entry) => entry.id === form.id)
    const item: Representative = {
      id: form.id ?? createId('representative'),
      sequenceNumber: existingRepresentative?.sequenceNumber ?? data.nextRepresentativeNumber,
      fullName: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      university: form.university.trim(),
      department: form.department.trim(),
      username: form.username.trim(),
      password: form.password,
      graduationDate: form.graduationDate,
      offer: existingRepresentative?.offer ?? null,
      createdAt: existingRepresentative?.createdAt ?? new Date().toISOString(),
    }

    setData((prev) => {
      const updated = {
        ...prev,
        nextRepresentativeNumber: form.id ? prev.nextRepresentativeNumber : Math.max(prev.nextRepresentativeNumber, item.sequenceNumber + 1),
        representatives: form.id
          ? prev.representatives.map((entry) => entry.id === item.id ? item : entry)
          : [item, ...prev.representatives],
      }
      return syncRepresentativeTables(updated, item)
    })
    setRepresentativeModalOpen(false)
    setBackupStatus('تم حفظ حساب الممثل.')
  }

  const deleteRepresentative = (representativeId: string) => {
    const representative = data.representatives.find((entry) => entry.id === representativeId)
    if (!representative || !window.confirm(`حذف حساب ${representative.fullName} وطلاب هذا الحساب؟`)) return
    setData((prev) => ({
      ...prev,
      representatives: prev.representatives.filter((entry) => entry.id !== representativeId),
      students: prev.students.filter((entry) => entry.representativeId !== representativeId),
      sessions: prev.sessions.filter((entry) => entry.representativeId !== representativeId),
      financialRecords: prev.financialRecords.filter((entry) => entry.representativeId !== representativeId),
    }))
  }

  const chooseRepresentativeOffer = (offer: RepresentativeOffer) => {
    if (!activeRepresentative || activeRepresentative.offer) return
    const university = representativeSchoolForm.university.trim()
    const department = representativeSchoolForm.department.trim()
    if (!university || !department) {
      setRepresentativeSetupMessage('أدخل اسم الجامعة والقسم قبل تثبيت العرض.')
      return
    }
    const updatedRepresentative = { ...activeRepresentative, university, department, offer }
    setData((prev) => syncRepresentativeTables({
      ...prev,
      representatives: prev.representatives.map((entry) => entry.id === activeRepresentative.id ? updatedRepresentative : entry),
    }, updatedRepresentative))
    setRepresentativeSetupMessage('تم تثبيت العرض وإنشاء بيانات الجدولين.')
  }

  const saveRepresentativeSchool = () => {
    if (!activeRepresentative) return
    const university = representativeSchoolForm.university.trim()
    const department = representativeSchoolForm.department.trim()
    if (!university || !department) {
      setRepresentativeSetupMessage('أدخل اسم الجامعة والقسم حتى يتم تحديث الجدولين.')
      return
    }
    const updatedRepresentative = { ...activeRepresentative, university, department }
    setData((prev) => syncRepresentativeTables({
      ...prev,
      representatives: prev.representatives.map((entry) => entry.id === activeRepresentative.id ? updatedRepresentative : entry),
    }, updatedRepresentative))
    setRepresentativeSetupMessage('تم تحديث معلومات الجدولين تلقائياً.')
  }

  const openStudentModal = (entry?: RepresentativeStudent) => {
    if (!activeRepresentative) return
    setStudentEditId(entry?.id ?? null)
    setStudentForm({ fullName: entry?.fullName ?? '' })
    setStudentModalOpen(true)
  }

  const saveStudent = () => {
    if (!activeRepresentative || !activeRepresentative.offer) return
    const fullName = studentForm.fullName.trim()
    if (!fullName) return
    const now = new Date().toISOString()
    setData((prev) => {
      const students = studentEditId
        ? prev.students.map((entry) => entry.id === studentEditId && entry.representativeId === activeRepresentative.id
          ? { ...entry, fullName, updatedAt: now }
          : entry)
        : [{ id: createId('student'), representativeId: activeRepresentative.id, fullName, createdAt: now, updatedAt: now }, ...prev.students]
      const updated = prev.representatives.find((entry) => entry.id === activeRepresentative.id) ?? activeRepresentative
      return syncRepresentativeTables({ ...prev, students }, updated)
    })
    setStudentModalOpen(false)
    setStudentEditId(null)
    setStudentForm({ fullName: '' })
  }

  const deleteStudent = (studentId: string) => {
    if (!activeRepresentative) return
    setData((prev) => {
      const students = prev.students.filter((entry) => entry.id !== studentId || entry.representativeId !== activeRepresentative.id)
      const updated = prev.representatives.find((entry) => entry.id === activeRepresentative.id) ?? activeRepresentative
      return syncRepresentativeTables({ ...prev, students }, updated)
    })
  }

  const openSessionModal = (entry?: GraduationSession) => {
    if (entry) {
      setSessionForm({
        id: entry.id,
        representativeId: entry.representativeId,
        university: entry.university,
        department: entry.department,
        representativeName: entry.representativeName,
        sessionDate: entry.sessionDate,
        studentCount: entry.studentCount,
        phoneNumber: entry.phoneNumber,
        offerName: entry.offerName,
        offerPrice: entry.offerPrice,
        receivedCards: entry.receivedCards,
        deliveryDate: entry.deliveryDate,
      })
    } else {
      setSessionForm(emptySessionForm())
    }
    setSessionModalOpen(true)
  }

  const saveSession = () => {
    if (!sessionForm.university || !sessionForm.department || !sessionForm.representativeName || !sessionForm.sessionDate || !sessionForm.deliveryDate) {
      setBackupStatus('يرجى إكمال جميع الحقول المطلوبة.')
      return
    }

    const linkedRepresentativeId = sessionForm.representativeId ?? data.sessions.find((entry) => entry.id === sessionForm.id)?.representativeId
    const linkedRepresentative = data.representatives.find((entry) => entry.id === linkedRepresentativeId)
    const studentCount = linkedRepresentative
      ? data.students.filter((entry) => entry.representativeId === linkedRepresentative.id).length
      : normalizeNumber(sessionForm.studentCount)
    const linkedFinancial = linkedRepresentative
      ? data.financialRecords.find((entry) => entry.representativeId === linkedRepresentative.id)
      : undefined
    const item: GraduationSession = {
      id: sessionForm.id ?? createId('session'),
      representativeId: linkedRepresentative?.id ?? linkedRepresentativeId,
      university: linkedRepresentative?.university ?? sessionForm.university,
      department: linkedRepresentative?.department ?? sessionForm.department,
      representativeName: linkedRepresentative?.fullName ?? sessionForm.representativeName,
      sessionDate: linkedRepresentative?.graduationDate ?? sessionForm.sessionDate,
      studentCount,
      phoneNumber: linkedRepresentative?.phoneNumber ?? sessionForm.phoneNumber,
      offerName: linkedRepresentative?.offer ? offerNames[linkedRepresentative.offer] : sessionForm.offerName,
      offerPrice: linkedRepresentative?.offer ? linkedFinancial?.offerPrice ?? offerPricesPerStudent[linkedRepresentative.offer] : normalizeNumber(sessionForm.offerPrice),
      receivedCards: linkedRepresentative?.offer ? studentCount * cardsPerStudent[linkedRepresentative.offer] : normalizeNumber(sessionForm.receivedCards),
      deliveryDate: sessionForm.deliveryDate,
      createdAt: new Date().toISOString(),
    }

    setData((prev) => {
      const exists = prev.sessions.some((entry) => entry.id === item.id)
      return {
        ...prev,
        sessions: exists
          ? prev.sessions.map((entry) => (entry.id === item.id ? item : entry))
          : [item, ...prev.sessions],
      }
    })

    setSessionModalOpen(false)
    setBackupStatus('تم حفظ الجلسة بنجاح.')
  }

  const deleteSession = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الجلسة؟')) {
      setData((prev) => ({ ...prev, sessions: prev.sessions.filter((entry) => entry.id !== id) }))
    }
  }

  const openFinancialModal = (entry?: FinancialRecord) => {
    if (entry) {
      setFinancialForm({
        id: entry.id,
        representativeId: entry.representativeId,
        university: entry.university,
        department: entry.department,
        representativeName: entry.representativeName,
        representativePhone: entry.representativePhone,
        studentCount: entry.studentCount,
        offerName: entry.offerName,
        offerPrice: entry.offerPrice,
        priceMode: entry.priceMode,
        totalAmount: entry.totalAmount,
        amountReceived: entry.amountReceived,
        remainingAmount: entry.remainingAmount,
        fullPaymentDate: entry.fullPaymentDate,
      })
    } else {
      setFinancialForm(emptyFinancialForm())
    }
    setFinancialModalOpen(true)
  }

  const saveFinancial = () => {
    if (!financialForm.university || !financialForm.department || !financialForm.representativeName) {
      setBackupStatus('يرجى إكمال الحقول المالية الأساسية.')
      return
    }

    const linkedRepresentativeId = financialForm.representativeId ?? data.financialRecords.find((entry) => entry.id === financialForm.id)?.representativeId
    const linkedRepresentative = data.representatives.find((entry) => entry.id === linkedRepresentativeId)
    const studentCount = linkedRepresentative
      ? data.students.filter((entry) => entry.representativeId === linkedRepresentative.id).length
      : normalizeNumber(financialForm.studentCount)
    const offerPrice = linkedRepresentative?.offer
      ? normalizeNumber(financialForm.offerPrice)
      : normalizeNumber(financialForm.offerPrice)
    const priceMode: OfferMode = linkedRepresentative?.offer ? 'per_student' : financialForm.priceMode
    const totalAmount = priceMode === 'per_student' ? studentCount * offerPrice : offerPrice
    const amountReceived = normalizeNumber(financialForm.amountReceived)
    const remainingAmount = Math.max(0, totalAmount - amountReceived)

    if (amountReceived > totalAmount && !window.confirm('المبلغ المستلم يتجاوز الإجمالي. هل تريد المتابعة؟')) {
      return
    }

    const item: FinancialRecord = {
      id: financialForm.id ?? createId('financial'),
      representativeId: linkedRepresentative?.id ?? linkedRepresentativeId,
      university: financialForm.university,
      department: financialForm.department,
      representativeName: financialForm.representativeName,
      representativePhone: financialForm.representativePhone,
      studentCount,
      offerName: linkedRepresentative?.offer ? offerNames[linkedRepresentative.offer] : financialForm.offerName,
      offerPrice,
      priceMode,
      totalAmount,
      amountReceived,
      remainingAmount,
      fullPaymentDate: financialForm.fullPaymentDate,
      pricingPending: false,
      createdAt: new Date().toISOString(),
    }

    setData((prev) => {
      const exists = prev.financialRecords.some((record) => record.id === item.id)
      const updated = {
        ...prev,
        financialRecords: exists
          ? prev.financialRecords.map((record) => (record.id === item.id ? item : record))
          : [item, ...prev.financialRecords],
      }
      const representative = item.representativeId
        ? updated.representatives.find((entry) => entry.id === item.representativeId)
        : undefined
      return representative ? syncRepresentativeTables(updated, representative) : updated
    })

    setFinancialModalOpen(false)
    setBackupStatus('تم حفظ السجل المالي بنجاح.')
  }

  const deleteFinancial = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل المالي؟')) {
      setData((prev) => ({ ...prev, financialRecords: prev.financialRecords.filter((record) => record.id !== id) }))
    }
  }

  const openEmployeeModal = (entry?: Employee) => {
    if (entry) {
      setEmployeeForm({
        id: entry.id,
        fullName: entry.fullName,
        jobTitle: entry.jobTitle,
        monthlyEvaluation: entry.monthlyEvaluation,
        phoneNumber: entry.phoneNumber,
        note: entry.note,
      })
    } else {
      setEmployeeForm(emptyEmployeeForm())
    }
    setEmployeeModalOpen(true)
  }

  const saveEmployee = () => {
    if (!employeeForm.fullName || !employeeForm.jobTitle || !employeeForm.phoneNumber) {
      setBackupStatus('يرجى إكمال بيانات الموظف.')
      return
    }

    const item: Employee = {
      id: employeeForm.id ?? createId('employee'),
      fullName: employeeForm.fullName,
      jobTitle: employeeForm.jobTitle,
      monthlyEvaluation: Math.min(5, Math.max(1, employeeForm.monthlyEvaluation)),
      phoneNumber: employeeForm.phoneNumber,
      note: employeeForm.note,
      createdAt: new Date().toISOString(),
    }

    setData((prev) => {
      const exists = prev.employees.some((employee) => employee.id === item.id)
      return {
        ...prev,
        employees: exists
          ? prev.employees.map((employee) => (employee.id === item.id ? item : employee))
          : [item, ...prev.employees],
      }
    })

    setEmployeeModalOpen(false)
    setBackupStatus('تم حفظ الموظف بنجاح.')
  }

  const deleteEmployee = (id: string) => {
    if (window.confirm('هل تريد حذف الموظف؟ لن يتم حذف السجل المالي الخاص به، بل يظل محفوظاً في التاريخ.')) {
      setData((prev) => ({
        ...prev,
        employees: prev.employees.filter((employee) => employee.id !== id),
      }))
    }
  }

  const openDeductionModal = (entry?: Deduction) => {
    if (entry) {
      setDeductionForm({
        id: entry.id,
        employeeId: entry.employeeId,
        amount: entry.amount,
        deductionDate: entry.deductionDate,
        reason: entry.reason,
      })
    } else {
      setDeductionForm(emptyDeductionForm())
    }
    setDeductionModalOpen(true)
  }

  const saveDeduction = () => {
    if (!deductionForm.employeeId || !deductionForm.deductionDate || !deductionForm.reason) {
      setBackupStatus('يرجى إكمال بيانات الخصم.')
      return
    }

    const employee = data.employees.find((entry) => entry.id === deductionForm.employeeId)
    if (!employee) {
      setBackupStatus('الموظف المحدد غير موجود.')
      return
    }

    const item: Deduction = {
      id: deductionForm.id ?? createId('deduction'),
      employeeId: deductionForm.employeeId,
      employeeName: employee.fullName,
      employeePhone: employee.phoneNumber,
      amount: normalizeNumber(deductionForm.amount),
      deductionDate: deductionForm.deductionDate,
      reason: deductionForm.reason,
      createdAt: new Date().toISOString(),
    }

    setData((prev) => {
      const exists = prev.deductions.some((deduction) => deduction.id === item.id)
      return {
        ...prev,
        deductions: exists
          ? prev.deductions.map((deduction) => (deduction.id === item.id ? item : deduction))
          : [item, ...prev.deductions],
      }
    })

    setDeductionModalOpen(false)
    setBackupStatus('تم حفظ الخصم بنجاح.')
  }

  const deleteDeduction = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الخصم؟')) {
      setData((prev) => ({ ...prev, deductions: prev.deductions.filter((d) => d.id !== id) }))
    }
  }

  const sessionRows = useMemo(() => {
    const filtered = data.sessions.filter((entry) => {
      const matchesSearch = [entry.university, entry.department, entry.representativeName].some((value) => value.toLowerCase().includes(tableSearch.toLowerCase()))
      const universityMatch = sessionFilterUniversity === 'الكل' || entry.university === sessionFilterUniversity
      return matchesSearch && universityMatch
    })

    const sorted = [...filtered].sort((a, b) => {
      const direction = sessionSort.endsWith('_desc') ? -1 : 1
      const key = sessionSort.replace(/_(asc|desc)$/, '')
      const valueA = key === 'sessionDate' ? new Date(a.sessionDate).getTime() : new Date(a.deliveryDate).getTime()
      const valueB = key === 'sessionDate' ? new Date(b.sessionDate).getTime() : new Date(b.deliveryDate).getTime()
      return (valueA - valueB) * direction
    })

    return sorted
  }, [data.sessions, tableSearch, sessionFilterUniversity, sessionSort])

  const financialRows = useMemo(() => {
    const filtered = data.financialRecords.filter((entry) => {
      const matchesSearch = [entry.university, entry.department, entry.representativeName].some((value) => value.toLowerCase().includes(tableSearch.toLowerCase()))
      const universityMatch = financialFilterUniversity === 'الكل' || entry.university === financialFilterUniversity
      return matchesSearch && universityMatch
    })

    const sorted = [...filtered].sort((a, b) => {
      const direction = financialSort.endsWith('_desc') ? -1 : 1
      const field = financialSort.replace(/_(asc|desc)$/, '')
      const valueA = field === 'totalAmount' ? a.totalAmount : new Date(a.createdAt).getTime()
      const valueB = field === 'totalAmount' ? b.totalAmount : new Date(b.createdAt).getTime()
      return (valueA - valueB) * direction
    })

    return sorted
  }, [data.financialRecords, tableSearch, financialFilterUniversity, financialSort])

  const paginatedSessionRows = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(sessionRows.length / sessionRowsPerPage))
    const safeSessionPage = Math.min(sessionPage, totalPages)
    const start = (safeSessionPage - 1) * sessionRowsPerPage
    return { rows: sessionRows.slice(start, start + sessionRowsPerPage), totalPages }
  }, [sessionRows, sessionRowsPerPage, sessionPage])

  const paginatedFinancialRows = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(financialRows.length / financialRowsPerPage))
    const safePage = Math.min(financialPage, totalPages)
    const start = (safePage - 1) * financialRowsPerPage
    return { rows: financialRows.slice(start, start + financialRowsPerPage), totalPages }
  }, [financialRows, financialRowsPerPage, financialPage])

  const exportCsv = (title: string, rows: Array<Record<string, string | number>>) => {
    if (!rows.length) return
    const headers = Object.keys(rows[0])
    const csv = [headers.join(',')]
      .concat(
        rows.map((row) =>
          headers
            .map((header) => {
              const value = row[header]
              const escaped = String(value).replace(/"/g, '""')
              return `"${escaped}"`
            })
            .join(','),
        ),
      )
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const createBackupFile = () => {
    const payload: BackupPayload = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      applicationName: data.settings.appName,
      data,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Graduation_Manager_Backup_${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setBackupStatus('تم إنشاء نسخة احتياطية بنجاح.')
  }

  const importBackupFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const payload = JSON.parse(text) as BackupPayload
      if (!payload || !payload.data || payload.version !== '1.0.0') {
        throw new Error('ملف النسخة الاحتياطية غير صالح.')
      }

      const incomingData = parseAppData(JSON.stringify(payload.data))
      if (!incomingData) throw new Error('ملف النسخة الاحتياطية غير صالح.')

      const mode = window.confirm('هل تريد استبدال البيانات الحالية؟ إذا اخترت لا، سيتم دمج البيانات مع البيانات الحالية.') ? 'replace' : 'merge'
      setData((prev) => {
        if (mode === 'replace') {
          return incomingData
        }

        const mergeById = <T extends { id: string }>(existing: T[], incomingList: T[]) => {
          const combined = [...existing]
          incomingList.forEach((item) => {
            if (!combined.some((entry) => entry.id === item.id)) combined.push(item)
          })
          return combined
        }

        const existingRepresentativeIds = new Set(prev.representatives.map((entry) => entry.id))
        let nextRepresentativeNumber = Math.max(
          prev.nextRepresentativeNumber,
          ...prev.representatives.map((entry) => entry.sequenceNumber + 1),
        )
        const importedRepresentatives = incomingData.representatives
          .filter((entry) => !existingRepresentativeIds.has(entry.id))
          .map((entry) => ({ ...entry, sequenceNumber: nextRepresentativeNumber++ }))

        return {
          ...prev,
          ...incomingData,
          sessions: mergeById(prev.sessions, incomingData.sessions),
          financialRecords: mergeById(prev.financialRecords, incomingData.financialRecords),
          representatives: [...prev.representatives, ...importedRepresentatives],
          nextRepresentativeNumber,
          students: mergeById(prev.students, incomingData.students),
          employees: mergeById(prev.employees, incomingData.employees),
          deductions: mergeById(prev.deductions, incomingData.deductions),
          settings: { ...prev.settings, ...incomingData.settings },
        }
      })

      setImportStatus('تمت استعادة البيانات بنجاح.')
    } catch {
      setImportStatus('فشل استيراد النسخة الاحتياطية. تأكد من أن الملف الصحيح.')
    }
  }

  const currentEmployeeTotals = useMemo(() => {
    const totals = new Map<string, number>()
    data.deductions.forEach((entry) => {
      totals.set(entry.employeeId, (totals.get(entry.employeeId) ?? 0) + entry.amount)
    })
    return totals
  }, [data.deductions])

  const selectedMessageEmployees = selectedMessageEmployeeIds
    .map((id) => data.employees.find((employee) => employee.id === id))
    .filter((employee): employee is Employee => employee !== undefined)
  const getDisplayedRecordId = (id: string, representativeId?: string) => {
    const representative = representativeId
      ? data.representatives.find((entry) => entry.id === representativeId)
      : undefined
    return representative ? formatRepresentativeCode(representative.sequenceNumber) : id
  }
  const selectedMessageDeduction = data.deductions.find((entry) => entry.id === selectedDeductionMessageId) ?? data.deductions[0] ?? null
  const graduationMessage = [
    'السلام عليكم كادرنا ..',
    '',
    `غداً عدنا تخرج يوم ${getWeekdayName(graduationMessageForm.date) || '—'}`,
    '',
    `قسم ${graduationMessageForm.department || '—'}`,
    `المكان ${graduationMessageForm.location || '—'}`,
    `المسرح ${graduationMessageForm.theater || '—'}`,
    `الساعه ${graduationMessageForm.time || '—'}`,
    '',
    'الكادر الراح يطلع',
    '',
    selectedMessageEmployees.length
      ? selectedMessageEmployees.map((employee, index) => `${index + 1}- (${employee.jobTitle || '—'}) ${employee.fullName}`).join('\n')
      : '—',
  ].join('\n')

  const deductionMessage = selectedMessageDeduction
    ? `السلام عليكم ${selectedMessageDeduction.employeeName}،\n\nسبب الخصم: ${selectedMessageDeduction.reason}\nمبلغ الخصم: ${formatCurrency(selectedMessageDeduction.amount)}`
    : ''

  const openWhatsApp = (message: string, phone?: string) => {
    const encodedMessage = encodeURIComponent(message)
    const number = phone ? normalizeWhatsAppPhone(phone) : ''
    const url = number
      ? `https://wa.me/${number}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const statsCards = [
    { label: 'إجمالي الجامعات والأقسام', value: dashboardStats.universities, icon: Building2 },
    { label: 'إجمالي الطلاب المسجلين', value: dashboardStats.totalStudents, icon: GraduationCap },
    { label: 'إجمالي جلسات التخرج', value: dashboardStats.totalSessions, icon: CalendarRange },
    { label: 'المبلغ الإجمالي', value: formatCurrency(dashboardStats.financialAmount), icon: Wallet },
    { label: 'المبلغ المستلم', value: formatCurrency(dashboardStats.totalReceived), icon: CheckCircle2 },
    { label: 'المبلغ المتبقي', value: formatCurrency(dashboardStats.outstanding), icon: AlertCircle },
    { label: 'عدد الكادر', value: dashboardStats.employees, icon: Users },
    { label: 'إجمالي الخصومات', value: formatCurrency(dashboardStats.deductions), icon: ReceiptText },
    { label: 'ممثلون', value: data.representatives.length, icon: Users },
    { label: 'طلاب الممثلين', value: data.students.length, icon: GraduationCap },
    { label: 'كارتات مطلوبة', value: data.representatives.reduce((sum, representative) => sum + data.students.filter((student) => student.representativeId === representative.id).length * (representative.offer ? cardsPerStudent[representative.offer] : 0), 0), icon: ReceiptText },
  ]

  const menuItems = [
    { key: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { key: 'sessions', label: 'جدول التخرج 1', icon: GraduationCap },
    { key: 'financial', label: 'جدول التخرج 2', icon: Wallet },
    { key: 'representatives', label: 'الممثلون', icon: Users },
    { key: 'employees', label: 'الكادر', icon: Users },
    { key: 'deductions', label: 'الخصومات', icon: ReceiptText },
    { key: 'messages', label: 'رسائل واتساب', icon: MessageCircle },
    { key: 'backup', label: 'النسخ الاحتياطي', icon: ShieldCheck },
    { key: 'settings', label: 'الإعدادات', icon: Settings },
  ] as const

  const renderDashboard = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">لوحة التحكم</p>
          <h1>نظام إدارة التخرج</h1>
        </div>
        <div className="search-box">
          <Search size={16} />
          <input value={tableSearch} onChange={(event) => setTableSearch(event.target.value)} placeholder="بحث سريع" />
        </div>
      </div>

      <div className="stats-grid">
        {statsCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="stat-card">
            <div className="stat-header">
              <span className="stat-label">{label}</span>
              <span className="stat-icon"><Icon size={18} /></span>
            </div>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="content-grid two-col">
        <div className="panel">
          <div className="panel-header">
            <h3>آخر النشاطات</h3>
          </div>
          <div className="activity-list">
            {recentActivities.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="activity-item">
                <div className="dot" />
                <div>
                  <strong>{activity.title}</strong>
                  <p>{activity.subtitle}</p>
                </div>
                <span>{new Date(activity.time).toLocaleDateString('ar-IQ', { numberingSystem: 'latn' })}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>ملخص الأداء</h3>
          </div>
          <div className="summary-stack">
            <div className="summary-row">
              <span>إجمالي المبالغ المتراكمة</span>
              <strong>{formatCurrency(dashboardStats.financialAmount)}</strong>
            </div>
            <div className="summary-row">
              <span>المدفوع فعلياً</span>
              <strong>{formatCurrency(dashboardStats.totalReceived)}</strong>
            </div>
            <div className="summary-row">
              <span>المتبقي</span>
              <strong>{formatCurrency(dashboardStats.outstanding)}</strong>
            </div>
            <div className="summary-row">
              <span>إجمالي الخصومات</span>
              <strong>{formatCurrency(dashboardStats.deductions)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSessionTable = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">جدول التخرج 1</p>
          <h1>جلسات التخرج</h1>
        </div>
        <button className="primary-button" onClick={() => openSessionModal()}>
          <Plus size={16} />
          إضافة سجل جديد
        </button>
      </div>

      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={16} />
          <input placeholder="بحث حسب الجامعة أو القسم أو الممثل" value={tableSearch} onChange={(event) => setTableSearch(event.target.value)} />
        </div>
        <select value={sessionFilterUniversity} onChange={(event) => setSessionFilterUniversity(event.target.value)}>
          <option value="الكل">الكل</option>
          {uniqueSessionUniversityNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <select value={sessionSort} onChange={(event) => setSessionSort(event.target.value)}>
          <option value="sessionDate_desc">ترتيب حسب تاريخ الجلسة: الأحدث</option>
          <option value="sessionDate_asc">ترتيب حسب تاريخ الجلسة: الأقدم</option>
          <option value="deliveryDate_desc">ترتيب حسب تاريخ التسليم: الأحدث</option>
          <option value="deliveryDate_asc">ترتيب حسب تاريخ التسليم: الأقدم</option>
        </select>
        <button className="ghost-button" onClick={() => exportCsv('sessions', sessionRows.map((row) => ({
          id: row.id,
          university: row.university,
          department: row.department,
          representativeName: row.representativeName,
          sessionDate: row.sessionDate,
          studentCount: row.studentCount,
          phoneNumber: row.phoneNumber,
          offerName: row.offerName,
          offerPrice: row.offerPrice,
          receivedCards: row.receivedCards,
          deliveryDate: row.deliveryDate,
        })))}>
          <Download size={16} />
          تصدير CSV
        </button>
        <button className="ghost-button" onClick={() => window.print()}>
          <FileText size={16} />
          طباعة التقرير
        </button>
      </div>

      <div className="table-wrapper">
        <table className="data-table session-data-table">
          <thead>
            <tr>
              <th>المعرف</th>
              <th>الجامعة / القسم</th>
              <th>اسم الممثل</th>
              <th>تاريخ الجلسة</th>
              <th>عدد الطلاب</th>
              <th>رقم الهاتف</th>
              <th>العرض والسعر</th>
              <th>الكارتات المستلمة</th>
              <th>تاريخ التسليم</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSessionRows.rows.length ? paginatedSessionRows.rows.map((entry) => (
              <tr key={entry.id}>
                <td data-label="المعرف">{getDisplayedRecordId(entry.id, entry.representativeId)}</td>
                <td data-label="الجامعة / القسم">{entry.university}<br />{entry.department}</td>
                <td data-label="اسم الممثل">{entry.representativeName}</td>
                <td data-label="تاريخ الجلسة">{entry.sessionDate}</td>
                <td data-label="عدد الطلاب">{entry.studentCount}</td>
                <td data-label="رقم الهاتف">{entry.phoneNumber}</td>
                <td data-label="العرض والسعر">{entry.offerName}<br />{entry.representativeId && !entry.offerPrice ? 'غير محدد' : formatCurrency(entry.offerPrice)}</td>
                <td data-label="الكارتات المستلمة">{entry.receivedCards}</td>
                <td data-label="تاريخ التسليم">{entry.deliveryDate}</td>
                <td className="action-cell">
                  <button className="icon-button" onClick={() => setDetailModal({ type: 'session', item: entry })}><Eye size={16} /></button>
                  <button className="icon-button" onClick={() => openSessionModal(entry)}><Pencil size={16} /></button>
                  <button className="icon-button danger" onClick={() => deleteSession(entry.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={10} className="empty-state">لا توجد بيانات</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-row">
        <div className="rows-selector">
          <label>عرض</label>
          <select value={sessionRowsPerPage} onChange={(event) => { setSessionRowsPerPage(Number(event.target.value)); setSessionPage(1) }}>
            <option value={5}>5</option>
            <option value={8}>8</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
        <div className="pager">
          <button disabled={sessionPage === 1} onClick={() => setSessionPage((page) => Math.max(1, page - 1))}>السابق</button>
          <span>الصفحة {sessionPage} من {paginatedSessionRows.totalPages}</span>
          <button disabled={sessionPage >= paginatedSessionRows.totalPages} onClick={() => setSessionPage((page) => Math.min(paginatedSessionRows.totalPages, page + 1))}>التالي</button>
        </div>
      </div>
    </div>
  )

  const renderFinancialTable = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">جدول التخرج 2</p>
          <h1>السجلات المالية</h1>
        </div>
        <button className="primary-button" onClick={() => openFinancialModal()}>
          <Plus size={16} />
          إضافة سجل جديد
        </button>
      </div>

      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={16} />
          <input placeholder="بحث حسب الجامعة أو اسم الممثل" value={tableSearch} onChange={(event) => setTableSearch(event.target.value)} />
        </div>
        <select value={financialFilterUniversity} onChange={(event) => setFinancialFilterUniversity(event.target.value)}>
          <option value="الكل">الكل</option>
          {uniqueFinancialUniversityNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <select value={financialSort} onChange={(event) => setFinancialSort(event.target.value)}>
          <option value="createdAt_desc">الأحدث</option>
          <option value="createdAt_asc">الأقدم</option>
          <option value="totalAmount_desc">الإجمالي: الأعلى</option>
          <option value="totalAmount_asc">الإجمالي: الأدنى</option>
        </select>
        <button className="ghost-button" onClick={() => exportCsv('financial_records', financialRows.map((row) => ({
          id: row.id,
          university: row.university,
          department: row.department,
          representativeName: row.representativeName,
          representativePhone: row.representativePhone,
          studentCount: row.studentCount,
          offerName: row.offerName,
          offerPrice: row.offerPrice,
          priceMode: row.priceMode,
          totalAmount: row.totalAmount,
          amountReceived: row.amountReceived,
          remainingAmount: row.remainingAmount,
          fullPaymentDate: row.fullPaymentDate,
        })))}>
          <Download size={16} />
          تصدير CSV
        </button>
        <button className="ghost-button" onClick={() => window.print()}>
          <FileText size={16} />
          طباعة التقرير
        </button>
      </div>

      <div className="table-wrapper">
        <table className="data-table financial-data-table">
          <thead>
            <tr>
              <th>المعرف</th>
              <th>الجامعة / القسم</th>
              <th>اسم الممثل</th>
              <th>عدد الطلاب</th>
              <th>العرض</th>
              <th>الإجمالي</th>
              <th>المستلم</th>
              <th>المتبقي</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {paginatedFinancialRows.rows.length ? paginatedFinancialRows.rows.map((entry) => {
              const status = getPaymentStatus(entry)
              return (
                <tr key={entry.id}>
                  <td data-label="المعرف">{getDisplayedRecordId(entry.id, entry.representativeId)}</td>
                  <td data-label="الجامعة / القسم">{entry.university}<br />{entry.department}</td>
                  <td data-label="اسم الممثل / الهاتف">{entry.representativeName}<br />{entry.representativePhone}</td>
                  <td data-label="عدد الطلاب">{entry.studentCount}</td>
                  <td data-label="العرض">{entry.offerName}<br />{entry.priceMode === 'per_student' ? 'لكل طالب' : 'باقة كاملة'}</td>
                  <td data-label="الإجمالي">{entry.pricingPending ? 'بانتظار التسعير' : formatCurrency(entry.totalAmount)}</td>
                  <td data-label="المستلم">{entry.pricingPending ? '—' : formatCurrency(entry.amountReceived)}</td>
                  <td data-label="المتبقي">{entry.pricingPending ? '—' : formatCurrency(entry.remainingAmount)}</td>
                  <td data-label="الحالة"><span className={`status-badge ${status}`}>{status === 'pricing_pending' ? 'بانتظار التسعير' : status === 'fully_paid' ? 'مدفوع بالكامل' : status === 'partially_paid' ? 'مدفوع جزئياً' : 'غير مدفوع'}</span></td>
                  <td className="action-cell">
                    <button className="icon-button" onClick={() => setDetailModal({ type: 'financial', item: entry })}><Eye size={16} /></button>
                    <button className="icon-button" onClick={() => openFinancialModal(entry)}><Pencil size={16} /></button>
                    <button className="icon-button danger" onClick={() => deleteFinancial(entry.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              )
            }) : (
              <tr><td colSpan={10} className="empty-state">لا توجد بيانات</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-row">
        <div className="rows-selector">
          <label>عرض</label>
          <select value={financialRowsPerPage} onChange={(event) => { setFinancialRowsPerPage(Number(event.target.value)); setFinancialPage(1) }}>
            <option value={5}>5</option>
            <option value={8}>8</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
        <div className="pager">
          <button disabled={financialPage === 1} onClick={() => setFinancialPage((page) => Math.max(1, page - 1))}>السابق</button>
          <span>الصفحة {financialPage} من {paginatedFinancialRows.totalPages}</span>
          <button disabled={financialPage >= paginatedFinancialRows.totalPages} onClick={() => setFinancialPage((page) => Math.min(paginatedFinancialRows.totalPages, page + 1))}>التالي</button>
        </div>
      </div>
    </div>
  )

  const renderEmployees = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">إدارة الكادر</p>
          <h1>الكادر</h1>
        </div>
        <button className="primary-button" onClick={() => openEmployeeModal()}>
          <Plus size={16} />
          إضافة موظف
        </button>
      </div>

      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={16} />
          <input placeholder="بحث بالاسم أو الهاتف" value={tableSearch} onChange={(event) => setTableSearch(event.target.value)} />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table employee-data-table">
          <thead>
            <tr>
              <th>اسم الموظف</th>
              <th>الوظيفة</th>
              <th>تقييم الشهر</th>
              <th>رقم الهاتف</th>
              <th>ملاحظات</th>
              <th>إجمالي الخصومات</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {data.employees.filter((entry) => [entry.fullName, entry.phoneNumber].some((value) => value.toLowerCase().includes(tableSearch.toLowerCase()))).map((entry) => (
              <tr key={entry.id}>
                <td data-label="اسم الموظف">{entry.fullName}</td>
                <td data-label="الوظيفة">{entry.jobTitle}</td>
                <td data-label="تقييم الشهر">
                  <div className="star-row">{Array.from({ length: 5 }).map((_, index) => <Star key={`${entry.id}-${index}`} size={14} className={index < entry.monthlyEvaluation ? 'star active' : 'star'} />)}</div>
                </td>
                <td data-label="رقم الهاتف">{entry.phoneNumber}</td>
                <td data-label="ملاحظات">{entry.note || '—'}</td>
                <td data-label="إجمالي الخصومات">{formatCurrency(currentEmployeeTotals.get(entry.id) ?? 0)}</td>
                <td className="action-cell">
                  <button className="icon-button" onClick={() => setDetailModal({ type: 'employee', item: entry })}><Eye size={16} /></button>
                  <button className="icon-button" onClick={() => openEmployeeModal(entry)}><Pencil size={16} /></button>
                  <button className="icon-button danger" onClick={() => deleteEmployee(entry.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderDeductions = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">الخصومات</p>
          <h1>خصومات الكادر</h1>
        </div>
        <button className="primary-button" onClick={() => openDeductionModal()}>
          <Plus size={16} />
          إضافة خصم
        </button>
      </div>

      <div className="deduction-summary">
        <div className="summary-box">
          <span>إجمالي الخصومات</span>
          <strong>{formatCurrency(data.deductions.reduce((sum, entry) => sum + entry.amount, 0))}</strong>
        </div>
        <div className="summary-box">
          <span>أعلى موظف</span>
          <strong>{data.deductions.length ? 'أكثر من موظف واحد' : 'لا توجد خصومات'}</strong>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table deduction-data-table">
          <thead>
            <tr>
              <th>الموظف</th>
              <th>الهاتف</th>
              <th>المبلغ</th>
              <th>التاريخ</th>
              <th>السبب</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {data.deductions.map((entry) => (
              <tr key={entry.id}>
                <td data-label="الموظف">{entry.employeeName}</td>
                <td data-label="الهاتف">{entry.employeePhone}</td>
                <td data-label="المبلغ">{formatCurrency(entry.amount)}</td>
                <td data-label="التاريخ">{entry.deductionDate}</td>
                <td data-label="السبب">{entry.reason}</td>
                <td className="action-cell">
                  <button className="icon-button" onClick={() => setDetailModal({ type: 'deduction', item: entry })}><Eye size={16} /></button>
                  <button className="icon-button" onClick={() => openDeductionModal(entry)}><Pencil size={16} /></button>
                  <button className="icon-button danger" onClick={() => deleteDeduction(entry.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderMessages = () => (
    <div className="page-shell message-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">مشاركة الرسائل</p>
          <h1>رسائل واتساب</h1>
        </div>
      </div>

      <section className="panel message-panel">
        <div className="message-panel-heading">
          <div className="message-icon"><Users size={19} /></div>
          <div><h2>رسالة التخرج للكادر</h2><p>حدد تفاصيل التخرج والكادر المشارك.</p></div>
        </div>
        <div className="message-compose-grid">
          <div className="message-compose-fields">
            <div className="message-fields-grid">
              <label>تاريخ التخرج<input type="date" value={graduationMessageForm.date} onChange={(event) => setGraduationMessageForm((prev) => ({ ...prev, date: event.target.value }))} /></label>
              <label>الساعة<input type="time" value={graduationMessageForm.time} onChange={(event) => setGraduationMessageForm((prev) => ({ ...prev, time: event.target.value }))} /></label>
              <label>القسم<input value={graduationMessageForm.department} onChange={(event) => setGraduationMessageForm((prev) => ({ ...prev, department: event.target.value }))} placeholder="اسم القسم" /></label>
              <label>المكان<input value={graduationMessageForm.location} onChange={(event) => setGraduationMessageForm((prev) => ({ ...prev, location: event.target.value }))} placeholder="مكان التخرج" /></label>
              <label>المسرح<input value={graduationMessageForm.theater} onChange={(event) => setGraduationMessageForm((prev) => ({ ...prev, theater: event.target.value }))} placeholder="اسم المسرح" /></label>
            </div>
            <div className="message-staff-picker">
              <strong>الكادر الراح يطلع</strong>
              {data.employees.length ? (
                <div className="message-staff-list">
                  {data.employees.map((employee) => (
                    <label className="message-staff-option" key={employee.id}>
                      <input
                        type="checkbox"
                        checked={selectedMessageEmployeeIds.includes(employee.id)}
                        onChange={(event) => setSelectedMessageEmployeeIds((previous) => event.target.checked
                          ? [...previous, employee.id]
                          : previous.filter((id) => id !== employee.id))}
                      />
                      <span><b>{employee.fullName}</b><small>{employee.phoneNumber}</small></span>
                    </label>
                  ))}
                </div>
              ) : <p className="message-empty">أضف أسماء الكادر أولاً.</p>}
            </div>
          </div>
          <div className="message-preview-column">
            <label htmlFor="graduation-message-preview">معاينة الرسالة</label>
            <textarea id="graduation-message-preview" className="message-preview" readOnly value={graduationMessage} />
            <button
              className="primary-button message-send-button"
              disabled={!graduationMessageForm.date || !graduationMessageForm.time || !graduationMessageForm.department.trim() || !graduationMessageForm.location.trim() || !graduationMessageForm.theater.trim() || !selectedMessageEmployees.length}
              onClick={() => openWhatsApp(graduationMessage)}
            >
              <Send size={16} />
              مشاركة على واتساب
            </button>
          </div>
        </div>
      </section>

      <section className="panel message-panel deduction-message-panel">
        <div className="message-panel-heading">
          <div className="message-icon deduction-message-icon"><ReceiptText size={19} /></div>
          <div><h2>رسالة خصم</h2><p>اختر سجل الخصم لإعداد الرسالة تلقائياً.</p></div>
        </div>
        <div className="deduction-message-grid">
          <label>سجل الخصم
            <select value={selectedMessageDeduction?.id ?? ''} onChange={(event) => setSelectedDeductionMessageId(event.target.value)}>
              {!data.deductions.length && <option value="">لا توجد سجلات خصم</option>}
              {data.deductions.map((entry) => <option key={entry.id} value={entry.id}>{entry.employeeName} - {formatCurrency(entry.amount)} - {entry.reason}</option>)}
            </select>
          </label>
          <label htmlFor="deduction-message-preview">معاينة الرسالة
            <textarea id="deduction-message-preview" className="message-preview deduction-preview" readOnly value={deductionMessage} placeholder="تظهر الرسالة بعد اختيار سجل خصم" />
          </label>
        </div>
        <button
          className="primary-button message-send-button"
          disabled={!selectedMessageDeduction || !normalizeWhatsAppPhone(selectedMessageDeduction.employeePhone)}
          onClick={() => selectedMessageDeduction && openWhatsApp(deductionMessage, selectedMessageDeduction.employeePhone)}
        >
          <Send size={16} />
          فتح واتساب للموظف
        </button>
      </section>
    </div>
  )

  const renderRepresentatives = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">حسابات الدفعات</p>
          <h1>ممثلون التخرج</h1>
        </div>
        <button className="primary-button" onClick={() => openRepresentativeModal()}>
          <Plus size={16} />
          إضافة ممثل
        </button>
      </div>

      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={16} />
          <input value={tableSearch} onChange={(event) => setTableSearch(event.target.value)} placeholder="بحث بالاسم أو الجامعة أو القسم" />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table representative-table">
          <thead>
            <tr>
              <th>المعرف</th>
              <th>الممثل</th>
              <th>الجامعة / القسم</th>
              <th>رقم الهاتف</th>
              <th>تاريخ الجلسة</th>
              <th>العرض</th>
              <th>سعر الطالب</th>
              <th>الطلاب</th>
              <th>الكارتات</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {data.representatives.filter((entry) => [entry.fullName, entry.university, entry.department, entry.phoneNumber].some((value) => value.toLowerCase().includes(tableSearch.toLowerCase()))).map((entry) => {
              const studentCount = data.students.filter((student) => student.representativeId === entry.id).length
              const cardCount = studentCount * (entry.offer ? cardsPerStudent[entry.offer] : 0)
              const financialRecord = data.financialRecords.find((record) => record.representativeId === entry.id)
              const studentPrice = financialRecord?.offerPrice ?? (entry.offer ? offerPricesPerStudent[entry.offer] : 0)
              return (
                <tr key={entry.id}>
                  <td data-label="المعرف"><span className="reference-code">{formatRepresentativeCode(entry.sequenceNumber)}</span></td>
                  <td data-label="الممثل"><strong>{entry.fullName}</strong><br /><span className="muted-cell">@{entry.username}</span></td>
                  <td data-label="الجامعة / القسم">{entry.university}<br />{entry.department}</td>
                  <td data-label="رقم الهاتف">{entry.phoneNumber}</td>
                  <td data-label="تاريخ الجلسة">{entry.graduationDate}</td>
                  <td data-label="العرض">{entry.offer ? offerNames[entry.offer] : <span className="muted-cell">لم يحدد</span>}</td>
                  <td data-label="سعر الطالب">{entry.offer ? formatCurrency(studentPrice) : '—'}</td>
                  <td data-label="الطلاب">{studentCount}</td>
                  <td data-label="الكارتات"><span className="card-count-badge">{cardCount}</span></td>
                  <td className="action-cell">
                    <button className="icon-button" aria-label="عرض الطلاب" title="عرض الطلاب" onClick={() => setRepresentativeDetailId(entry.id)}><Eye size={16} /></button>
                    <button className="icon-button" aria-label="تعديل سعر الطالب" title="تعديل سعر الطالب" disabled={!financialRecord} onClick={() => financialRecord && openFinancialModal(financialRecord)}><Wallet size={16} /></button>
                    <button className="icon-button" aria-label="تعديل بيانات الممثل" title="تعديل بيانات الممثل" onClick={() => openRepresentativeModal(entry)}><Pencil size={16} /></button>
                    <button className="icon-button danger" aria-label="حذف الممثل" title="حذف الممثل" onClick={() => deleteRepresentative(entry.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              )
            })}
            {!data.representatives.length && <tr><td colSpan={10} className="empty-state">لا توجد حسابات ممثلين بعد</td></tr>}
          </tbody>
        </table>
      </div>
      {backupStatus && <div className="status-banner">{backupStatus}</div>}
    </div>
  )

  const renderBackup = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">النسخ الاحتياطي</p>
          <h1>النسخ الاحتياطي واستعادة البيانات</h1>
        </div>
      </div>

      <div className="backup-grid">
        <div className="panel backup-panel">
          <button className="primary-button wide" onClick={createBackupFile}>
            <ShieldCheck size={16} />
            إنشاء نسخة احتياطية جديدة
          </button>
          <p>سيتم حفظ جميع الجداول والكادر والخصومات والإعدادات بتنسيق JSON قابل للنقل بين ويندوز وماك.</p>
          {backupStatus && <div className="status-banner">{backupStatus}</div>}
        </div>

        <div className="panel backup-panel">
          <label className="upload-button">
            <Upload size={16} />
            استيراد نسخة احتياطية
            <input type="file" accept=".json,application/json" onChange={importBackupFile} />
          </label>
          <p>قبل الاستيراد، سيتم التحقق من الصيغة والتوافق والبيانات، مع خيارات استبدال أو دمج البيانات.</p>
          {importStatus && <div className="status-banner">{importStatus}</div>}
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">الإعدادات</p>
          <h1>إعدادات التطبيق</h1>
        </div>
      </div>

      <div className="settings-grid">
        <div className="panel settings-panel">
          <label>
            اسم التطبيق
            <input value={data.settings.appName} onChange={(event) => setData((prev) => ({ ...prev, settings: { ...prev.settings, appName: event.target.value } }))} />
          </label>
          <label>
            العملة
            <select value={data.settings.currency} onChange={(event) => setData((prev) => ({ ...prev, settings: { ...prev.settings, currency: event.target.value } }))}>
              <option value="IQD">IQD</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label>
            المظهر
            <select value={data.settings.theme} onChange={(event) => setData((prev) => ({ ...prev, settings: { ...prev.settings, theme: event.target.value as ThemeMode } }))}>
              <option value="dark">داكن</option>
              <option value="light">فاتح</option>
            </select>
          </label>
          <label>
            موقع قاعدة البيانات
            <input value={data.settings.databaseLocation} readOnly />
          </label>
          <label>
            نسخة الاحتياطية
            <input value={data.settings.backupInfo} onChange={(event) => setData((prev) => ({ ...prev, settings: { ...prev.settings, backupInfo: event.target.value } }))} />
          </label>
        </div>

        <div className="panel settings-panel">
          <div className="meta-row"><span>الإصدار</span><strong>{data.settings.version}</strong></div>
          <div className="meta-row"><span>الموقع</span><strong>{data.settings.databaseLocation}</strong></div>
          <div className="meta-row"><span>الحالة</span><strong>متصل محلياً</strong></div>
          <button className="danger-button" onClick={handleLogout}><LogOut size={16} />تسجيل الخروج</button>
        </div>
      </div>
    </div>
  )

  const renderRepresentativePortal = (representative: Representative) => {
    const students = data.students.filter((entry) => entry.representativeId === representative.id)
    const cardsPerStudentCount = representative.offer ? cardsPerStudent[representative.offer] : 0
    const representativeUnitPrice = data.financialRecords.find((entry) => entry.representativeId === representative.id)?.offerPrice
      ?? (representative.offer ? offerPricesPerStudent[representative.offer] : 0)

    return (
      <div className="representative-portal">
        <header className="representative-topbar">
          <div className="rep-brand">
            <img className="brand-logo" src="/mano-logo.svg" alt="Mano Photographer" />
            <div><strong>بوابة ممثل الدفعة</strong><span>{representative.university} / {representative.department}</span></div>
          </div>
          <button className="danger-button" onClick={handleLogout}><LogOut size={16} />تسجيل الخروج</button>
        </header>

        <main className="representative-main">
          <div className="page-header">
            <div>
              <p className="eyebrow">مرحباً {representative.fullName}</p>
              <h1>قائمة طلاب الدفعة</h1>
            </div>
            <div className="rep-session-date"><CalendarRange size={17} /><span>تاريخ الجلسة</span><strong>{representative.graduationDate}</strong></div>
          </div>

          {!representative.offer ? (
            <section className="panel offer-selection">
              <div className="panel-header">
                <p className="eyebrow">اختيار لمرة واحدة</p>
                <h3>اختر عرض الدفعة</h3>
                <p>أدخل بيانات جامعتك وقسمك أولاً. بعد اختيار العرض يثبت ولا يمكن تغييره.</p>
              </div>
              <div className="rep-school-fields">
                <label>اسم الجامعة<input required value={representativeSchoolForm.university} onChange={(event) => setRepresentativeSchoolForm((prev) => ({ ...prev, university: event.target.value }))} placeholder="اكتب اسم الجامعة" /></label>
                <label>القسم<input required value={representativeSchoolForm.department} onChange={(event) => setRepresentativeSchoolForm((prev) => ({ ...prev, department: event.target.value }))} placeholder="اكتب اسم القسم" /></label>
              </div>
              {representativeSetupMessage && <div className="status-banner">{representativeSetupMessage}</div>}
              <div className="offer-choice-grid">
                {(['offer_1', 'offer_2', 'offer_3'] as const).map((offer) => (
                  <button className="offer-choice" key={offer} disabled={!representativeSchoolForm.university.trim() || !representativeSchoolForm.department.trim()} onClick={() => chooseRepresentativeOffer(offer)}>
                    <span>{offerNames[offer]}</span>
                    <strong>{formatCurrency(offerPricesPerStudent[offer])} لكل طالب</strong>
                    <small>{cardsPerStudent[offer]} {cardsPerStudent[offer] === 1 ? 'كارت للطالب' : 'كروت للطالب'}</small>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <>
              <section className="panel rep-school-settings">
                <div className="rep-roster-header">
                  <div><h2>بيانات الجداول</h2><p>أي تحديث للجامعة أو القسم ينعكس تلقائياً في جدولي الإدارة.</p></div>
                </div>
                <form className="rep-school-form" onSubmit={(event) => { event.preventDefault(); saveRepresentativeSchool() }}>
                  <label>اسم الجامعة<input required value={representativeSchoolForm.university} onChange={(event) => setRepresentativeSchoolForm((prev) => ({ ...prev, university: event.target.value }))} /></label>
                  <label>القسم<input required value={representativeSchoolForm.department} onChange={(event) => setRepresentativeSchoolForm((prev) => ({ ...prev, department: event.target.value }))} /></label>
                  <button className="primary-button" type="submit"><Save size={16} />حفظ بيانات الجداول</button>
                </form>
                {representativeSetupMessage && <div className="status-banner">{representativeSetupMessage}</div>}
              </section>

              <section className="rep-metrics">
                <div className="rep-metric"><span>عدد الطلاب</span><strong>{students.length}</strong></div>
                <div className="rep-metric"><span>العرض المثبت</span><strong>{offerNames[representative.offer]}</strong></div>
                <div className="rep-metric"><span>سعر الطالب</span><strong>{formatCurrency(representativeUnitPrice)}</strong></div>
                <div className="rep-metric card-metric"><span>إجمالي الكارتات</span><strong>{students.length * cardsPerStudentCount}</strong></div>
              </section>

              <section className="panel rep-roster-panel">
                <div className="rep-roster-header">
                  <div><h2>الطلاب المسجلون</h2><p>تقدر تضيف أو تعدل أسماء الطلاب بأي وقت.</p></div>
                  <button className="primary-button" onClick={() => openStudentModal()}><Plus size={16} />إضافة طالب</button>
                </div>
                {students.length ? (
                  <div className="student-roster">
                    {students.map((student, index) => (
                      <article className="student-row" key={student.id}>
                        <span className="student-index">{index + 1}</span>
                        <strong>{student.fullName}</strong>
                        <span className="student-card-count">{cardsPerStudentCount} {cardsPerStudentCount === 1 ? 'كارت' : 'كروت'}</span>
                        <div className="student-actions">
                          <button className="icon-button" aria-label="تعديل اسم الطالب" title="تعديل" onClick={() => openStudentModal(student)}><Pencil size={15} /></button>
                          <button className="icon-button danger" aria-label="حذف الطالب" title="حذف" onClick={() => deleteStudent(student.id)}><Trash2 size={15} /></button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <div className="roster-empty"><Users size={24} /><strong>القائمة فارغة</strong><span>ابدأ بإضافة أسماء طلاب الدفعة.</span></div>}
                <div className="fixed-card-total"><ReceiptText size={17} /><span>الكارتات المطلوبة حسب العرض</span><strong>{students.length * cardsPerStudentCount}</strong></div>
              </section>
            </>
          )}
        </main>

        {studentModalOpen && (
          <div className="modal-backdrop" onClick={() => setStudentModalOpen(false)}>
            <form className="modal-card student-modal" onSubmit={(event) => { event.preventDefault(); saveStudent() }} onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <h3>{studentEditId ? 'تعديل اسم الطالب' : 'إضافة طالب جديد'}</h3>
                <button type="button" className="icon-button" aria-label="إغلاق" onClick={() => setStudentModalOpen(false)}><X size={16} /></button>
              </div>
              <label>اسم الطالب الكامل<input autoFocus required value={studentForm.fullName} onChange={(event) => setStudentForm({ fullName: event.target.value })} placeholder="اكتب اسم الطالب" /></label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setStudentModalOpen(false)}>إلغاء</button>
                <button type="submit" className="primary-button"><Save size={16} />حفظ</button>
              </div>
            </form>
          </div>
        )}
      </div>
    )
  }

  const detailRepresentative = data.representatives.find((entry) => entry.id === representativeDetailId)
  const detailRepresentativeStudents = detailRepresentative
    ? data.students.filter((entry) => entry.representativeId === detailRepresentative.id)
    : []
  const detailRepresentativeFinancial = detailRepresentative
    ? data.financialRecords.find((entry) => entry.representativeId === detailRepresentative.id)
    : undefined
  const detailStudentsRepresentativeId = detailModal?.type === 'session' || detailModal?.type === 'financial'
    ? detailModal.item.representativeId
    : undefined
  const detailStudents = detailStudentsRepresentativeId
    ? data.students.filter((entry) => entry.representativeId === detailStudentsRepresentativeId)
    : []
  const renderDetailFields = (fields: Array<[string, string | number]>) => (
    <div className="record-detail-grid">
      {fields.map(([label, value]) => (
        <div className="record-detail-field" key={label}>
          <span>{label}</span>
          <strong>{String(value).trim() || '—'}</strong>
        </div>
      ))}
    </div>
  )

  if (!isAuthenticated || (!isAdmin && !activeRepresentative)) {
    return (
      <div className="login-page">
        <div className="login-card">
          <section className="login-story">
            <div className="login-brand">
              <img className="brand-logo" src="/mano-logo.svg" alt="Mano Photographer" />
            </div>
            <div className="login-story-copy">
              <span className="login-kicker">إدارة واضحة. شغل أهدأ.</span>
              <h1>كل تفاصيل التخرج، بمكان واحد.</h1>
              <p>مساحة عملك لتنظيم الجلسات، متابعة الحسابات، وإدارة الفريق بكل بساطة.</p>
            </div>
            <div className="login-local-note"><span /> بياناتك محفوظة على هذا الجهاز</div>
          </section>

          <form className="login-form" onSubmit={(event) => { event.preventDefault(); handleLogin() }}>
            <div className="login-header">
              <span className="login-form-mark"><UserCheck size={19} /></span>
              <p className="eyebrow">مساحة العمل</p>
              <h2>أهلاً بعودتك</h2>
              <p>سجّل دخولك للمتابعة</p>
            </div>

            <div className="field-group">
              <label htmlFor="login-username">اسم المستخدم</label>
              <input
                id="login-username"
                autoComplete="username"
                required
                value={credentials.username}
                onChange={(event) => setCredentials((prev) => ({ ...prev, username: event.target.value }))}
                placeholder="أدخل اسم المستخدم"
              />
            </div>

            <div className="field-group">
              <label htmlFor="login-password">كلمة المرور</label>
              <div className="password-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={credentials.password}
                onChange={(event) => setCredentials((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="أدخل كلمة المرور"
              />
                <button className="password-toggle" type="button" aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'} onClick={() => setShowPassword((prev) => !prev)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {loginError && <div className="login-error" role="alert">{loginError}</div>}
            {storageMessage && <div className="login-storage-warning" role="status">{storageMessage}</div>}

            <button type="submit" className="primary-button wide login-submit">
              تسجيل الدخول
              <UserCheck size={17} />
            </button>
            <div className="login-form-foot"><ShieldCheck size={15} /> جلسة خاصة على هذا الجهاز</div>
          </form>
        </div>
      </div>
    )
  }

  if (activeRepresentative) return renderRepresentativePortal(activeRepresentative)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-logo" src="/mano-logo.svg" alt="Mano Photographer" />
          <div>
            <strong>{data.settings.appName}</strong>
                <span>إدارة محلية</span>
          </div>
        </div>

        <button className="mobile-nav-toggle" aria-expanded={mobileNavOpen} aria-controls="mobile-section-menu" onClick={() => setMobileNavOpen((open) => !open)}>
          <ChevronDown size={17} />
          <span>الأقسام</span>
        </button>

        <nav className="side-menu">
          {menuItems.map(({ key, label, icon: Icon }) => (
            <button key={key} className={page === key ? 'nav-item active' : 'nav-item'} onClick={() => setPage(key)}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item small" onClick={() => setData((prev) => ({ ...prev, settings: { ...prev.settings, theme: prev.settings.theme === 'dark' ? 'light' : 'dark' } }))}>
            {data.settings.theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
            <span>{data.settings.theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>
          </button>
        </div>

        {mobileNavOpen && (
          <div className="mobile-nav-backdrop" onClick={() => setMobileNavOpen(false)}>
            <nav id="mobile-section-menu" className="mobile-nav-panel" aria-label="أقسام النظام" onClick={(event) => event.stopPropagation()}>
              <div className="mobile-nav-heading">
                <strong>كل الأقسام</strong>
                <button className="icon-button" aria-label="إغلاق القائمة" onClick={() => setMobileNavOpen(false)}><X size={17} /></button>
              </div>
              <div className="mobile-nav-grid">
                {menuItems.map(({ key, label, icon: Icon }) => (
                  <button key={key} className={page === key ? 'mobile-nav-item active' : 'mobile-nav-item'} onClick={() => { setPage(key); setMobileNavOpen(false) }}>
                    <Icon size={19} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>
        )}
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-title">
            <strong>{page === 'dashboard' ? 'لوحة التحكم' : page === 'sessions' ? 'جلسات التخرج' : page === 'financial' ? 'السجلات المالية' : page === 'representatives' ? 'ممثلون التخرج' : page === 'employees' ? 'الكادر' : page === 'deductions' ? 'الخصومات' : page === 'messages' ? 'رسائل واتساب' : page === 'backup' ? 'النسخ الاحتياطي' : 'الإعدادات'}</strong>
            <span className="topbar-meta">إصدار {data.settings.version}<span className={`save-indicator${storageMessage ? ' has-warning' : ''}`} role="status" title={storageMessage || 'تُحفظ التغييرات على هذا الجهاز'}><i />{storageMessage || 'حفظ محلي تلقائي'}</span></span>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button" onClick={() => setPage('backup')}>
              <BackupIcon />
              نسخ احتياطي
            </button>
            <button className="danger-button" onClick={handleLogout}><LogOut size={16} />تسجيل الخروج</button>
          </div>
        </header>

        {page === 'dashboard' && renderDashboard()}
        {page === 'sessions' && renderSessionTable()}
        {page === 'financial' && renderFinancialTable()}
        {page === 'representatives' && renderRepresentatives()}
        {page === 'employees' && renderEmployees()}
        {page === 'deductions' && renderDeductions()}
        {page === 'messages' && renderMessages()}
        {page === 'backup' && renderBackup()}
        {page === 'settings' && renderSettings()}
      </main>

      {sessionModalOpen && (
        <div className="modal-backdrop" onClick={() => setSessionModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>إضافة / تعديل جلسة</h3>
              <button className="icon-button" onClick={() => setSessionModalOpen(false)}><X size={16} /></button>
            </div>
            <div className="form-grid">
              <label>اسم الجامعة <input readOnly={Boolean(sessionForm.representativeId)} value={sessionForm.university} onChange={(event) => setSessionForm((prev) => ({ ...prev, university: event.target.value }))} /></label>
              <label>اسم القسم <input readOnly={Boolean(sessionForm.representativeId)} value={sessionForm.department} onChange={(event) => setSessionForm((prev) => ({ ...prev, department: event.target.value }))} /></label>
              <label>اسم الممثل <input readOnly={Boolean(sessionForm.representativeId)} value={sessionForm.representativeName} onChange={(event) => setSessionForm((prev) => ({ ...prev, representativeName: event.target.value }))} /></label>
              <label>رقم الشخص <input readOnly={Boolean(sessionForm.representativeId)} value={sessionForm.phoneNumber} onChange={(event) => setSessionForm((prev) => ({ ...prev, phoneNumber: event.target.value }))} /></label>
              <label>تاريخ الجلسة <input readOnly={Boolean(sessionForm.representativeId)} type="date" value={sessionForm.sessionDate} onChange={(event) => setSessionForm((prev) => ({ ...prev, sessionDate: event.target.value }))} /></label>
              <label>عدد الطلاب <input readOnly={Boolean(sessionForm.representativeId)} type="number" min={0} value={sessionForm.studentCount} onChange={(event) => setSessionForm((prev) => ({ ...prev, studentCount: Number(event.target.value) }))} /></label>
              <label>اسم العرض <input readOnly={Boolean(sessionForm.representativeId)} value={sessionForm.offerName} onChange={(event) => setSessionForm((prev) => ({ ...prev, offerName: event.target.value }))} /></label>
              <label>سعر العرض <input readOnly={Boolean(sessionForm.representativeId)} type="number" min={0} value={sessionForm.offerPrice} onChange={(event) => setSessionForm((prev) => ({ ...prev, offerPrice: Number(event.target.value) }))} /></label>
              <label>عدد الكارتات <input readOnly={Boolean(sessionForm.representativeId)} type="number" min={0} value={sessionForm.receivedCards} onChange={(event) => setSessionForm((prev) => ({ ...prev, receivedCards: Number(event.target.value) }))} /></label>
              <label>تاريخ التسليم <input type="date" value={sessionForm.deliveryDate} onChange={(event) => setSessionForm((prev) => ({ ...prev, deliveryDate: event.target.value }))} /></label>
            </div>
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setSessionModalOpen(false)}>إلغاء</button>
              <button className="primary-button" onClick={saveSession}><Save size={16} />حفظ</button>
            </div>
          </div>
        </div>
      )}

      {financialModalOpen && (
        <div className="modal-backdrop" onClick={() => setFinancialModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>إضافة / تعديل السجل المالي</h3>
              <button className="icon-button" onClick={() => setFinancialModalOpen(false)}><X size={16} /></button>
            </div>
            <div className="form-grid">
              <label>اسم الجامعة <input readOnly={Boolean(financialForm.representativeId)} value={financialForm.university} onChange={(event) => setFinancialForm((prev) => ({ ...prev, university: event.target.value }))} /></label>
              <label>اسم القسم <input readOnly={Boolean(financialForm.representativeId)} value={financialForm.department} onChange={(event) => setFinancialForm((prev) => ({ ...prev, department: event.target.value }))} /></label>
              <label>اسم الممثل <input readOnly={Boolean(financialForm.representativeId)} value={financialForm.representativeName} onChange={(event) => setFinancialForm((prev) => ({ ...prev, representativeName: event.target.value }))} /></label>
              <label>رقم الممثل <input readOnly={Boolean(financialForm.representativeId)} value={financialForm.representativePhone} onChange={(event) => setFinancialForm((prev) => ({ ...prev, representativePhone: event.target.value }))} /></label>
              <label>عدد الطلاب <input readOnly={Boolean(financialForm.representativeId)} type="number" min={0} value={financialForm.studentCount} onChange={(event) => setFinancialForm((prev) => ({ ...prev, studentCount: Number(event.target.value) }))} /></label>
              <label>اسم العرض <input readOnly={Boolean(financialForm.representativeId)} value={financialForm.offerName} onChange={(event) => setFinancialForm((prev) => ({ ...prev, offerName: event.target.value }))} /></label>
              <label>{financialForm.representativeId ? 'سعر الطالب' : 'سعر العرض'} <input type="number" min={0} value={financialForm.offerPrice} onChange={(event) => setFinancialForm((prev) => ({ ...prev, offerPrice: Number(event.target.value) }))} />{financialForm.representativeId && <small className="field-help">السعر لكل طالب، والإجمالي يتحدث تلقائياً حسب العدد.</small>}</label>
              <label>نوع السعر
                {financialForm.representativeId
                  ? <input readOnly value="لكل طالب" />
                  : <select value={financialForm.priceMode} onChange={(event) => setFinancialForm((prev) => ({ ...prev, priceMode: event.target.value as OfferMode }))}>
                    <option value="per_student">لكل طالب</option>
                    <option value="package">باقة كاملة</option>
                  </select>}
              </label>
              <label>إجمالي المبلغ <input readOnly type="number" min={0} value={financialForm.totalAmount} onChange={(event) => setFinancialForm((prev) => ({ ...prev, totalAmount: Number(event.target.value) }))} /></label>
              <label>المبلغ المستلم <input type="number" min={0} value={financialForm.amountReceived} onChange={(event) => setFinancialForm((prev) => ({ ...prev, amountReceived: Number(event.target.value) }))} /></label>
              <label>المبلغ المتبقي <input readOnly type="number" min={0} value={financialForm.remainingAmount} onChange={(event) => setFinancialForm((prev) => ({ ...prev, remainingAmount: Number(event.target.value) }))} /></label>
              <label>تاريخ تسليم المبلغ الكامل <input type="date" value={financialForm.fullPaymentDate} onChange={(event) => setFinancialForm((prev) => ({ ...prev, fullPaymentDate: event.target.value }))} /></label>
            </div>
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setFinancialModalOpen(false)}>إلغاء</button>
              <button className="primary-button" onClick={saveFinancial}><Save size={16} />حفظ</button>
            </div>
          </div>
        </div>
      )}

      {employeeModalOpen && (
        <div className="modal-backdrop" onClick={() => setEmployeeModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>إضافة / تعديل موظف</h3>
              <button className="icon-button" onClick={() => setEmployeeModalOpen(false)}><X size={16} /></button>
            </div>
            <div className="form-grid">
              <label>الاسم الثلاثي <input value={employeeForm.fullName} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, fullName: event.target.value }))} /></label>
              <label>الوظيفة <input value={employeeForm.jobTitle} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, jobTitle: event.target.value }))} /></label>
              <label>تقييم الشهر <input type="number" min={1} max={5} value={employeeForm.monthlyEvaluation} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, monthlyEvaluation: Number(event.target.value) }))} /></label>
              <label>رقم الهاتف <input value={employeeForm.phoneNumber} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, phoneNumber: event.target.value }))} /></label>
              <label className="full-width">ملاحظات / تقييم <textarea rows={4} value={employeeForm.note} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, note: event.target.value }))} /></label>
            </div>
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setEmployeeModalOpen(false)}>إلغاء</button>
              <button className="primary-button" onClick={saveEmployee}><Save size={16} />حفظ</button>
            </div>
          </div>
        </div>
      )}

      {deductionModalOpen && (
        <div className="modal-backdrop" onClick={() => setDeductionModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>إضافة / تعديل خصم</h3>
              <button className="icon-button" onClick={() => setDeductionModalOpen(false)}><X size={16} /></button>
            </div>
            <div className="form-grid">
              <label>الموظف
                <select value={deductionForm.employeeId} onChange={(event) => setDeductionForm((prev) => ({ ...prev, employeeId: event.target.value }))}>
                  <option value="">اختر موظفاً</option>
                  {data.employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.fullName} - {employee.phoneNumber}</option>
                  ))}
                </select>
              </label>
              <label>مبلغ الخصم <input type="number" min={0} value={deductionForm.amount} onChange={(event) => setDeductionForm((prev) => ({ ...prev, amount: Number(event.target.value) }))} /></label>
              <label>تاريخ الخصم <input type="date" value={deductionForm.deductionDate} onChange={(event) => setDeductionForm((prev) => ({ ...prev, deductionDate: event.target.value }))} /></label>
              <label className="full-width">سبب الخصم <textarea rows={4} value={deductionForm.reason} onChange={(event) => setDeductionForm((prev) => ({ ...prev, reason: event.target.value }))} /></label>
            </div>
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setDeductionModalOpen(false)}>إلغاء</button>
              <button className="primary-button" onClick={saveDeduction}><Save size={16} />حفظ</button>
            </div>
          </div>
        </div>
      )}

      {representativeModalOpen && (
        <div className="modal-backdrop" onClick={() => setRepresentativeModalOpen(false)}>
          <form className="modal-card" onSubmit={(event) => { event.preventDefault(); saveRepresentative() }} onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{representativeForm.id ? 'تعديل بيانات الممثل' : 'إنشاء حساب ممثل'}</h3>
              <button type="button" className="icon-button" aria-label="إغلاق" onClick={() => setRepresentativeModalOpen(false)}><X size={16} /></button>
            </div>
            <div className="form-grid">
              <label>الاسم الثلاثي<input required value={representativeForm.fullName} onChange={(event) => setRepresentativeForm((prev) => ({ ...prev, fullName: event.target.value }))} /></label>
              <label>رقم الهاتف<input required type="tel" value={representativeForm.phoneNumber} onChange={(event) => setRepresentativeForm((prev) => ({ ...prev, phoneNumber: event.target.value }))} /></label>
              <label>اسم المستخدم<input required autoComplete="off" value={representativeForm.username} onChange={(event) => setRepresentativeForm((prev) => ({ ...prev, username: event.target.value }))} /></label>
              <label>كلمة المرور<input required type="password" autoComplete="new-password" value={representativeForm.password} onChange={(event) => setRepresentativeForm((prev) => ({ ...prev, password: event.target.value }))} /></label>
              <label>تاريخ جلسة التخرج<input required type="date" value={representativeForm.graduationDate} onChange={(event) => setRepresentativeForm((prev) => ({ ...prev, graduationDate: event.target.value }))} /></label>
              <div className="offer-readonly-note"><ShieldCheck size={16} /> يختار الممثل العرض عند أول دخول، ولا يمكن تغييره لاحقاً.</div>
            </div>
            {backupStatus && <div className="status-banner">{backupStatus}</div>}
            <div className="modal-actions">
              <button type="button" className="ghost-button" onClick={() => setRepresentativeModalOpen(false)}>إلغاء</button>
              <button type="submit" className="primary-button"><Save size={16} />حفظ الحساب</button>
            </div>
          </form>
        </div>
      )}

      {detailModal && (
        <div className="modal-backdrop" onClick={() => setDetailModal(null)}>
          <div className="modal-card detail-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{detailModal.type === 'session' ? 'تفاصيل جلسة التخرج' : detailModal.type === 'financial' ? 'تفاصيل السجل المالي' : detailModal.type === 'employee' ? 'تفاصيل الموظف' : 'تفاصيل الخصم'}</h3>
              <button className="icon-button" onClick={() => setDetailModal(null)}><X size={16} /></button>
            </div>
            <div className="detail-body">
              {detailModal.type === 'session' && (
                <>
                  {renderDetailFields([
                    ['المعرف', getDisplayedRecordId(detailModal.item.id, detailModal.item.representativeId)],
                    ['اسم الجامعة', detailModal.item.university],
                    ['القسم', detailModal.item.department],
                    ['اسم الممثل', detailModal.item.representativeName],
                    ['رقم الهاتف', detailModal.item.phoneNumber],
                    ['تاريخ الجلسة', detailModal.item.sessionDate],
                    ['عدد الطلاب', detailModal.item.studentCount],
                    ['العرض', detailModal.item.offerName],
                    ['سعر الطالب', formatCurrency(detailModal.item.offerPrice)],
                    ['الكارتات المستلمة', detailModal.item.receivedCards],
                    ['تاريخ التسليم', detailModal.item.deliveryDate],
                    ['تاريخ إنشاء السجل', new Date(detailModal.item.createdAt).toLocaleString('ar-IQ', { numberingSystem: 'latn' })],
                  ])}
                  {detailStudentsRepresentativeId && <section className="detail-students-section"><h4>أسماء الطلاب</h4>{detailStudents.length
                    ? <ol>{detailStudents.map((student) => <li key={student.id}>{student.fullName}</li>)}</ol>
                    : <p>لا توجد أسماء طلاب مسجلة.</p>}</section>}
                </>
              )}
              {detailModal.type === 'financial' && (
                <>
                  {renderDetailFields([
                    ['المعرف', getDisplayedRecordId(detailModal.item.id, detailModal.item.representativeId)],
                    ['اسم الجامعة', detailModal.item.university],
                    ['القسم', detailModal.item.department],
                    ['اسم الممثل', detailModal.item.representativeName],
                    ['رقم الهاتف', detailModal.item.representativePhone],
                    ['عدد الطلاب', detailModal.item.studentCount],
                    ['العرض', detailModal.item.offerName],
                    ['نوع السعر', detailModal.item.priceMode === 'per_student' ? 'لكل طالب' : 'باقة كاملة'],
                    ['سعر الطالب', formatCurrency(detailModal.item.offerPrice)],
                    ['الإجمالي', detailModal.item.pricingPending ? 'بانتظار التسعير' : formatCurrency(detailModal.item.totalAmount)],
                    ['المبلغ المستلم', formatCurrency(detailModal.item.amountReceived)],
                    ['المبلغ المتبقي', formatCurrency(detailModal.item.remainingAmount)],
                    ['تاريخ تسليم المبلغ الكامل', detailModal.item.fullPaymentDate],
                    ['تاريخ إنشاء السجل', new Date(detailModal.item.createdAt).toLocaleString('ar-IQ', { numberingSystem: 'latn' })],
                  ])}
                  {detailStudentsRepresentativeId && <section className="detail-students-section"><h4>أسماء الطلاب</h4>{detailStudents.length
                    ? <ol>{detailStudents.map((student) => <li key={student.id}>{student.fullName}</li>)}</ol>
                    : <p>لا توجد أسماء طلاب مسجلة.</p>}</section>}
                </>
              )}
              {detailModal.type === 'employee' && (
                renderDetailFields([
                  ['الاسم الثلاثي', detailModal.item.fullName],
                  ['الوظيفة', detailModal.item.jobTitle],
                  ['تقييم الشهر', `${detailModal.item.monthlyEvaluation} من 5`],
                  ['رقم الهاتف', detailModal.item.phoneNumber],
                  ['ملاحظات', detailModal.item.note],
                  ['إجمالي الخصومات', formatCurrency(currentEmployeeTotals.get(detailModal.item.id) ?? 0)],
                  ['تاريخ إنشاء السجل', new Date(detailModal.item.createdAt).toLocaleString('ar-IQ', { numberingSystem: 'latn' })],
                ])
              )}
              {detailModal.type === 'deduction' && (
                renderDetailFields([
                  ['اسم الموظف', detailModal.item.employeeName],
                  ['رقم الهاتف', detailModal.item.employeePhone],
                  ['مبلغ الخصم', formatCurrency(detailModal.item.amount)],
                  ['تاريخ الخصم', detailModal.item.deductionDate],
                  ['السبب', detailModal.item.reason],
                  ['تاريخ إنشاء السجل', new Date(detailModal.item.createdAt).toLocaleString('ar-IQ', { numberingSystem: 'latn' })],
                ])
              )}
            </div>
          </div>
        </div>
      )}

      {detailRepresentative && (
        <div className="modal-backdrop" onClick={() => setRepresentativeDetailId(null)}>
          <div className="modal-card representative-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div><h3>{detailRepresentative.fullName}</h3><span>{detailRepresentative.university} / {detailRepresentative.department}</span></div>
              <button className="icon-button" aria-label="إغلاق" onClick={() => setRepresentativeDetailId(null)}><X size={16} /></button>
            </div>
            <div className="representative-detail-fields">
              <div><span>المعرف</span><strong>{formatRepresentativeCode(detailRepresentative.sequenceNumber)}</strong></div>
              <div><span>الاسم الثلاثي</span><strong>{detailRepresentative.fullName}</strong></div>
              <div><span>رقم الهاتف</span><strong>{detailRepresentative.phoneNumber}</strong></div>
              <div><span>اسم المستخدم</span><strong>{detailRepresentative.username}</strong></div>
              <div><span>اسم الجامعة</span><strong>{detailRepresentative.university}</strong></div>
              <div><span>القسم</span><strong>{detailRepresentative.department}</strong></div>
              <div><span>كروت لكل طالب</span><strong>{detailRepresentative.offer ? cardsPerStudent[detailRepresentative.offer] : 0}</strong></div>
              <div><span>سعر الطالب</span><strong>{detailRepresentative.offer ? formatCurrency(detailRepresentativeFinancial?.offerPrice ?? offerPricesPerStudent[detailRepresentative.offer]) : '—'}</strong></div>
            </div>
            <div className="representative-detail-stats">
              <div><span>العرض</span><strong>{detailRepresentative.offer ? offerNames[detailRepresentative.offer] : 'لم يحدد بعد'}</strong></div>
              <div><span>عدد الطلاب</span><strong>{detailRepresentativeStudents.length}</strong></div>
              <div><span>إجمالي الكارتات</span><strong>{detailRepresentativeStudents.length * (detailRepresentative.offer ? cardsPerStudent[detailRepresentative.offer] : 0)}</strong></div>
              <div><span>تاريخ الجلسة</span><strong>{detailRepresentative.graduationDate}</strong></div>
            </div>
            <div className="student-roster admin-roster">
              {detailRepresentativeStudents.map((student, index) => (
                <article className="student-row" key={student.id}>
                  <span className="student-index">{index + 1}</span>
                  <strong>{student.fullName}</strong>
                  <span className="student-card-count">{detailRepresentative.offer ? cardsPerStudent[detailRepresentative.offer] : 0} كارت</span>
                </article>
              ))}
              {!detailRepresentativeStudents.length && <div className="empty-state">لم تتم إضافة طلاب بعد</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BackupIcon() {
  return <ChevronDown size={16} />
}

export default App
