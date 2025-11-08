'use client';

import { usePathname } from 'next/navigation';
import { Box, List, ListSubheader } from '@mui/material';
import { NavGroup } from '@/lib/navigation/config';
import NavItem from './NavItem';

interface NavSectionProps {
  data: NavGroup[];
  navCollapsed?: boolean;
}

export default function NavSection({ data, navCollapsed = false }: NavSectionProps) {
  return (
    <Box>
      {data.map((group) => (
        <List key={group.subheader} disablePadding sx={{ px: navCollapsed ? 0.5 : 2 }}>
          {!navCollapsed && (
            <ListSubheader
              disableSticky
              sx={{
                mt: 3,
                mb: 2,
                pl: 3,
                pr: 2,
                textTransform: 'uppercase',
                fontSize: 12,
                fontWeight: 700,
                color: 'text.secondary',
              }}
            >
              {group.subheader}
            </ListSubheader>
          )}

          {group.items.map((item) => (
            <NavItem key={item.title} item={item} navCollapsed={navCollapsed} />
          ))}
        </List>
      ))}
    </Box>
  );
}
