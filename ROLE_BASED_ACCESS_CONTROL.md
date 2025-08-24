# Role-Based Access Control (RBAC) System

This document explains how the role-based access control system works in the ICT Dashboard application.

## Overview

The application implements a simple two-tier role system:
- **Admin**: Full access to all features including the admin panel
- **User**: Access to all features except the admin panel

## How It Works

### 1. First User Becomes Admin
- When the first user signs up, they automatically become an admin
- This is determined by checking if the `users` collection in Firestore is empty
- Subsequent users become regular users by default

### 2. User Role Storage
- User roles are stored in Firestore in the `users` collection
- Each user document contains:
  - `uid`: Firebase Auth user ID
  - `email`: User's email address
  - `role`: Either 'admin' or 'user'
  - `createdAt`: Timestamp when the user was created
  - `displayName`: Optional display name

### 3. Role Checking
- The `AuthContext` automatically loads user roles when users sign in
- The `isAdmin` boolean is available throughout the application
- Components can check `isAdmin` to conditionally render admin-only features

## Components

### AuthContext
- Manages user authentication and role information
- Provides `isAdmin`, `userRole`, and `refreshUserRole` to components
- Automatically loads user roles on authentication state changes

### AdminRoute
- Protects admin-only routes
- Redirects non-admin users to the home page
- Shows an "Access Denied" message for unauthorized access

### ProtectedRoute
- Protects routes that require authentication
- Redirects unauthenticated users to the login page

## Admin Features

### Admin Panel (`/admin`)
- Full access to manage chapters, tutorials, practice sections, and exams
- User management interface to view and modify user roles
- Ability to promote users to admin or demote admins to users
- Protection against removing the last admin user

### User Management
- View all users in the system
- See user roles, creation dates, and contact information
- Promote regular users to admin
- Demote admins to regular users (with safety checks)

## Security Features

### Role Validation
- Server-side role checking in the user service
- Prevention of removing the last admin user
- Input validation for all role operations

### Route Protection
- Admin routes are protected at the component level
- Unauthorized access attempts are redirected
- Clear error messages for access denied scenarios

## Usage Examples

### Checking Admin Status in Components
```tsx
const { isAdmin } = useAuth();

if (isAdmin) {
  // Show admin-only features
  return <AdminPanel />;
}
```

### Conditional Rendering
```tsx
{isAdmin && (
  <Link href="/admin">Admin Panel</Link>
)}
```

### Role-Based Navigation
```tsx
const menuItems = [
  { href: '/home', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  ...(isAdmin ? [{ href: '/admin', label: 'Admin Panel' }] : []),
];
```

## Database Schema

### Users Collection
```
users/{uid}
├── email: string
├── role: 'admin' | 'user'
├── createdAt: timestamp
└── displayName: string (optional)
```

## Best Practices

1. **Always check roles on the client side** for UI rendering
2. **Use AdminRoute component** for admin-only pages
3. **Validate roles on the server side** for critical operations
4. **Provide clear feedback** when access is denied
5. **Maintain at least one admin user** in the system

## Troubleshooting

### Common Issues

1. **User not getting admin role**: Check if they're the first user to sign up
2. **Admin panel not showing**: Verify the user has admin role in Firestore
3. **Access denied errors**: Ensure the user is authenticated and has proper role

### Debug Information
- Check browser console for role-related logs
- Verify user document exists in Firestore
- Confirm authentication state is properly loaded

## Future Enhancements

- Multi-level role system (super admin, moderator, etc.)
- Role-based permissions for specific features
- Audit logging for role changes
- Bulk user role management
- Role expiration and temporary permissions
