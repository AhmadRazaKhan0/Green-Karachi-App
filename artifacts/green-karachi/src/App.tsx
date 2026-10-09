import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, Banknote, BarChart3,
  Bell, Boxes, Building2, Check, CircleAlert, ClipboardList,
  Clock3, CreditCard, FileText, Filter, Flower2, Home, Leaf, LogOut, Menu,
  Package, Plus, Search, Settings, ShieldCheck, ShoppingBasket, Sprout,
  Truck, Users, X,
} from 'lucide-react';
import { Link, Redirect, Route, Switch, Router as WouterRouter, useLocation, useParams } from 'wouter';
import {
  getGetCatalogQueryKey, getGetDashboardQueryKey, getGetMeQueryKey, getHealthCheckQueryKey,
  getGetReportsQueryKey, getListCustomersQueryKey, getListInvoicesQueryKey,
  getListOrdersQueryKey, getListProductsQueryKey, getListQuotationsQueryKey,
  getListStockMovementsQueryKey, getListUsersQueryKey, useCreateCustomer,
  useCreateInvoice, useCreateOrder, useCreateProduct, useCreateQuotation,
  useCreateStockMovement, useGetCatalog, useGetDashboard, useGetMe,
  useGetReports, useHealthCheck, useListCustomers, useListInvoices,
  useListOrders, useListProducts, useListQuotations, useListStockMovements,
  useListUsers, useRecordPayment, useSaveMe, useUpdateCustomer,
  useUpdateOrderStatus, useUpdateProduct, useUpdateQuotationStatus,
  useUpdateUser,
} from '@workspace/api-client-react';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 25_000, retry: 1, refetchOnWindowFocus: false } },
});
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#14532D',
    colorForeground: '#17231B',
    colorMutedForeground: '#657468',
    colorDanger: '#B83B2D',
    colorBackground: '#FFFFFF',
    colorInput: '#F8FAF7',
    colorInputForeground: '#17231B',
    colorNeutral: '#DDE6DB',
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#17231B] font-bold',
    headerSubtitle: 'text-[#657468]',
    socialButtonsBlockButtonText: 'text-[#17231B] font-semibold',
    formFieldLabel: 'text-[#34483A] font-semibold',
    footerActionLink: 'text-[#14532D] font-semibold',
    footerActionText: 'text-[#657468]',
    dividerText: 'text-[#657468]',
    identityPreviewEditButton: 'text-[#14532D]',
    formFieldSuccessText: 'text-[#176334]',
    alertText: 'text-[#17231B]',
    logoBox: 'rounded-xl',
    logoImage: 'rounded-xl',
    socialButtonsBlockButton: 'border border-[#DDE6DB] bg-[#FAFCF8] hover:bg-[#F0F7EF]',
    formButtonPrimary: 'bg-[#14532D] hover:bg-[#1B6A3C] shadow-none',
    formFieldInput: 'border-[#DDE6DB] bg-[#F8FAF7] text-[#17231B]',
    footerAction: 'border-t border-[#E7ECE5]',
    dividerLine: 'bg-[#DDE6DB]',
    alert: 'bg-[#FFF4F1] border-[#F3D8D1]',
    otpCodeFieldInput: 'border-[#DDE6DB] bg-[#F8FAF7]',
    formFieldRow: 'gap-2',
    main: 'gap-4',
  },
};

type ModalKind = 'product' | 'stock' | 'customer' | 'order' | 'quotation' | 'invoice' | 'payment' | 'profile' | 'role';
type ModalState = { kind: ModalKind; entity?: any } | null;
type Fields = Record<string, string>;

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: Home, roles: ['admin', 'staff', 'customer'] },
  { path: '/inventory', label: 'Inventory', icon: Boxes, roles: ['admin', 'staff'] },
  { path: '/catalog', label: 'Wholesale catalog', icon: ShoppingBasket, roles: ['admin', 'staff', 'customer'] },
  { path: '/customers', label: 'Customers', icon: Users, roles: ['admin', 'staff'] },
  { path: '/orders', label: 'Orders', icon: ClipboardList, roles: ['admin', 'staff', 'customer'] },
  { path: '/quotations', label: 'Quotations', icon: FileText, roles: ['admin', 'staff', 'customer'] },
  { path: '/invoices', label: 'Invoices & collection', icon: CreditCard, roles: ['admin', 'staff', 'customer'] },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'staff'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'staff', 'customer'] },
];

