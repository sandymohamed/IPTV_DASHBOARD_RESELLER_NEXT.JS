import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TvIcon from '@mui/icons-material/Tv';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import MapIcon from '@mui/icons-material/Map';
import HistoryIcon from '@mui/icons-material/History';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export interface NavItem {
  title: string;
  path: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

export interface NavGroup {
  subheader: string;
  items: NavItem[];
}

export const navConfig: NavGroup[] = [
  {
    subheader: 'general',
    items: [
      {
        title: 'Main',
        path: '/dashboard',
        icon: <SettingsIcon />,
        children: [
          {
            title: 'Dashboard',
            path: '/dashboard/home',
            icon: <DashboardIcon />,
          },
          {
            title: 'Client Connections',
            path: '/dashboard/client-connection',
            icon: <SupportAgentIcon />,
          },
          {
            title: 'Map Connections',
            path: '/dashboard/map',
            icon: <MapIcon />,
          },
          {
            title: 'Tickets',
            path: '/dashboard/tickets',
            icon: <SupportAgentIcon />,
          },
          {
            title: 'User Activity',
            path: '/dashboard/user-activity-logs',
            icon: <HistoryIcon />,
          },
        ],
      },
    ],
  },
  {
    subheader: 'management',
    items: [
      {
        title: 'Lines',
        path: '/dashboard/user',
        icon: <PeopleIcon />,
        children: [
          { title: 'List', path: '/dashboard/user/list' },
          { title: 'Create', path: '/dashboard/user/new' },
        ],
      },
      {
        title: 'Mags',
        path: '/dashboard/mags',
        icon: <TvIcon />,
        children: [
          { title: 'List', path: '/dashboard/mags/list' },
          { title: 'Create', path: '/dashboard/mags/create' },
        ],
      },
      {
        title: 'Enigmas',
        path: '/dashboard/enigmas',
        icon: <TvIcon />,
        children: [
          { title: 'List', path: '/dashboard/enigmas/list' },
          { title: 'Create', path: '/dashboard/enigmas/create' },
        ],
      },
      {
        title: 'Templates Bouquets',
        path: '/dashboard/templates',
        icon: <ShoppingCartIcon />,
        children: [
          { title: 'List', path: '/dashboard/templates/list' },
          { title: 'Create', path: '/dashboard/templates/create' },
        ],
      },
      {
        title: 'Subresellers',
        path: '/dashboard/sub-resel',
        icon: <PeopleIcon />,
        children: [
          { title: 'List', path: '/dashboard/sub-resel/list' },
          { title: 'Create', path: '/dashboard/sub-resel/add' },
        ],
      },
      {
        title: 'Billings',
        path: '/dashboard/payments',
        icon: <ReceiptIcon />,
        children: [
          { title: 'Payments', path: '/dashboard/payments/list' },
          { title: 'Add Payment', path: '/dashboard/payments/add-payment' },
          { title: 'Sub Resel Payments', path: '/dashboard/payments/sub-resellers' },
          { title: 'Invoices', path: '/dashboard/payments/invoices' },
          { title: 'Sub Resel Invoices', path: '/dashboard/payments/sub-invoices' },
          { title: 'Transfer Credit', path: '/dashboard/payments/add-transfer' },
        ],
      },
      {
        title: 'Codes',
        path: '/dashboard/codes',
        icon: <VpnKeyIcon />,
        children: [
          { title: 'List', path: '/dashboard/codes/list' },
          { title: 'Create', path: '/dashboard/codes/add-code' },
        ],
      },
      {
        title: 'Account',
        path: '/dashboard/account',
        icon: <AccountCircleIcon />,
      },
    ],
  },
];
