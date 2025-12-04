import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import HomeIcon from '@mui/icons-material/Home';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import TimelineIcon from '@mui/icons-material/Timeline';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import DevicesIcon from '@mui/icons-material/Devices';
import CategoryIcon from '@mui/icons-material/Category';
import GroupsIcon from '@mui/icons-material/Groups';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PersonIcon from '@mui/icons-material/Person';

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
        icon: <HomeIcon />,
        children: [
          {
            title: 'Dashboard',
            path: '/dashboard/home',
            icon: <DashboardIcon />,
          },
          {
            title: 'Live Connections',
            path: '/dashboard/client-connection',
            icon: <NetworkCheckIcon />,
          },
          // {
          //   title: 'Map Connections',
          //   path: '/dashboard/map',
          //   icon: <LocationOnIcon />,
          // },
          {
            title: 'Tickets',
            path: '/dashboard/tickets',
            icon: <QuestionAnswerIcon />,
          },
          {
            title: 'User Activity',
            path: '/dashboard/user-activity-logs',
            icon: <TimelineIcon />,
          },
        ],
      },
    ],
  },
  {
    subheader: 'management',
    items: [
      {
        title: 'Users Lines',
        path: '/dashboard/user',
        icon: <PeopleIcon />,
        children: [
          { title: 'List', path: '/dashboard/user/list' },
          { title: 'Create', path: '/dashboard/user/new' },
        ],
      },
      {
        title: 'Active Codes',
        path: '/dashboard/codes',
        icon: <VpnKeyIcon />,
        children: [
          { title: 'List', path: '/dashboard/codes/list' },
          { title: 'Create', path: '/dashboard/codes/add-code' },
        ],
      },
      {
        title: 'MAG Devices',
        path: '/dashboard/mags',
        icon: <SmartDisplayIcon />,
        children: [
          { title: 'List', path: '/dashboard/mags/list' },
          // { title: 'Create', path: '/dashboard/mags/create' },
          { title: 'Create', path: '/dashboard/mags/new' },
        ],
      },

      {
        title: 'Enigma Devices',
        path: '/dashboard/enigmas',
        icon: <DevicesIcon />,
        children: [
          { title: 'List', path: '/dashboard/enigmas/list' },
          // { title: 'Create', path: '/dashboard/enigmas/create' },
          { title: 'Create', path: '/dashboard/enigmas/new' },
        ],
      },
      {
        title: 'Templates Bouquets',
        path: '/dashboard/templates',
        icon: <CategoryIcon />,
        children: [
          { title: 'List', path: '/dashboard/templates/list' },
          { title: 'Create', path: '/dashboard/templates/create' },
        ],
      },
      {
        title: 'Subresellers',
        path: '/dashboard/sub-resel',
        icon: <GroupsIcon />,
        children: [
          { title: 'List', path: '/dashboard/sub-resel/list' },
          { title: 'Create', path: '/dashboard/sub-resel/add' },
        ],
      },
      {
        title: 'Billings',
        path: '/dashboard/payments',
        icon: <AccountBalanceWalletIcon />,
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
        title: 'Account',
        path: '/dashboard/account',
        icon: <PersonIcon />,
      },
    ],
  },
];