function money(value?: number | null) {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(Number(value || 0));
}
function dateLabel(date?: string) {
  return date ? new Date(date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}
function titleCase(value?: string) {
  return (value || '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function badgeTone(value?: string) {
  const lower = (value || '').toLowerCase();
  if (['paid', 'active', 'accepted', 'fulfilled', 'received', 'confirmed'].includes(lower)) return 'badge-green';
  if (['partial', 'pending', 'quoted', 'processing', 'requested'].includes(lower)) return 'badge-amber';
  if (['overdue', 'cancelled', 'rejected', 'out', 'damaged'].includes(lower)) return 'badge-red';
  return 'badge-neutral';
}

function StatusBadge({ value }: { value: string }) {
  return <span data-testid={`status-${value}`} className={`badge ${badgeTone(value)}`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{titleCase(value)}</span>;
}

function SkeletonBlock({ count = 3 }: { count?: number }) {
  return <div className="space-y-3" aria-label="Loading data">{Array.from({ length: count }, (_, index) => <div key={index} className="skeleton h-14 w-full" />)}</div>;
}

function QueryState({ loading, error, empty, children, onRetry }: { loading: boolean; error?: unknown; empty?: boolean; children: ReactNode; onRetry?: () => void }) {
  if (loading) return <SkeletonBlock count={4} />;
  if (error) return <div className="card flex flex-col items-start gap-3 p-6" data-testid="state-query-error">
    <div className="flex items-center gap-2 text-sm font-bold text-[#9F3021]"><CircleAlert size={17} />We couldn't load this view.</div>
    <p className="text-sm text-[#647168]">Check your connection and try again. Your saved records are unchanged.</p>
    {onRetry && <button className="button-secondary" onClick={onRetry} data-testid="button-retry"><ArrowRight size={15} />Try again</button>}
  </div>;
  if (empty) return <div className="card flex flex-col items-center px-6 py-12 text-center" data-testid="state-empty">
    <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-[#DCFCE7] text-[#14532D]"><Sprout size={23} /></div>
    <h3 className="font-display text-lg font-bold text-[#17231B]">A clear space to grow</h3>
    <p className="mt-1 max-w-sm text-sm text-[#718074]">No records are saved here yet. Add your first one when you're ready.</p>
  </div>;
  return <>{children}</>;
}

function AppMark({ light = false }: { light?: boolean }) {
  return <div className="flex items-center gap-3">
    <div className={`grid h-10 w-10 place-items-center rounded-xl ${light ? 'bg-[#DCFCE7] text-[#14532D]' : 'bg-[#DCFCE7] text-[#14532D]'}`}><Sprout size={23} strokeWidth={2.3} /></div>
    <div className="leading-tight"><div className={`font-display text-[17px] font-extrabold tracking-[-.04em] ${light ? 'text-white' : 'text-[#17231B]'}`}>Green Karachi</div><div className={`mt-0.5 text-[9px] font-bold uppercase tracking-[.18em] ${light ? 'text-[#b8d8bf]' : 'text-[#6a7b6e]'}`}>Wholesale nursery</div></div>
  </div>;
}

function PublicHome() {
  const catalog = useGetCatalog();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const products = catalog.data || [];
  const categories = Array.from(new Set(products.map((item: any) => item.category).filter(Boolean)));
  const filtered = products.filter((item: any) => (!category || item.category === category) && (!search || `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(search.toLowerCase())));
  return <div className="min-h-[100dvh] bg-[#F8FAF7] text-[#17231B]">
    <header className="absolute z-20 flex w-full items-center justify-between px-5 py-5 md:px-12 md:py-7">
      <AppMark light />
      <nav className="flex items-center gap-2">
        <Link href="/sign-in" className="rounded-lg px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10" data-testid="link-sign-in">Sign in</Link>
        <Link href="/sign-up" className="rounded-lg bg-[#DCFCE7] px-4 py-2.5 text-sm font-bold text-[#14532D] transition hover:bg-white" data-testid="link-sign-up">Open a wholesale account <ArrowRight className="ml-2 inline" size={15} /></Link>
      </nav>
    </header>
    <section className="hero-surface flex min-h-[620px] items-end px-6 pb-16 pt-32 md:min-h-[680px] md:px-16 md:pb-20">
      <div className="fade-in w-full max-w-6xl text-white">
        <div className="hero-mark inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#e2f6e5]"><span className="h-2 w-2 rounded-full bg-[#4ade80]" /> Karachi grown. Business ready.</div>
        <h1 className="font-display mt-6 max-w-3xl text-5xl font-extrabold leading-[.98] tracking-[-.055em] md:text-[76px]">A better way to<br /><span className="text-[#B6E9BE]">grow your business.</span></h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-[#e1eee2] md:text-lg">Dependable nursery supply, clear availability and a straight path from wholesale enquiry to delivery.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#catalogue" className="rounded-lg bg-[#16A34A] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#13853e]" data-testid="link-browse-catalog">Browse wholesale catalogue <ArrowDownToLine className="ml-2 inline" size={16} /></a>
          <Link href="/sign-up" className="hero-mark rounded-lg px-5 py-3.5 text-sm font-bold text-white hover:bg-white/20" data-testid="link-create-account">Request buyer access</Link>
        </div>
        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-xs font-semibold text-[#e4f0e5]">
          <span className="flex items-center gap-2"><Check size={14} className="text-[#8ad99a]" /> Live availability</span>
          <span className="flex items-center gap-2"><Check size={14} className="text-[#8ad99a]" /> Business order tracking</span>
          <span className="flex items-center gap-2"><Check size={14} className="text-[#8ad99a]" /> Clear payment records</span>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-14 md:px-10 md:py-20">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div><div className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#16803b]">The wholesale list</div><h2 className="font-display mt-2 text-3xl font-extrabold tracking-[-.04em] md:text-4xl">What's growing at the nursery</h2><p className="mt-2 text-sm text-[#647168]">Browse current catalogue availability. Sign in to place a business order.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#849185]" size={16} /><input className="field min-w-[210px] pl-9" placeholder="Search plants or SKU" value={search} onChange={(event) => setSearch(event.target.value)} data-testid="input-catalog-search" /></label>
          <select className="field sm:w-48" value={category} onChange={(event) => setCategory(event.target.value)} data-testid="select-catalog-category"><option value="">All categories</option>{categories.map((item: string) => <option key={item}>{item}</option>)}</select>
        </div>
      </div>
      <QueryState loading={catalog.isLoading} error={catalog.error} empty={!catalog.isLoading && !catalog.error && filtered.length === 0} onRetry={() => catalog.refetch()}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product: any) => <ProductTile key={product.id} product={product} compact />)}
        </div>
      </QueryState>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <FeatureTile icon={<Package size={19} />} title="Know what is available" body="Physical, reserved and available quantities stay distinct, so buyers can order with confidence." />
        <FeatureTile icon={<Truck size={19} />} title="Orders with a clear next step" body="Follow each order from confirmation through preparation and fulfilment." />
        <FeatureTile icon={<Banknote size={19} />} title="Collections you can reconcile" body="Keep invoice balances and recorded payments together, not scattered across messages." />
      </div>
    </section>
    <section className="bg-[#143D24] px-5 py-14 text-white md:px-10 md:py-16">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
        <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#96d4a2]">For Karachi's growing businesses</p><h2 className="font-display mt-3 max-w-2xl text-3xl font-extrabold tracking-[-.04em] md:text-4xl">From your next planting plan to a dependable supply rhythm.</h2></div>
        <Link href="/sign-up" className="button-primary shrink-0 bg-[#16A34A] px-5 py-3.5 hover:bg-[#13853e]" data-testid="link-wholesale-signup">Set up buyer access <ArrowUpRight size={17} /></Link>
      </div>
    </section>
    <footer className="flex flex-col justify-between gap-3 px-5 py-7 text-xs text-[#69766b] md:flex-row md:px-10"><AppMark /><p>Green Karachi · Wholesale nursery operations</p></footer>
  </div>;
}

function FeatureTile({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return <div className="card p-5"><div className="mb-4 grid h-9 w-9 place-items-center rounded-lg bg-[#eaf7eb] text-[#176334]">{icon}</div><h3 className="font-bold text-[#17231B]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#68766a]">{body}</p></div>;
}

function ProductTile({ product, compact = false, onOrder }: { product: any; compact?: boolean; onOrder?: () => void }) {
  return <article className={`card overflow-hidden ${compact ? '' : 'h-full'}`} data-testid={`card-product-${product.id}`}>
    <div className="relative h-40 overflow-hidden bg-[#e7f2e5]">
      {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-[radial-gradient(ellipse_at_50%_100%,#c8e7c8,#edf6e9_66%)]"><div className="grid h-20 w-20 place-items-center rounded-full border border-[#b2d9b4] bg-white/60 text-[#327442]"><Flower2 size={36} strokeWidth={1.35} /></div></div>}
      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#4e6352]">{product.category}</span>
      <span className="absolute right-3 top-3"><StatusBadge value={product.availableStock > 0 ? 'available' : 'out'} /></span>
    </div>
    <div className="p-4">
      <div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-lg font-extrabold leading-tight text-[#17231B]">{product.name}</h3><p className="mt-1 font-mono text-[10px] text-[#829083]">{product.sku}</p></div><div className="text-right"><div className="font-display text-lg font-extrabold text-[#14532D]">{money(product.unitPrice)}</div><div className="text-[10px] text-[#829083]">per {product.unit}</div></div></div>
      <div className="mt-4 flex items-center justify-between border-t border-[#edf0eb] pt-3 text-xs"><span className="text-[#68766a]">Available now</span><span className="font-mono font-bold text-[#25392b]">{product.availableStock} <span className="font-sans font-medium text-[#829083]">{product.unit}</span></span></div>
      {onOrder && <button className="button-primary mt-4 w-full" onClick={onOrder} data-testid={`button-order-product-${product.id}`}><Plus size={15} />Add to order</button>}
    </div>
  </article>;
}

function SignInPage() {
  return <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-7 bg-[#F8FAF7] px-4 py-12"><Link href="/" className="rounded-xl" data-testid="link-auth-home"><AppMark /></Link><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}
function SignUpPage() {
  return <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-7 bg-[#F8FAF7] px-4 py-12"><Link href="/" className="rounded-xl" data-testid="link-auth-home"><AppMark /></Link><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}
function HomeRedirect() {
  const { isLoaded, isSignedIn } = useUser();
  if (isLoaded && isSignedIn) return <Redirect to="/dashboard" />;
  return <PublicHome />;
}

function ClerkCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previous = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }) => {
    const current = user?.id ?? null;
    if (previous.current !== undefined && previous.current !== current) client.clear();
    previous.current = current;
  }), [addListener, client]);
  return null;
}

function ClerkRouter() {
  return <WouterRouter base={basePath}><ClerkApplication /></WouterRouter>;
}

function ClerkApplication() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'Welcome back', subtitle: 'Pick up where your nursery work left off.' } },
        signUp: { start: { title: 'Join the wholesale list', subtitle: 'Set up your Green Karachi buyer account.' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/:page" component={PageGate} />
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>;
}

function PageGate() {
  const params = useParams<{ page: string }>();
  const { isLoaded, isSignedIn } = useUser();
  const valid = ['dashboard', 'inventory', 'catalog', 'customers', 'orders', 'quotations', 'invoices', 'reports', 'settings'].includes(params.page || '');
  if (!valid) return <NotFound />;
  if (!isLoaded) return <div className="grid min-h-[100dvh] place-items-center bg-[#F8FAF7] text-sm text-[#68766a]">Loading your Green Karachi workspace…</div>;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <Portal page={params.page} />;
}

function Portal({ page }: { page: string }) {
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const { isLoaded: clerkLoaded, isSignedIn, user: clerkUser } = useUser();
  const meQuery = useGetMe();
  const profileBootstrapId = useRef<string | null>(null);
  const signedInRole = (meQuery.data as any)?.role;
  const isInternalRole = signedInRole === 'admin' || signedInRole === 'staff';
  const dashboardQuery = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey(), enabled: page === 'dashboard' && !!signedInRole && signedInRole !== 'customer' } });
  const productQuery = useListProducts(undefined, { query: { queryKey: getListProductsQueryKey(), enabled: isInternalRole && ['inventory', 'orders', 'quotations', 'settings'].includes(page) } });
  const catalogQuery = useGetCatalog(undefined, { query: { queryKey: getGetCatalogQueryKey(), enabled: page === 'catalog' || (!isInternalRole && ['orders', 'quotations'].includes(page)) } });
  const movementQuery = useListStockMovements({ query: { queryKey: getListStockMovementsQueryKey(), enabled: isInternalRole && page === 'inventory' } });
  const customersQuery = useListCustomers(undefined, { query: { queryKey: getListCustomersQueryKey(), enabled: isInternalRole && ['customers', 'orders', 'quotations', 'settings'].includes(page) } });
  const ordersQuery = useListOrders({ query: { queryKey: getListOrdersQueryKey(), enabled: ['orders', 'invoices'].includes(page) || (page === 'dashboard' && signedInRole === 'customer') } });
  const quotationsQuery = useListQuotations({ query: { queryKey: getListQuotationsQueryKey(), enabled: page === 'quotations' } });
  const invoicesQuery = useListInvoices({ query: { queryKey: getListInvoicesQueryKey(), enabled: page === 'invoices' || (page === 'dashboard' && signedInRole === 'customer') } });
  const reportsQuery = useGetReports({ query: { queryKey: getGetReportsQueryKey(), enabled: isInternalRole && page === 'reports' } });
  const usersQuery = useListUsers({ query: { queryKey: getListUsersQueryKey(), enabled: signedInRole === 'admin' && page === 'settings' } });
  const healthQuery = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const createMovement = useCreateStockMovement();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const createOrder = useCreateOrder();
  const updateOrderStatus = useUpdateOrderStatus();
  const createQuotation = useCreateQuotation();
  const updateQuotationStatus = useUpdateQuotationStatus();
  const createInvoice = useCreateInvoice();
  const recordPayment = useRecordPayment();
  const saveMe = useSaveMe();
  const updateUser = useUpdateUser();
  const primaryEmail = clerkUser?.primaryEmailAddress?.emailAddress;
  const shouldBootstrapProfile = Boolean(
    clerkLoaded && isSignedIn && clerkUser && primaryEmail && meQuery.isError && !saveMe.isError,
  );
  useEffect(() => {
    if (!shouldBootstrapProfile || !clerkUser || !primaryEmail || saveMe.isPending) return;
    if (profileBootstrapId.current === clerkUser.id) return;
    profileBootstrapId.current = clerkUser.id;
    saveMe.mutate(
      { data: { name: clerkUser.fullName || clerkUser.username || primaryEmail, email: primaryEmail } },
      {
        onSuccess: () => void client.invalidateQueries({ queryKey: getGetMeQueryKey() }),
        onError: () => {
          profileBootstrapId.current = null;
        },
      },
    );
  }, [shouldBootstrapProfile, clerkUser, primaryEmail, saveMe.isPending, saveMe.mutate, client]);
  const profileSetupPending = shouldBootstrapProfile && !saveMe.isError;
  const [modal, setModal] = useState<ModalState>(null);
  const [message, setMessage] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [orderLines, setOrderLines] = useState([{ productId: '', quantity: '1' }]);
  const user = meQuery.data as any;
  const role = user?.role || '';
  const isCustomer = role === 'customer';
  const availableProducts = ((!isInternalRole || page === 'catalog') ? catalogQuery.data : productQuery.data) as any[] | undefined;
  const customers = customersQuery.data as any[] | undefined;
  const orders = ((ordersQuery.data as any[] | undefined) || []).filter((item: any) => !isCustomer || item.customerId === user.customerId);
  const quotations = ((quotationsQuery.data as any[] | undefined) || []).filter((item: any) => !isCustomer || item.customerId === user.customerId);
  const invoices = ((invoicesQuery.data as any[] | undefined) || []).filter((item: any) => !isCustomer || item.customerId === user.customerId);
  const canManage = role === 'admin' || role === 'staff';
  const visibleNavigation = navItems.filter((item) => item.roles.includes(role));
  const currentNav = navItems.find((item) => item.path === `/${page}`);
  const pageTitles: Record<string, [string, string]> = {
    dashboard: ['Overview', 'Today at the nursery'],
    inventory: ['Inventory', 'Stock with nothing left to guess'],
    catalog: ['Wholesale catalogue', 'Available for your next planting plan'],
    customers: ['Customers', 'Business relationships, kept in order'],
    orders: ['Orders', 'From buyer request to nursery dispatch'],
    quotations: ['Quotations', 'Clear offers, tracked through a decision'],
    invoices: ['Invoices & collection', 'Outstanding balances and cash received'],
    reports: ['Reports', 'A grounded view of nursery performance'],
    settings: ['Settings', 'Your account and access'],
  };
  const [eyebrow, heading] = pageTitles[page] || ['Green Karachi', 'Nursery operations'];
  const refresh = (keys: any[]) => keys.forEach((key) => client.invalidateQueries({ queryKey: key }));
  const complete = (text: string, keys: any[]) => {
    setMessage(text);
    refresh(keys);
    setModal(null);
    window.setTimeout(() => setMessage(''), 4200);
  };
  const invoke = (mutation: any, data: any, keys: any[], success: string, id?: number) => {
    const variables = id !== undefined ? { id, data } : { data };
    mutation.mutate(variables, { onSuccess: () => complete(success, keys), onError: (error: any) => setMessage(`Error: ${error?.message || 'The saved record could not be updated. Please try again.'}`) });
  };
  const retryPage = () => {
    if (meQuery.isError) {
      profileBootstrapId.current = null;
      saveMe.reset();
    }
    meQuery.refetch();
    const pageQuery: Record<string, any> = { dashboard: dashboardQuery, inventory: productQuery, catalog: catalogQuery, customers: customersQuery, orders: ordersQuery, quotations: quotationsQuery, invoices: invoicesQuery, reports: reportsQuery, settings: usersQuery };
    pageQuery[page]?.refetch();
    healthQuery.refetch();
  };
  const failed = [(meQuery.isError && !profileSetupPending ? meQuery : undefined), page === 'dashboard' && !isCustomer ? dashboardQuery : undefined, page === 'dashboard' && isCustomer ? ordersQuery : undefined, page === 'dashboard' && isCustomer ? invoicesQuery : undefined, page === 'inventory' ? productQuery : undefined, page === 'inventory' ? movementQuery : undefined, page === 'catalog' ? catalogQuery : undefined, page === 'customers' ? customersQuery : undefined, page === 'orders' ? ordersQuery : undefined, page === 'orders' && isInternalRole ? productQuery : undefined, page === 'orders' && !isInternalRole ? catalogQuery : undefined, page === 'orders' && isInternalRole ? customersQuery : undefined, page === 'quotations' ? quotationsQuery : undefined, page === 'quotations' && isInternalRole ? productQuery : undefined, page === 'quotations' && !isInternalRole ? catalogQuery : undefined, page === 'quotations' && isInternalRole ? customersQuery : undefined, page === 'invoices' ? invoicesQuery : undefined, page === 'invoices' ? ordersQuery : undefined, page === 'reports' ? reportsQuery : undefined, page === 'settings' && role === 'admin' ? usersQuery : undefined, page === 'settings' && isInternalRole ? customersQuery : undefined].some((query) => query?.isError);
  const loading = meQuery.isLoading || profileSetupPending || (page === 'dashboard' && !isCustomer && dashboardQuery.isLoading) || (page === 'dashboard' && isCustomer && (ordersQuery.isLoading || invoicesQuery.isLoading)) || (page === 'inventory' && productQuery.isLoading) || (page === 'catalog' && catalogQuery.isLoading) || (page === 'customers' && customersQuery.isLoading) || (page === 'orders' && ordersQuery.isLoading) || (page === 'quotations' && quotationsQuery.isLoading) || (page === 'invoices' && invoicesQuery.isLoading) || (page === 'reports' && reportsQuery.isLoading);
  const permission = meQuery.isLoading || profileSetupPending ? 'loading' : !user ? 'unauthorized' : !navItems.find((item) => item.path === `/${page}`)?.roles.includes(role) ? 'forbidden' : 'allowed';

  const open = (kind: ModalKind, entity?: any) => {
    setMessage('');
    if (kind === 'order' || kind === 'quotation') setOrderLines([{ productId: '', quantity: '1' }]);
    setModal({ kind, entity });
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modal) return;
    const form = Object.fromEntries(new FormData(event.currentTarget).entries()) as Fields;
    const entity = modal.entity;
    switch (modal.kind) {
      case 'product': {
        const payload = {
          name: form.name, sku: form.sku, category: form.category, unit: form.unit || 'each',
          unitPrice: Number(form.unitPrice), physicalStock: Number(form.physicalStock), minimumStock: Number(form.minimumStock),
          imageUrl: form.imageUrl || null,
        };
        if (entity) invoke(updateProduct, { ...payload, physicalStock: undefined, minimumStock: payload.minimumStock }, [getListProductsQueryKey(), getGetCatalogQueryKey(), getGetDashboardQueryKey(), getGetReportsQueryKey()], 'Product updated.', entity.id);
        else invoke(createProduct, payload, [getListProductsQueryKey(), getGetCatalogQueryKey(), getGetDashboardQueryKey(), getGetReportsQueryKey()], 'Product added to inventory.');
        break;
      }
      case 'stock': {
        const payload = { productId: Number(form.productId), type: form.type, quantity: Number(form.quantity), note: form.note || '' };
        invoke(createMovement, payload, [getListStockMovementsQueryKey(), getListProductsQueryKey(), getGetCatalogQueryKey(), getGetDashboardQueryKey(), getGetReportsQueryKey()], 'Stock movement recorded.');
        break;
      }
      case 'customer': {
        const payload = { businessName: form.businessName, contactName: form.contactName, email: form.email, phone: form.phone, address: form.address || '', paymentTerms: form.paymentTerms || '' };
        if (entity) invoke(updateCustomer, payload, [getListCustomersQueryKey(), getGetDashboardQueryKey()], 'Customer details updated.', entity.id);
        else invoke(createCustomer, payload, [getListCustomersQueryKey(), getGetDashboardQueryKey()], 'Business customer added.');
        break;
      }
      case 'order':
      case 'quotation': {
        const lines = orderLines.filter((line) => line.productId && Number(line.quantity) > 0).map((line) => ({ productId: Number(line.productId), quantity: Number(line.quantity) }));
        if (!lines.length) { setMessage('Error: Add at least one product line before saving.'); return; }
        const customerId = isCustomer ? Number(user.customerId) : Number(form.customerId);
        if (!customerId) { setMessage('Error: Choose a linked business customer to continue.'); return; }
        const payload = { customerId, notes: form.notes || '', items: lines };
        if (modal.kind === 'order') invoke(createOrder, payload, [getListOrdersQueryKey(), getListProductsQueryKey(), getGetDashboardQueryKey(), getGetReportsQueryKey()], 'Order request saved.');
        else invoke(createQuotation, payload, [getListQuotationsQueryKey(), getListProductsQueryKey(), getGetDashboardQueryKey()], 'Quotation request saved.');
        break;
      }
      case 'invoice': {
        invoke(createInvoice, { orderId: Number(form.orderId), dueDate: form.dueDate }, [getListInvoicesQueryKey(), getGetDashboardQueryKey()], 'Invoice created.');
        break;
      }
      case 'payment': {
        invoke(recordPayment, { amount: Number(form.amount), method: form.method, reference: form.reference || '' }, [getListInvoicesQueryKey(), getGetDashboardQueryKey(), getGetReportsQueryKey()], 'Payment recorded against invoice.', entity.id);
        break;
      }
      case 'profile': {
        invoke(saveMe, { name: form.name, email: form.email }, [getGetMeQueryKey()], 'Profile saved.');
        break;
      }
      case 'role': {
        const customerId = form.role === 'customer' && form.customerId ? Number(form.customerId) : null;
        invoke(updateUser, { role: form.role, customerId }, [getListUsersQueryKey()], 'Team access updated.', entity.id);
        break;
      }
    }
  };

  if (permission === 'loading') return <div className="min-h-[100dvh] bg-[#F8FAF7] p-6"><div className="mx-auto max-w-5xl"><SkeletonBlock count={7} /></div></div>;
  if (permission === 'unauthorized') return <AccessState title="Your account isn't connected yet" body="Sign in with the account linked to your Green Karachi workspace, or return to the public catalogue." onHome={() => setLocation('/')} />;
  if (permission === 'forbidden') return <AccessState title="This view isn't part of your access" body="Your account can only open the nursery areas assigned to its role." onHome={() => setLocation('/dashboard')} />;

  return <div className="shell bg-[#F8FAF7] text-[#17231B]" data-testid={`page-${page}`}>
    <aside className="desktop-sidebar fixed inset-y-0 left-0 z-30 flex w-[248px] flex-col bg-[#143D24] px-4 py-5 text-white">
      <Link href="/dashboard" className="mb-8 px-2" data-testid="link-sidebar-home"><AppMark light /></Link>
      <div className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[.19em] text-[#9ab7a0]">Nursery desk</div>
      <nav className="nav-scroll flex-1 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {visibleNavigation.map((item) => <NavLink key={item.path} item={item} active={page === item.path.slice(1)} />)}
      </nav>
      <div className="mt-6 rounded-xl border border-white/10 bg-white/[.055] p-3.5">
        <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#afc8b3]">API connection</span><span className={`h-2 w-2 rounded-full ${healthQuery.data?.status === 'ok' ? 'bg-[#54d879]' : healthQuery.isError ? 'bg-[#ef7665]' : 'bg-[#f4c76a]'}`} /></div>
        <p className="mt-1.5 text-xs font-semibold text-[#ecf4ed]">{healthQuery.data?.status === 'ok' ? 'Nursery data connected' : healthQuery.isError ? 'Connection needs a check' : 'Checking connection'}</p>
      </div>
      <UserFoot user={user} />
    </aside>
    <div className="min-h-[100dvh] md:pl-[248px]">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#e5ebe3] bg-[#F8FAF7]/95 px-4 backdrop-blur md:px-9">
        <div className="flex min-w-0 items-center gap-3"><button className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe6dc] bg-white text-[#31523a] md:hidden" onClick={() => setMobileMenu(!mobileMenu)} data-testid="button-mobile-menu"><Menu size={18} /></button><div><p className="text-[9px] font-bold uppercase tracking-[.17em] text-[#16803b]">{eyebrow}</p><h1 className="mt-0.5 truncate font-display text-lg font-extrabold tracking-[-.035em] text-[#17231B] md:text-xl">{heading}</h1></div></div>
        <div className="relative flex items-center gap-2 md:gap-3"><div className="hidden text-right sm:block"><div className="text-xs font-bold text-[#263a2a]" data-testid="text-user-name">{user.name}</div><div className="mt-0.5 text-[10px] capitalize text-[#758078]">{role}</div></div><button className="grid h-9 w-9 place-items-center rounded-full bg-[#e4f3e5] text-[#216138]" title="Quick links" onClick={() => setNotificationOpen(!notificationOpen)} data-testid="button-notifications"><Bell size={16} /></button>{notificationOpen && <div className="absolute right-0 top-12 z-30 w-[260px] rounded-xl border border-[#dfe7dc] bg-white p-3 shadow-xl" data-testid="panel-quick-links"><p className="px-2 pb-2 text-[9px] font-bold uppercase tracking-[.16em] text-[#16803b]">Operations shortcuts</p><Link href="/orders" onClick={() => setNotificationOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-xs font-semibold text-[#354b39] hover:bg-[#f1f7ef]" data-testid="link-quick-orders"><ClipboardList size={15} />Review orders<ArrowRight size={13} className="ml-auto" /></Link><Link href="/invoices" onClick={() => setNotificationOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-xs font-semibold text-[#354b39] hover:bg-[#f1f7ef]" data-testid="link-quick-invoices"><Banknote size={15} />Open collection ledger<ArrowRight size={13} className="ml-auto" /></Link>{role !== 'customer' && <Link href="/inventory" onClick={() => setNotificationOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-xs font-semibold text-[#354b39] hover:bg-[#f1f7ef]" data-testid="link-quick-inventory"><Boxes size={15} />Check stock position<ArrowRight size={13} className="ml-auto" /></Link>}</div>}<SignOutButton /></div>
      </header>
      {mobileMenu && <div className="fixed inset-0 z-40 bg-[#143D24] px-5 py-5 text-white md:hidden"><div className="mb-9 flex items-center justify-between"><AppMark light /><button onClick={() => setMobileMenu(false)} className="grid h-10 w-10 place-items-center rounded-lg bg-white/10" data-testid="button-close-menu"><X size={20} /></button></div><nav className="space-y-1">{visibleNavigation.map((item) => <NavLink key={item.path} item={item} active={page === item.path.slice(1)} onClick={() => setMobileMenu(false)} />)}</nav><UserFoot user={user} /></div>}
      <main className="content-main mx-auto max-w-[1500px] px-5 py-7 md:px-9 md:py-9">
        {message && <div className={`mb-5 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${message.startsWith('Error:') ? 'border-[#f0cdc5] bg-[#fff2ef] text-[#9f3021]' : 'border-[#b9e2c1] bg-[#eaf8ec] text-[#14532D]'}`} data-testid={message.startsWith('Error:') ? 'status-error' : 'status-success'}>{message.startsWith('Error:') ? <CircleAlert size={17} /> : <Check size={17} />}{message.replace(/^Error: /, '')}</div>}
        {failed && <div className="mb-6"><QueryState loading={false} error={new Error('query error')} onRetry={retryPage}>{null}</QueryState></div>}
        {!failed && <div className="fade-in">
          {page === 'dashboard' && (isCustomer ? <CustomerDashboardPage orders={orders} invoices={invoices} loading={ordersQuery.isLoading || invoicesQuery.isLoading} onRetry={() => { ordersQuery.refetch(); invoicesQuery.refetch(); }} /> : <DashboardPage data={dashboardQuery.data as any} loading={dashboardQuery.isLoading} onRetry={() => dashboardQuery.refetch()} role={role} />)}
          {page === 'inventory' && <InventoryPage products={productQuery.data as any} movements={movementQuery.data as any} loading={productQuery.isLoading} search={search} setSearch={setSearch} stockFilter={stockFilter} setStockFilter={setStockFilter} open={open} onRetry={() => productQuery.refetch()} onToggle={(product: any) => invoke(updateProduct, { isActive: !product.isActive }, [getListProductsQueryKey(), getGetCatalogQueryKey(), getGetDashboardQueryKey(), getGetReportsQueryKey()], product.isActive ? 'Product paused in the catalogue.' : 'Product returned to the catalogue.', product.id)} />}
          {page === 'catalog' && <CatalogPage products={catalogQuery.data as any} loading={catalogQuery.isLoading} search={search} setSearch={setSearch} open={open} isCustomer={isCustomer} user={user} orderLines={orderLines} setOrderLines={setOrderLines} />}
          {page === 'customers' && <CustomersPage customers={customers} loading={customersQuery.isLoading} search={search} setSearch={setSearch} open={open} onToggle={(customer: any) => invoke(updateCustomer, { isActive: !customer.isActive }, [getListCustomersQueryKey(), getGetDashboardQueryKey()], customer.isActive ? 'Customer paused.' : 'Customer reactivated.', customer.id)} />}
          {page === 'orders' && <OrdersPage orders={orders} customers={customers} products={productQuery.data as any} loading={ordersQuery.isLoading} search={search} setSearch={setSearch} open={open} canManage={canManage} onStatus={(id: number, status: string) => invoke(updateOrderStatus, { status }, [getListOrdersQueryKey(), getGetDashboardQueryKey(), getGetReportsQueryKey()], 'Order status updated.', id)} />}
          {page === 'quotations' && <QuotationsPage quotations={quotations} customers={customers} products={productQuery.data as any} loading={quotationsQuery.isLoading} search={search} setSearch={setSearch} open={open} canManage={canManage} onStatus={(id: number, status: string) => invoke(updateQuotationStatus, { status }, [getListQuotationsQueryKey()], 'Quotation status updated.', id)} />}
          {page === 'invoices' && <InvoicesPage invoices={invoices} orders={orders} loading={invoicesQuery.isLoading} search={search} setSearch={setSearch} open={open} canManage={canManage} />}
          {page === 'reports' && <ReportsPage reports={reportsQuery.data as any} loading={reportsQuery.isLoading} />}
          {page === 'settings' && <SettingsPage user={user} users={usersQuery.data as any} customers={customers} loading={usersQuery.isLoading} open={open} isAdmin={role === 'admin'} />}
        </div>}
      </main>
    </div>
    {modal && <Modal key={`${modal.kind}-${modal.entity?.id || 'new'}`} modal={modal} onClose={() => setModal(null)} onSubmit={handleSubmit} products={availableProducts} customers={customers} orders={orders} orderLines={orderLines} setOrderLines={setOrderLines} user={user} isCustomer={isCustomer} errorMessage={message.startsWith('Error:') ? message.replace(/^Error: /, '') : ''} isPending={modalMutationPending(modal.kind, { createProduct, updateProduct, createMovement, createCustomer, updateCustomer, createOrder, createQuotation, createInvoice, recordPayment, saveMe, updateUser })} />}
  </div>;
}

function modalMutationPending(kind: ModalKind, mutations: Record<string, any>) {
  const index: Record<ModalKind, string> = { product: 'createProduct', stock: 'createMovement', customer: 'createCustomer', order: 'createOrder', quotation: 'createQuotation', invoice: 'createInvoice', payment: 'recordPayment', profile: 'saveMe', role: 'updateUser' };
  return mutations[index[kind]]?.isPending || mutations.updateProduct?.isPending || mutations.updateCustomer?.isPending;
}

function AccessState({ title, body, onHome }: { title: string; body: string; onHome: () => void }) {
  return <main className="grid min-h-[100dvh] place-items-center bg-[#F8FAF7] px-5"><section className="card max-w-md p-8 text-center"><div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-[#DCFCE7] text-[#14532D]"><ShieldCheck size={24} /></div><h1 className="font-display text-2xl font-extrabold">{title}</h1><p className="mt-3 text-sm leading-6 text-[#69766b]">{body}</p><button className="button-primary mt-6" onClick={onHome} data-testid="button-return">{title.includes('connected') ? <ArrowLeft size={15} /> : <Home size={15} />}{title.includes('connected') ? 'Public catalogue' : 'Go to overview'}</button></section></main>;
}

function NavLink({ item, active, onClick }: { item: typeof navItems[number]; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return <Link href={item.path} onClick={onClick} className={`sidebar-link ${active ? 'active' : ''}`} data-testid={`link-nav-${item.path.slice(1)}`}><Icon size={16} strokeWidth={1.9} /><span>{item.label}</span>{item.path === '/invoices' && <ArrowUpRight className="ml-auto opacity-50" size={13} />}</Link>;
}
function UserFoot({ user }: { user: any }) {
  const { signOut } = useClerk();
  return <div className="mt-4 flex items-center gap-3 border-t border-white/10 px-2 pt-4"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#2d7141] text-xs font-bold text-white">{(user?.name || 'GK').split(' ').map((part: string) => part[0]).slice(0, 2).join('').toUpperCase()}</div><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-white">{user?.name}</div><div className="truncate text-[10px] capitalize text-[#a9c2ad]">{user?.role} access</div></div><button onClick={() => signOut({ redirectUrl: basePath || '/' })} className="grid h-8 w-8 place-items-center rounded-lg text-[#b9cbbd] hover:bg-white/10 hover:text-white" title="Sign out" data-testid="button-sign-out-sidebar"><LogOut size={15} /></button></div>;
}
function SignOutButton() {
  const { signOut } = useClerk();
  return <button onClick={() => signOut({ redirectUrl: basePath || '/' })} className="grid h-9 w-9 place-items-center rounded-full border border-[#dfe6dc] bg-white text-[#617164] hover:bg-[#f1f6ef] md:hidden" title="Sign out" data-testid="button-sign-out"><LogOut size={15} /></button>;
}

function PageHeading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="font-display text-2xl font-extrabold tracking-[-.04em] text-[#17231B] md:text-[28px]">{title}</h2><p className="mt-1.5 text-sm text-[#718074]">{description}</p></div>{action}</div>;
}

function Metric({ label, value, note, icon: Icon, tone = 'green' }: { label: string; value: string | number; note?: string; icon: any; tone?: string }) {
  return <article className="card relative overflow-hidden p-4 md:p-5" data-testid={`metric-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#778479]">{label}</p><p className="font-display mt-3 text-2xl font-extrabold tracking-[-.045em] text-[#17231B] md:text-[29px]">{value}</p></div><div className={`grid h-9 w-9 place-items-center rounded-lg ${tone === 'amber' ? 'bg-[#fff3d9] text-[#a66b13]' : tone === 'red' ? 'bg-[#fff0ec] text-[#ab3929]' : 'bg-[#e3f5e5] text-[#176334]'}`}><Icon size={17} /></div></div>{note && <p className="mt-3 text-[10px] text-[#879187]">{note}</p>}</article>;
}

function DashboardPage({ data, loading, onRetry, role }: { data: any; loading: boolean; onRetry: () => void; role: string }) {
  const movements = data?.recentMovements || [];
  return <><PageHeading title="A steady view of the nursery" description="Your saved operations, at a glance." action={<div className="flex gap-2">{role !== 'customer' && <Link href="/inventory" className="button-secondary" data-testid="link-dashboard-inventory"><Boxes size={15} />Inventory</Link>}<Link href="/orders" className="button-primary" data-testid="link-dashboard-orders"><Plus size={15} />New order</Link></div>} />
    <QueryState loading={loading} error={undefined} empty={false} onRetry={onRetry}>{data && <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Products in catalogue" value={data.totalProducts} note={`${data.plantProducts} plants · ${data.supplyProducts} supplies`} icon={Leaf} />
        <Metric label="Below minimum stock" value={data.lowStockItems} note={`${data.outOfStockItems} currently unavailable`} icon={CircleAlert} tone={data.lowStockItems ? 'amber' : 'green'} />
        <Metric label={role === 'customer' ? 'Orders awaiting next step' : 'Orders to move forward'} value={data.pendingOrders} note="Saved pending orders" icon={ClipboardList} />
        <Metric label="Monthly sales" value={money(data.monthlySales)} note="Persisted order sales" icon={BarChart3} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
        <section className="card p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-display text-lg font-extrabold">Recent stock movement</h3><p className="mt-1 text-xs text-[#778479]">Latest activity recorded against inventory</p></div><Link href="/inventory" className="text-xs font-bold text-[#176334]" data-testid="link-view-inventory">View inventory <ArrowRight className="ml-1 inline" size={13} /></Link></div>
          {movements.length ? <div className="divide-y divide-[#eef1ec]">{movements.slice(0, 6).map((move: any) => <div key={move.id} className="flex items-center gap-3 py-3" data-testid={`row-movement-${move.id}`}><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#edf6ec] text-[#28703d]">{move.type === 'received' ? <ArrowDownToLine size={16} /> : <Package size={16} />}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{move.productName}</div><div className="mt-1 text-[10px] text-[#829083]">{titleCase(move.type)} · {dateLabel(move.createdAt)}{move.note ? ` · ${move.note}` : ''}</div></div><div className={`font-mono text-sm font-bold ${move.quantity >= 0 ? 'text-[#176334]' : 'text-[#a54638]'}`}>{move.quantity > 0 ? '+' : ''}{move.quantity}</div></div>)}</div> : <EmptyInline title="No stock activity yet" body="Receive, sell or adjust stock to create your first movement record." />}</section>
        <section className="relative overflow-hidden rounded-[14px] bg-[#17472a] p-6 text-white"><div className="absolute -right-8 -top-8 h-48 w-48 rounded-full border border-white/10" /><div className="absolute -right-1 -top-1 h-32 w-32 rounded-full border border-white/10" /><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#addbb5]">Collections to follow</p><h3 className="font-display mt-4 text-3xl font-extrabold tracking-[-.05em]">{money(data.outstandingPayments)}</h3><p className="mt-2 text-sm text-[#c6ddca]">Outstanding across saved invoices</p><Link href="/invoices" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#DCFCE7] px-4 py-2.5 text-xs font-bold text-[#14532D]" data-testid="link-dashboard-invoices">Open invoice ledger <ArrowRight size={14} /></Link><div className="mt-8 flex items-center gap-2 text-[10px] text-[#a9c9af]"><ShieldCheck size={14} />Based on persisted business records</div></section>
      </div>
      <section className="grid gap-4 md:grid-cols-3"><FeatureTile icon={<Package size={18} />} title="Physical and available stock" body="Keep incoming stock, reservations and buyer-ready availability separate." /><FeatureTile icon={<Users size={18} />} title="One business record" body="Customer details, order history and payment terms stay connected." /><FeatureTile icon={<Banknote size={18} />} title="A clearer collection trail" body="Record payment method and reference against each outstanding invoice." /></section>
    </div>}</QueryState>
  </>;
}

function CustomerDashboardPage({ orders, invoices, loading, onRetry }: { orders: any[]; invoices: any[]; loading: boolean; onRetry: () => void }) {
  const pending = orders.filter((order) => !['fulfilled', 'cancelled'].includes(order.status)).length;
  const outstanding = invoices.reduce((total, invoice) => total + Number(invoice.outstanding || 0), 0);
  const invoiced = invoices.reduce((total, invoice) => total + Number(invoice.total || 0), 0);
  const recent = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  return <><PageHeading title="Your nursery account" description="A private view of your saved orders and invoice ledger." action={<Link href="/catalog" className="button-primary" data-testid="link-customer-browse-catalog"><ShoppingBasket size={15} />Browse catalogue</Link>} />
    <QueryState loading={loading} error={undefined} empty={false} onRetry={onRetry}>
      <div className="grid gap-3 sm:grid-cols-3"><Metric label="Your orders" value={orders.length} note="Saved business order requests" icon={ClipboardList} /><Metric label="In progress" value={pending} note="Orders still moving through the nursery" icon={Clock3} tone={pending ? 'amber' : 'green'} /><Metric label="Your outstanding" value={money(outstanding)} note={`Across ${invoices.length} saved invoices`} icon={Banknote} tone={outstanding ? 'amber' : 'green'} /></div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.8fr]"><section className="card p-5 md:p-6"><div className="flex items-start justify-between"><div><h3 className="font-display text-lg font-extrabold">Your recent orders</h3><p className="mt-1 text-xs text-[#778479]">Only records linked to your business account.</p></div><Link href="/orders" className="text-xs font-bold text-[#176334]" data-testid="link-customer-all-orders">All orders <ArrowRight className="ml-1 inline" size={13} /></Link></div>
        {recent.length ? <div className="mt-4 divide-y divide-[#edf0eb]">{recent.map((order) => <div key={order.id} className="flex items-center gap-3 py-3" data-testid={`customer-order-${order.id}`}><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#e6f3e5] text-[#2d7141]"><Package size={17} /></div><div className="min-w-0 flex-1"><div className="text-sm font-bold">Order #{order.id}</div><div className="mt-1 text-[10px] text-[#829083]">{dateLabel(order.createdAt)} · {order.items?.length || 0} items</div></div><StatusBadge value={order.status} /><span className="font-mono text-xs font-bold">{money(order.total)}</span></div>)}</div> : <div className="mt-4"><EmptyInline title="Your first order starts here" body="Browse the active wholesale list, then send your nursery request for confirmation." /></div>}
      </section><section className="relative overflow-hidden rounded-[14px] bg-[#17472a] p-6 text-white"><div className="absolute -right-10 -top-10 h-48 w-48 rounded-full border border-white/10" /><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#addbb5]">Invoice account</p><h3 className="font-display mt-4 text-3xl font-extrabold tracking-[-.05em]">{money(outstanding)}</h3><p className="mt-2 text-sm text-[#c6ddca]">Outstanding balance · {money(invoiced)} invoiced</p><Link href="/invoices" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#DCFCE7] px-4 py-2.5 text-xs font-bold text-[#14532D]" data-testid="link-customer-invoices">Review invoices <ArrowRight size={14} /></Link><div className="mt-8 flex items-center gap-2 text-[10px] text-[#a9c9af]"><ShieldCheck size={14} />Business records stay private to your account</div></section></div>
    </QueryState>
  </>;
}

function EmptyInline({ title, body }: { title: string; body: string }) {
  return <div className="rounded-xl border border-dashed border-[#dce5da] bg-[#fbfdf9] px-4 py-8 text-center"><div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full bg-[#eaf6e9] text-[#327442]"><Sprout size={18} /></div><p className="text-sm font-bold text-[#304534]">{title}</p><p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#7b887d]">{body}</p></div>;
}

function InventoryPage({ products, movements, loading, search, setSearch, stockFilter, setStockFilter, open, onRetry, onToggle }: any) {
  const list = useMemo(() => (products || []).filter((item: any) => {
    const matches = `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(search.toLowerCase());
    const stock = stockFilter === 'low' ? item.availableStock <= item.minimumStock && item.availableStock > 0 : stockFilter === 'out' ? item.availableStock <= 0 : true;
    return matches && stock;
  }), [products, search, stockFilter]);
  return <><PageHeading title="Inventory that tells the whole story" description="Physical stock, reserved units and what's actually available to sell." action={<div className="flex gap-2"><button className="button-secondary" onClick={() => open('stock')} data-testid="button-record-movement"><ArrowDownToLine size={15} />Record movement</button><button className="button-primary" onClick={() => open('product')} data-testid="button-add-product"><Plus size={16} />Add product</button></div>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><div className="card p-4"><p className="table-head">Physical units</p><p className="font-display mt-2 text-2xl font-extrabold">{(products || []).reduce((sum: number, product: any) => sum + product.physicalStock, 0)}</p><p className="mt-1 text-[10px] text-[#788579]">Across saved products</p></div><div className="card p-4"><p className="table-head">Reserved units</p><p className="font-display mt-2 text-2xl font-extrabold">{(products || []).reduce((sum: number, product: any) => sum + product.reservedStock, 0)}</p><p className="mt-1 text-[10px] text-[#788579]">Committed to orders</p></div><div className="card p-4"><p className="table-head">Available units</p><p className="font-display mt-2 text-2xl font-extrabold text-[#176334]">{(products || []).reduce((sum: number, product: any) => sum + product.availableStock, 0)}</p><p className="mt-1 text-[10px] text-[#788579]">Ready for buyers</p></div></div>
    <div className="card mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center"><label className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#879388]" size={16} /><input className="field border-0 bg-transparent pl-9 shadow-none focus:ring-0" placeholder="Search name, SKU or category" value={search} onChange={(event) => setSearch(event.target.value)} data-testid="input-inventory-search" /></label><div className="flex items-center gap-2"><Filter size={15} className="text-[#748174]" /><select className="field w-40" value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} data-testid="select-stock-filter"><option value="all">All stock</option><option value="low">Below minimum</option><option value="out">Out of stock</option></select></div></div>
    <QueryState loading={loading} error={undefined} empty={!loading && list.length === 0} onRetry={onRetry}>
      <div className="card table-wrap"><table className="w-full min-w-[840px] border-collapse text-left"><thead><tr className="border-b border-[#edf0eb]">{['Product', 'Category', 'Price / unit', 'Physical', 'Reserved', 'Available', 'Status', ''].map((header) => <th className="table-head px-4 py-3.5" key={header}>{header}</th>)}</tr></thead><tbody>{list.map((product: any) => <tr key={product.id} className="border-b border-[#f0f2ee] last:border-0 hover:bg-[#fbfdf9]" data-testid={`row-product-${product.id}`}><td className="px-4 py-3"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-[#e8f4e7] text-[#347545]">{product.imageUrl ? <img src={product.imageUrl} className="h-full w-full object-cover" alt="" /> : <Leaf size={18} />}</div><div><div className="text-sm font-bold">{product.name}</div><div className="mt-1 font-mono text-[10px] text-[#879388]">{product.sku}</div></div></div></td><td className="px-4 py-3 text-xs text-[#68766a]">{product.category}</td><td className="px-4 py-3 text-xs font-bold">{money(product.unitPrice)} <span className="font-normal text-[#869187]">/ {product.unit}</span></td><td className="px-4 py-3 font-mono text-xs">{product.physicalStock}</td><td className="px-4 py-3 font-mono text-xs text-[#758176]">{product.reservedStock}</td><td className="px-4 py-3 font-mono text-xs font-bold text-[#14532D]">{product.availableStock}</td><td className="px-4 py-3"><StatusBadge value={!product.isActive ? 'inactive' : product.availableStock <= 0 ? 'out' : product.availableStock <= product.minimumStock ? 'low' : 'active'} /></td><td className="px-4 py-3"><div className="flex gap-2"><button className="button-secondary !px-3 !py-2" onClick={() => open('product', product)} data-testid={`button-edit-product-${product.id}`}>Edit</button><button className="button-secondary !px-3 !py-2" onClick={() => onToggle(product)} data-testid={`button-toggle-product-${product.id}`}>{product.isActive ? 'Pause' : 'Activate'}</button></div></td></tr>)}</tbody></table></div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><section className="card p-5"><h3 className="font-display font-extrabold">Movement log</h3><p className="mt-1 text-xs text-[#7b887d]">Every intake, sale, damage and adjustment.</p>{movements?.length ? <div className="mt-4 divide-y divide-[#edf0eb]">{movements.slice(0, 7).map((move: any) => <div key={move.id} className="flex items-center gap-3 py-3" data-testid={`row-stock-${move.id}`}><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#eef6ec] text-[#327442]"><Package size={15} /></span><div className="flex-1"><div className="text-xs font-bold">{move.productName}</div><div className="mt-1 text-[10px] text-[#849084]">{titleCase(move.type)} · {dateLabel(move.createdAt)}</div></div><span className="font-mono text-xs font-bold">{move.quantity > 0 ? '+' : ''}{move.quantity}</span></div>)}</div> : <div className="mt-4"><EmptyInline title="No movements saved" body="Record received stock, sold quantities, damage or an adjustment." /></div>}</section><section className="rounded-[14px] bg-[#e7f4e6] p-5"><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#28703d]">Stock discipline</p><h3 className="font-display mt-2 text-xl font-extrabold">Record a movement. Keep the count honest.</h3><p className="mt-2 text-sm leading-6 text-[#536755]">Physical stock updates belong in the movement log. Edit the product for name, price, minimum level and catalogue details.</p><button onClick={() => open('stock')} className="button-primary mt-5" data-testid="button-stock-shortcut"><Plus size={15} />Record stock movement</button></section></div>
    </QueryState>
  </>;
}

function CatalogPage({ products, loading, search, setSearch, open, isCustomer, user, orderLines, setOrderLines }: any) {
  const filtered = (products || []).filter((item: any) => `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(search.toLowerCase()));
  return <><PageHeading title="Plants and supplies, ready to plan" description="The buyer view of active products and available nursery stock." action={<button className="button-primary" onClick={() => open('order')} data-testid="button-start-order"><Plus size={15} />Start an order</button>} />
    <div className="mb-5 flex flex-col gap-3 rounded-xl bg-[#e8f5e8] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#24683a]"><Leaf size={18} /></span><div><div className="text-sm font-bold text-[#244a2d]">{isCustomer ? 'Buyer access enabled' : 'Wholesale catalogue'}</div><div className="mt-0.5 text-xs text-[#5c755f]">{isCustomer ? 'Orders are attached to your linked business account.' : 'Select items to begin a customer order or quotation.'}</div></div></div><label className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#849185]" size={16} /><input className="field border-[#d3e8d2] pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a plant or SKU" data-testid="input-catalog-search" /></label></div>
    <QueryState loading={loading} error={undefined} empty={!loading && filtered.length === 0} onRetry={() => {}}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((product: any) => <ProductTile key={product.id} product={product} onOrder={() => { open('order'); setOrderLines([{ productId: String(product.id), quantity: '1' }]); }} />)}</div>
    </QueryState>
  </>;
}

function CustomersPage({ customers, loading, search, setSearch, open, onToggle }: any) {
  const list = (customers || []).filter((item: any) => `${item.businessName} ${item.contactName} ${item.email}`.toLowerCase().includes(search.toLowerCase()));
  return <><PageHeading title="The people behind each order" description="Business contacts, terms and active account status in one place." action={<button className="button-primary" onClick={() => open('customer')} data-testid="button-add-customer"><Plus size={15} />Add customer</button>} />
    <div className="card mb-4 flex items-center gap-2 px-3"><Search size={16} className="text-[#849185]" /><input className="field border-0 bg-transparent shadow-none focus:ring-0" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search businesses, people or email" data-testid="input-customer-search" /></div>
    <QueryState loading={loading} error={undefined} empty={!loading && list.length === 0}>
      <div className="card table-wrap"><table className="w-full min-w-[800px] text-left"><thead><tr className="border-b border-[#edf0eb]">{['Business', 'Contact', 'Email / phone', 'Payment terms', 'Status', 'Actions'].map((label) => <th key={label} className="table-head px-4 py-3.5">{label}</th>)}</tr></thead><tbody>{list.map((customer: any) => <tr key={customer.id} className="border-b border-[#f0f2ee] last:border-0" data-testid={`row-customer-${customer.id}`}><td className="px-4 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#e7f3e6] text-[#286b3c]"><Building2 size={17} /></span><div><div className="text-sm font-bold">{customer.businessName}</div><div className="mt-1 text-[10px] text-[#859084]">{customer.address || 'Address not provided'}</div></div></div></td><td className="px-4 py-4 text-xs font-semibold">{customer.contactName || '—'}</td><td className="px-4 py-4 text-xs"><div>{customer.email || '—'}</div><div className="mt-1 text-[#839084]">{customer.phone || '—'}</div></td><td className="px-4 py-4 text-xs text-[#637165]">{customer.paymentTerms || 'As agreed'}</td><td className="px-4 py-4"><StatusBadge value={customer.isActive ? 'active' : 'inactive'} /></td><td className="px-4 py-4"><div className="flex gap-2"><button className="button-secondary !px-3 !py-2" onClick={() => open('customer', customer)} data-testid={`button-edit-customer-${customer.id}`}>Edit</button><button className="button-secondary !px-3 !py-2" onClick={() => onToggle(customer)} data-testid={`button-toggle-customer-${customer.id}`}>{customer.isActive ? 'Pause' : 'Activate'}</button></div></td></tr>)}</tbody></table></div>
    </QueryState>
  </>;
}

function OrdersPage({ orders, customers, products, loading, search, setSearch, open, canManage, onStatus }: any) {
  const list = (orders || []).filter((item: any) => `${item.customerName} ${item.id} ${item.status}`.toLowerCase().includes(search.toLowerCase()));
  const nextStatus: Record<string, string> = { pending: 'confirmed', confirmed: 'processing', processing: 'fulfilled' };
  return <><PageHeading title="Every order has a next step" description="Track saved buyer orders through preparation and fulfilment." action={<button className="button-primary" onClick={() => open('order')} data-testid="button-create-order"><Plus size={15} />New order</button>} />
    <SearchStrip value={search} onChange={setSearch} placeholder="Search customer, order or status" testId="input-order-search" />
    <QueryState loading={loading} error={undefined} empty={!loading && list.length === 0}>
      <div className="space-y-3">{list.map((order: any) => <article className="card p-4 md:p-5" key={order.id} data-testid={`card-order-${order.id}`}><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-lg font-extrabold">Order #{order.id}</h3><StatusBadge value={order.status} /></div><div className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-[#728074]"><span>{order.customerName}</span><span>·</span><span>{dateLabel(order.createdAt)}</span></div></div><div className="flex items-center justify-between gap-3 sm:justify-end"><div className="text-right"><div className="font-display text-xl font-extrabold">{money(order.total)}</div><div className="text-[10px] text-[#829083]">{order.items?.length || 0} line items</div></div>{canManage && nextStatus[order.status] && <button className="button-secondary" onClick={() => onStatus(order.id, nextStatus[order.status])} data-testid={`button-advance-order-${order.id}`}>{nextStatus[order.status] === 'fulfilled' ? 'Mark fulfilled' : `Move to ${nextStatus[order.status]}`}<ArrowRight size={13} /></button>}{canManage && !['fulfilled', 'cancelled'].includes(order.status) && <button className="button-secondary !text-[#9f3021]" onClick={() => onStatus(order.id, 'cancelled')} data-testid={`button-cancel-order-${order.id}`}>Cancel order</button>}</div></div><div className="mt-4 flex flex-wrap gap-2 border-t border-[#eef1ec] pt-3">{order.items?.map((line: any) => <span key={line.productId} className="rounded-md bg-[#f3f7f1] px-2.5 py-1.5 text-[10px] text-[#516252]">{line.productName} · {line.quantity} × {money(line.unitPrice)}</span>)}</div>{order.notes && <p className="mt-3 text-xs text-[#798579]">Note: {order.notes}</p>}</article>)}</div>
    </QueryState>
    {canManage && <div className="mt-5 flex justify-end"><button className="button-secondary" onClick={() => open('quotation')} data-testid="button-create-order-quotation"><FileText size={15} />Start a quotation instead</button></div>}
  </>;
}

function QuotationsPage({ quotations, customers, products, loading, search, setSearch, open, canManage, onStatus }: any) {
  const list = (quotations || []).filter((item: any) => `${item.customerName} ${item.id} ${item.status}`.toLowerCase().includes(search.toLowerCase()));
  const nextStatus: Record<string, string> = { requested: 'quoted', quoted: 'accepted' };
  return <><PageHeading title="Offers, with a decision trail" description="Build a buyer quote, then record whether it was accepted or declined." action={<button className="button-primary" onClick={() => open('quotation')} data-testid="button-create-quotation"><Plus size={15} />New quotation</button>} /><SearchStrip value={search} onChange={setSearch} placeholder="Search customer, quote or status" testId="input-quotation-search" />
    <QueryState loading={loading} error={undefined} empty={!loading && list.length === 0}><div className="space-y-3">{list.map((quote: any) => <article className="card p-4 md:p-5" key={quote.id} data-testid={`card-quotation-${quote.id}`}><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-lg font-extrabold">Quote #{quote.id}</h3><StatusBadge value={quote.status} /></div><p className="mt-1.5 text-xs text-[#748175]">{quote.customerName} · {dateLabel(quote.createdAt)}</p></div><div className="flex items-center justify-between gap-3 sm:justify-end"><div className="font-display text-xl font-extrabold">{money(quote.total)}</div>{canManage && nextStatus[quote.status] && <button className="button-secondary" onClick={() => onStatus(quote.id, nextStatus[quote.status])} data-testid={`button-advance-quotation-${quote.id}`}>{nextStatus[quote.status] === 'quoted' ? 'Send quote' : 'Mark accepted'}<ArrowRight size={13} /></button>}{canManage && quote.status === 'quoted' && <button className="button-secondary !text-[#9f3021]" onClick={() => onStatus(quote.id, 'rejected')} data-testid={`button-reject-quotation-${quote.id}`}>Decline</button>}</div></div><div className="mt-4 flex flex-wrap gap-2 border-t border-[#eef1ec] pt-3">{quote.items?.map((line: any) => <span key={line.productId} className="rounded-md bg-[#f3f7f1] px-2.5 py-1.5 text-[10px] text-[#516252]">{line.productName} · {line.quantity} × {money(line.unitPrice)}</span>)}</div>{quote.notes && <p className="mt-3 text-xs text-[#798579]">Note: {quote.notes}</p>}</article>)}</div></QueryState>
  </>;
}

function InvoicesPage({ invoices, orders, loading, search, setSearch, open, canManage }: any) {
  const list = (invoices || []).filter((item: any) => `${item.customerName} ${item.invoiceNumber} ${item.status}`.toLowerCase().includes(search.toLowerCase()));
  const outstanding = (invoices || []).reduce((total: number, invoice: any) => total + invoice.outstanding, 0);
  const collected = (invoices || []).reduce((total: number, invoice: any) => total + invoice.amountPaid, 0);
  return <><PageHeading title="Keep the cash trail clear" description="Create invoices from orders and record what has actually been collected." action={canManage ? <button className="button-primary" onClick={() => open('invoice')} data-testid="button-create-invoice"><Plus size={15} />Create invoice</button> : undefined} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Metric label="Outstanding" value={money(outstanding)} note="Across visible invoices" icon={Clock3} tone={outstanding ? 'amber' : 'green'} /><Metric label="Collected" value={money(collected)} note="Recorded payments" icon={Banknote} /><Metric label="Invoices" value={(invoices || []).length} note="Persisted invoice records" icon={FileText} /></div>
    <SearchStrip value={search} onChange={setSearch} placeholder="Search customer, invoice or status" testId="input-invoice-search" />
    <QueryState loading={loading} error={undefined} empty={!loading && list.length === 0}><div className="card table-wrap"><table className="w-full min-w-[850px] text-left"><thead><tr className="border-b border-[#edf0eb]">{['Invoice', 'Customer', 'Due date', 'Amount', 'Paid', 'Outstanding', 'Status', ''].map((heading) => <th className="table-head px-4 py-3.5" key={heading}>{heading}</th>)}</tr></thead><tbody>{list.map((invoice: any) => <tr key={invoice.id} className="border-b border-[#f0f2ee] last:border-0" data-testid={`row-invoice-${invoice.id}`}><td className="px-4 py-4"><div className="font-mono text-xs font-bold">{invoice.invoiceNumber}</div><div className="mt-1 text-[10px] text-[#829083]">Order #{invoice.orderId}</div></td><td className="px-4 py-4 text-xs font-semibold">{invoice.customerName}</td><td className="px-4 py-4 text-xs text-[#69766b]">{dateLabel(invoice.dueDate)}</td><td className="px-4 py-4 text-xs font-bold">{money(invoice.total)}</td><td className="px-4 py-4 text-xs text-[#176334]">{money(invoice.amountPaid)}</td><td className="px-4 py-4 text-xs font-bold text-[#a46b13]">{money(invoice.outstanding)}</td><td className="px-4 py-4"><StatusBadge value={invoice.status} /></td><td className="px-4 py-4">{canManage && invoice.outstanding > 0 && <button className="button-secondary !px-3 !py-2" onClick={() => open('payment', invoice)} data-testid={`button-record-payment-${invoice.id}`}><Banknote size={13} />Record payment</button>}</td></tr>)}</tbody></table></div></QueryState>
  </>;
}

function ReportsPage({ reports, loading }: any) {
  const sales = reports?.monthlySales || [];
  const maximum = Math.max(0, ...sales.map((item: any) => item.total));
  return <><PageHeading title="The nursery, in numbers" description="Reports are computed from your saved sales and inventory records." />
    <QueryState loading={loading} error={undefined} empty={!loading && !sales.length && !reports?.inventoryByCategory?.length && !reports?.topCustomers?.length}>
      {reports && <div className="grid gap-5 xl:grid-cols-[1.35fr_.8fr]">
        <section className="card p-5 md:p-6"><div className="mb-6 flex items-start justify-between"><div><h3 className="font-display text-lg font-extrabold">Monthly sales</h3><p className="mt-1 text-xs text-[#788579]">Saved order totals by month</p></div><BarChart3 className="text-[#31814a]" size={19} /></div>
          {sales.length ? <div className="flex h-56 items-end gap-2 border-b border-l border-[#e8ede6] px-2 pb-0 pt-4 sm:gap-4">{sales.map((item: any) => <div className="flex h-full min-w-0 flex-1 flex-col justify-end" key={item.month} data-testid={`chart-sales-${item.month}`}><div className="mb-2 text-center font-mono text-[9px] text-[#738174]">{money(item.total)}</div><div className="w-full rounded-t-md bg-[#39a75b] transition-all" style={{ height: `${maximum ? Math.max(4, item.total / maximum * 68) : 0}%` }} /><div className="mt-2 truncate text-center text-[9px] text-[#768277]">{item.month}</div></div>)}</div> : <EmptyInline title="No sales to chart" body="Monthly bars will appear when sales are saved." />}
        </section>
        <section className="card p-5 md:p-6"><h3 className="font-display text-lg font-extrabold">Inventory by category</h3><p className="mt-1 text-xs text-[#788579]">Active product counts and available units</p><div className="mt-5 space-y-4">{(reports.inventoryByCategory || []).map((item: any) => { const max = Math.max(1, ...reports.inventoryByCategory.map((row: any) => row.unitsAvailable)); return <div key={item.category} data-testid={`report-category-${item.category}`}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="font-semibold">{item.category}</span><span className="font-mono text-[#667469]">{item.unitsAvailable} units · {item.products} products</span></div><div className="h-2 overflow-hidden rounded-full bg-[#edf2eb]"><div className="h-full rounded-full bg-[#51aa67]" style={{ width: `${Math.max(2, item.unitsAvailable / max * 100)}%` }} /></div></div>; })}</div></section>
        <section className="card p-5 md:p-6 xl:col-span-2"><h3 className="font-display text-lg font-extrabold">Leading business customers</h3><p className="mt-1 text-xs text-[#788579]">Sales attributed to each saved customer</p>{reports.topCustomers?.length ? <div className="mt-4 grid gap-2 md:grid-cols-2">{reports.topCustomers.map((customer: any, index: number) => <div key={customer.customerId} className="flex items-center gap-3 rounded-lg bg-[#f6f9f4] px-4 py-3" data-testid={`report-customer-${customer.customerId}`}><span className="grid h-8 w-8 place-items-center rounded-full bg-[#e1f2e0] font-mono text-xs font-bold text-[#266638]">{String(index + 1).padStart(2, '0')}</span><span className="flex-1 text-sm font-semibold">{customer.customerName}</span><span className="font-mono text-sm font-bold">{money(customer.sales)}</span></div>)}</div> : <div className="mt-4"><EmptyInline title="No customer sales yet" body="Customer ranking will appear once sales are recorded." /></div>}</section>
      </div>}
    </QueryState>
  </>;
}

function SettingsPage({ user, users, customers, loading, open, isAdmin }: any) {
  return <><PageHeading title="Account & access" description="Keep your user profile current and grant the right role to each teammate." />
    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <section className="card p-5 md:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#16803b]">Your profile</p><h3 className="font-display mt-2 text-xl font-extrabold">{user.name}</h3><p className="mt-1 text-sm text-[#718074]">{user.email}</p></div><div className="grid h-12 w-12 place-items-center rounded-xl bg-[#e3f4e3] text-[#286b3c]"><Users size={21} /></div></div><div className="mt-5 space-y-3 rounded-xl bg-[#f5f8f3] p-4"><SettingLine label="Access role" value={titleCase(user.role)} /><SettingLine label="Business link" value={user.customerId ? (customers || []).find((customer: any) => customer.id === user.customerId)?.businessName || `Customer #${user.customerId}` : 'No linked business'} /><SettingLine label="Account since" value={dateLabel(user.createdAt)} /></div><button onClick={() => open('profile', user)} className="button-primary mt-5" data-testid="button-edit-profile">Edit profile details</button></section>
      <section className="card p-5 md:p-6"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#16803b]">Team access</p><h3 className="font-display mt-2 text-xl font-extrabold">People in the workspace</h3><p className="mt-1 text-sm text-[#718074]">{isAdmin ? 'Assign a role and, when applicable, link a customer business.' : 'Team permissions are managed by an administrator.'}</p></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e3f4e3] text-[#286b3c]"><ShieldCheck size={19} /></div></div>
        {isAdmin ? <QueryState loading={loading} error={undefined} empty={!loading && !users?.length}><div className="mt-5 divide-y divide-[#edf0eb]">{(users || []).map((person: any) => <div key={person.id} className="flex items-center gap-3 py-3" data-testid={`row-user-${person.id}`}><div className="grid h-9 w-9 place-items-center rounded-full bg-[#e6f2e5] text-xs font-bold text-[#286b3c]">{(person.name || person.email).slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{person.name || 'Unnamed user'}</div><div className="truncate text-[10px] text-[#7d897f]">{person.email}</div></div><StatusBadge value={person.role} /><button className="button-secondary !px-3 !py-2" onClick={() => open('role', person)} data-testid={`button-edit-role-${person.id}`}>Manage</button></div>)}</div></QueryState> : <div className="mt-5 rounded-lg border border-dashed border-[#dce5da] bg-[#fbfdf9] p-4 text-xs leading-5 text-[#718074]">Only administrators can view the full team directory or change account roles.</div>}
      </section>
    </div>
    <section className="mt-5 rounded-xl border border-[#d8e7d7] bg-[#eaf6e9] p-5"><div className="flex gap-3"><ShieldCheck size={19} className="mt-0.5 shrink-0 text-[#24703d]" /><div><h3 className="text-sm font-bold text-[#244a2d]">Access follows the account role</h3><p className="mt-1 text-xs leading-5 text-[#5a705d]">Customers can view their own business records. Staff manage nursery operations; only administrators can change team roles. Server-side permissions remain authoritative.</p></div></div></section>
  </>;
}
function SettingLine({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3 text-xs"><span className="text-[#79867b]">{label}</span><span className="text-right font-semibold text-[#35473a]">{value}</span></div>;
}
function SearchStrip({ value, onChange, placeholder, testId }: { value: string; onChange: (value: string) => void; placeholder: string; testId: string }) {
  return <label className="card mb-4 flex items-center gap-2 px-3"><Search size={16} className="text-[#849185]" /><input className="field border-0 bg-transparent shadow-none focus:ring-0" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} data-testid={testId} /></label>;
}

function Modal({ modal, onClose, onSubmit, products, customers, orders, orderLines, setOrderLines, user, isCustomer, errorMessage, isPending }: any) {
  const entity = modal.entity;
  const modalKind = modal.kind as ModalKind;
  const isEdit = !!entity;
  const title: Record<ModalKind, string> = { product: isEdit ? 'Edit product details' : 'Add product to inventory', stock: 'Record a stock movement', customer: isEdit ? 'Edit business customer' : 'Add business customer', order: 'Create a customer order', quotation: 'Create a quotation', invoice: 'Create an invoice', payment: `Record payment · ${entity?.invoiceNumber || ''}`, profile: 'Edit your profile', role: `Manage access · ${entity?.name || entity?.email || ''}` };
  const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const fields: Record<ModalKind, Array<{ name: string; label: string; type?: string; required?: boolean; value?: string; options?: Array<{ value: string; label: string }> }>> = {
    product: [
      { name: 'name', label: 'Product name', required: true, value: entity?.name },
      { name: 'sku', label: 'SKU', required: true, value: entity?.sku },
      { name: 'category', label: 'Category', required: true, value: entity?.category },
      { name: 'unit', label: 'Selling unit', required: true, value: entity?.unit || 'each' },
      { name: 'unitPrice', label: 'Price per unit (PKR)', type: 'number', required: true, value: String(entity?.unitPrice ?? '') },
      ...(!isEdit ? [{ name: 'physicalStock', label: 'Opening physical stock', type: 'number', required: true, value: '0' }] : []),
      { name: 'minimumStock', label: 'Low-stock threshold', type: 'number', required: true, value: String(entity?.minimumStock ?? '0') },
      { name: 'imageUrl', label: 'Image URL (optional)', value: entity?.imageUrl || '' },
    ],
    stock: [
      { name: 'productId', label: 'Product', required: true, options: (products || []).map((product: any) => ({ value: String(product.id), label: `${product.name} · ${product.sku} · available ${product.availableStock}` })) },
      { name: 'type', label: 'Movement type', required: true, options: ['received', 'sold', 'damaged', 'adjustment'].map((value) => ({ value, label: titleCase(value) })) },
      { name: 'quantity', label: 'Quantity (signed for adjustments)', type: 'number', required: true, value: '1' },
      { name: 'note', label: 'Note (optional)', value: '' },
    ],
    customer: [
      { name: 'businessName', label: 'Business name', required: true, value: entity?.businessName },
      { name: 'contactName', label: 'Contact name', value: entity?.contactName },
      { name: 'email', label: 'Business email', type: 'email', value: entity?.email },
      { name: 'phone', label: 'Phone', value: entity?.phone },
      { name: 'address', label: 'Business address', value: entity?.address },
      { name: 'paymentTerms', label: 'Payment terms', value: entity?.paymentTerms },
    ],
    order: [
      ...(isCustomer ? [] : [{ name: 'customerId', label: 'Business customer', required: true, options: (customers || []).filter((customer: any) => customer.isActive).map((customer: any) => ({ value: String(customer.id), label: customer.businessName })) }]),
      { name: 'notes', label: 'Order notes', value: '' },
    ],
    quotation: [
      ...(isCustomer ? [] : [{ name: 'customerId', label: 'Business customer', required: true, options: (customers || []).filter((customer: any) => customer.isActive).map((customer: any) => ({ value: String(customer.id), label: customer.businessName })) }]),
      { name: 'notes', label: 'Quote notes', value: '' },
    ],
    invoice: [{ name: 'orderId', label: 'Order to invoice', required: true, options: (orders || []).filter((order: any) => order.status !== 'cancelled').map((order: any) => ({ value: String(order.id), label: `Order #${order.id} · ${order.customerName} · ${money(order.total)}` })) }, { name: 'dueDate', label: 'Due date', type: 'date', required: true, value: defaultDueDate }],
    payment: [{ name: 'amount', label: `Amount received (outstanding ${money(entity?.outstanding)})`, type: 'number', required: true, value: String(entity?.outstanding || '') }, { name: 'method', label: 'Payment method', required: true, options: ['cash', 'bank_transfer', 'cheque', 'other'].map((value) => ({ value, label: titleCase(value) })) }, { name: 'reference', label: 'Reference / receipt (optional)' }],
    profile: [{ name: 'name', label: 'Full name', required: true, value: entity?.name }, { name: 'email', label: 'Email', required: true, type: 'email', value: entity?.email }],
    role: [{ name: 'role', label: 'Workspace role', required: true, value: entity?.role, options: ['admin', 'staff', 'customer'].map((value) => ({ value, label: titleCase(value) })) }, { name: 'customerId', label: 'Linked business (customer role)', value: entity?.customerId ? String(entity.customerId) : '', options: [{ value: '', label: 'No customer link' }, ...(customers || []).map((customer: any) => ({ value: String(customer.id), label: customer.businessName }))] }],
  };
  const editInput = (field: any) => <div key={field.name}><label className="label" htmlFor={`form-${field.name}`}>{field.label}</label>{field.options ? <select className="field" name={field.name} id={`form-${field.name}`} required={field.required} defaultValue={field.value || ''} data-testid={`select-${field.name}`}>{field.options.map((option: any) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input className="field" name={field.name} id={`form-${field.name}`} type={field.type || 'text'} required={field.required} defaultValue={field.value || ''} min={field.type === 'number' && !(modal.kind === 'stock' && field.name === 'quantity') ? '0' : undefined} step={field.type === 'number' ? 'any' : undefined} data-testid={`input-${field.name}`} />}</div>;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="dialog-title" data-testid={`dialog-${modal.kind}`}>
       <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#e7ece4] bg-[#fbfdf9]/95 px-5 py-4 backdrop-blur"><div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#16803b]">Green Karachi operations</p><h2 id="dialog-title" className="font-display mt-1 text-xl font-extrabold">{title[modalKind]}</h2></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe7dc] text-[#637264] hover:bg-[#eff5ed]" data-testid="button-close-dialog"><X size={17} /></button></div>
      <form onSubmit={onSubmit} className="space-y-4 p-5">
        {(modal.kind === 'order' || modal.kind === 'quotation') && <div className="space-y-3 rounded-xl border border-[#e3ebe0] bg-[#f6f9f4] p-3.5">
          <div className="flex items-center justify-between"><div><div className="text-xs font-bold">Product lines</div><div className="mt-1 text-[10px] text-[#778479]">Availability shown is current saved catalogue stock.</div></div><button type="button" className="button-secondary !px-2.5 !py-2" onClick={() => setOrderLines([...orderLines, { productId: '', quantity: '1' }])} data-testid="button-add-order-line"><Plus size={13} />Add line</button></div>
          {orderLines.map((line: any, index: number) => <div key={index} className="grid grid-cols-[1fr_92px_34px] items-end gap-2"><div><label className="label">Product</label><select className="field" value={line.productId} onChange={(event) => setOrderLines(orderLines.map((item: any, row: number) => row === index ? { ...item, productId: event.target.value } : item))} data-testid={`select-order-product-${index}`}><option value="">Choose a product</option>{(products || []).filter((product: any) => product.isActive && product.availableStock > 0).map((product: any) => <option key={product.id} value={product.id}>{product.name} · {product.availableStock} {product.unit} · {money(product.unitPrice)}</option>)}</select></div><div><label className="label">Quantity</label><input className="field" type="number" min="1" value={line.quantity} onChange={(event) => setOrderLines(orderLines.map((item: any, row: number) => row === index ? { ...item, quantity: event.target.value } : item))} data-testid={`input-order-quantity-${index}`} /></div><button type="button" className="grid h-10 w-9 place-items-center rounded-lg border border-[#e1e8df] text-[#798579] hover:text-[#a63828]" onClick={() => setOrderLines(orderLines.length > 1 ? orderLines.filter((_: any, row: number) => row !== index) : [{ productId: '', quantity: '1' }])} title="Remove line" data-testid={`button-remove-order-line-${index}`}><X size={15} /></button></div>)}
        </div>}
        {errorMessage && <div className="flex items-start gap-2 rounded-lg border border-[#f0cdc5] bg-[#fff2ef] p-3 text-xs leading-5 text-[#9f3021]" role="alert" data-testid="status-form-error"><CircleAlert className="mt-0.5 shrink-0" size={15} />{errorMessage}</div>}
         <div className="grid gap-3 sm:grid-cols-2">{fields[modalKind].map(editInput)}</div>
        {modal.kind === 'product' && isEdit && <p className="rounded-lg bg-[#edf6ec] p-3 text-xs leading-5 text-[#4d6751]">Physical stock changes are recorded as stock movements so the inventory history stays complete.</p>}
        {modal.kind === 'payment' && <p className="rounded-lg bg-[#fff4da] p-3 text-xs leading-5 text-[#735820]">Payment is saved against this invoice only. The balance and invoice status update from the recorded amount.</p>}
        {modal.kind === 'role' && <p className="rounded-lg bg-[#edf6ec] p-3 text-xs leading-5 text-[#4d6751]">Customer access should be linked to the matching business customer. Server-side authorization is still applied.</p>}
        <div className="flex justify-end gap-2 border-t border-[#e8ede5] pt-4"><button type="button" onClick={onClose} className="button-secondary" data-testid="button-cancel-form">Cancel</button><button type="submit" className="button-primary min-w-[138px]" disabled={isPending} data-testid="button-submit-form">{isPending ? 'Saving…' : <><Check size={15} />Save record</>}</button></div>
      </form>
    </section>
  </div>;
}

function App() {
  return <ClerkRouter />;
}

export default App;
