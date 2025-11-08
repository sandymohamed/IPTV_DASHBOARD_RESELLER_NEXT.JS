'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  List,
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { NavItem as NavItemType } from '@/lib/navigation/config';

interface NavItemProps {
  item: NavItemType;
  navCollapsed?: boolean;
}

export default function NavItem({ item, navCollapsed = false }: NavItemProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = pathname === item.path || (hasChildren && item.children?.some((child) => child.path === pathname));

  const handleClick = () => {
    if (hasChildren && !navCollapsed) {
      setOpen(!open);
    }
  };

  if (hasChildren) {
    return (
      <>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleClick}
            selected={isActive}
            sx={{
              minHeight: 44,
              borderRadius: 1,
              mb: 0.5,
              justifyContent: navCollapsed ? 'center' : 'flex-start',
              px: navCollapsed ? 1 : 2,
              '&.Mui-selected': {
                bgcolor: 'action.selected',
                '&:hover': {
                  bgcolor: 'action.selected',
                },
              },
            }}
            title={navCollapsed ? item.title : undefined}
          >
            {item.icon && (
              <ListItemIcon
                sx={{
                  minWidth: navCollapsed ? 0 : 40,
                  color: isActive ? 'primary.main' : 'text.secondary',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
            )}
            {!navCollapsed && (
              <>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
                {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </>
            )}
          </ListItemButton>
        </ListItem>
        {!navCollapsed && (
          <Collapse in={open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 3 }}>
              {item.children?.map((child) => {
                const childActive = pathname === child.path;
                return (
                  <ListItem key={child.path} disablePadding>
                    <ListItemButton
                      component={Link}
                      href={child.path}
                      selected={childActive}
                      sx={{
                        minHeight: 36,
                        borderRadius: 1,
                        mb: 0.5,
                        '&.Mui-selected': {
                          bgcolor: 'action.selected',
                          '&:hover': {
                            bgcolor: 'action.selected',
                          },
                        },
                      }}
                    >
                      {child.icon && (
                        <ListItemIcon
                          sx={{
                            minWidth: 36,
                            color: childActive ? 'primary.main' : 'text.secondary',
                          }}
                        >
                          {child.icon}
                        </ListItemIcon>
                      )}
                      <ListItemText
                        primary={child.title}
                        primaryTypographyProps={{
                          fontSize: 13,
                          fontWeight: childActive ? 600 : 400,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Collapse>
        )}
      </>
    );
  }

  return (
    <ListItem disablePadding>
      <ListItemButton
        component={Link}
        href={item.path}
        selected={isActive}
        sx={{
          minHeight: 44,
          borderRadius: 1,
          mb: 0.5,
          justifyContent: navCollapsed ? 'center' : 'flex-start',
          px: navCollapsed ? 1 : 2,
          '&.Mui-selected': {
            bgcolor: 'action.selected',
            '&:hover': {
              bgcolor: 'action.selected',
            },
          },
        }}
        title={navCollapsed ? item.title : undefined}
      >
        {item.icon && (
          <ListItemIcon
            sx={{
              minWidth: navCollapsed ? 0 : 40,
              color: isActive ? 'primary.main' : 'text.secondary',
              justifyContent: 'center',
            }}
          >
            {item.icon}
          </ListItemIcon>
        )}
        {!navCollapsed && (
          <ListItemText
            primary={item.title}
            primaryTypographyProps={{
              fontSize: 14,
              fontWeight: isActive ? 600 : 500,
            }}
          />
        )}
      </ListItemButton>
    </ListItem>
  );
}
