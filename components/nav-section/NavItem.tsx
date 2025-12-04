'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  List,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { NavItem as NavItemType } from '@/lib/navigation/config';

interface NavItemProps {
  item: NavItemType;
  navCollapsed?: boolean;
}

export default function NavItem({ item, navCollapsed = false }: NavItemProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = pathname === item.path || (hasChildren && item.children?.some((child) => child.path === pathname));

  // Prefetch on hover for faster navigation
  const handleMouseEnter = (path: string) => {
    router.prefetch(path);
  };

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
              borderRadius: 1.5,
              mb: 0.5,
              justifyContent: navCollapsed ? 'center' : 'flex-start',
              px: navCollapsed ? 1 : 2,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: 'action.hover',
                transform: 'translateX(4px)',
              },
              '&.Mui-selected': {
                bgcolor: 'primary.lighter',
                color: 'primary.main',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'primary.lighter',
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
                  '& svg': {
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    bgcolor: isActive ? 'primary.lighter' : 'transparent',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {item.icon}
                </Box>
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
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: open ? 'primary.main' : 'action.hover',
                    color: open ? 'primary.contrastText' : 'text.secondary',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      transform: open ? 'rotate(180deg) scale(1.1)' : 'rotate(0deg) scale(1.1)',
                    },
                  }}
                >
                  {open ? (
                    <RemoveIcon sx={{ fontSize: 18, transition: 'transform 0.3s ease' }} />
                  ) : (
                    <AddIcon sx={{ fontSize: 18, transition: 'transform 0.3s ease' }} />
                  )}
                </Box>
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
                      prefetch={true}
                      onMouseEnter={() => handleMouseEnter(child.path)}
                      selected={childActive}
                      sx={{
                        minHeight: 36,
                        borderRadius: 1.5,
                        mb: 0.5,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          transform: 'translateX(4px)',
                        },
                        '&.Mui-selected': {
                          bgcolor: 'primary.lighter',
                          color: 'primary.main',
                          fontWeight: 600,
                          '&:hover': {
                            bgcolor: 'primary.lighter',
                          },
                        },
                      }}
                    >
                      {child.icon && (
                        <ListItemIcon
                          sx={{
                            minWidth: 36,
                            color: childActive ? 'primary.main' : 'text.secondary',
                            '& svg': {
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              transform: childActive ? 'scale(1.1)' : 'scale(1)',
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 28,
                              height: 28,
                              borderRadius: 1,
                              bgcolor: childActive ? 'primary.lighter' : 'transparent',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          >
                            {child.icon}
                          </Box>
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
        prefetch={true}
        onMouseEnter={() => handleMouseEnter(item.path)}
        selected={isActive}
        sx={{
          minHeight: 44,
          borderRadius: 1.5,
          mb: 0.5,
          justifyContent: navCollapsed ? 'center' : 'flex-start',
          px: navCollapsed ? 1 : 2,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            bgcolor: 'action.hover',
            transform: 'translateX(4px)',
          },
          '&.Mui-selected': {
            bgcolor: 'primary.lighter',
            color: 'primary.main',
            fontWeight: 600,
            '&:hover': {
              bgcolor: 'primary.lighter',
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
              '& svg': {
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: isActive ? 'primary.lighter' : 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {item.icon}
            </Box>
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
