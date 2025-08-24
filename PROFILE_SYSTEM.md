# Profile System Documentation

This document explains how the profile system works in the ICT Dashboard application, including profile image upload and management.

## Overview

The profile system allows users to:
- View and edit their profile information
- Upload and manage profile images
- Update display names
- View account statistics and role information

## Features

### 1. Profile Image Management
- **Upload**: Users can upload profile images in JPEG, PNG, or GIF format
- **Size Limit**: Maximum file size of 5MB
- **Storage**: Images are stored as base64 strings in Firestore
- **Fallback**: Default user icon is shown when no image is uploaded
- **Removal**: Users can remove their profile image

### 2. Profile Information
- **Display Name**: Editable display name
- **Email**: Read-only email address
- **Account Type**: Shows user role (Admin/User)
- **Member Since**: Account creation date
- **Last Login**: Last login timestamp (automatically updated)

### 3. Responsive Design
- **Mobile-First**: Optimized for all screen sizes
- **Touch-Friendly**: Easy to use on mobile devices
- **Responsive Layout**: Adapts to different screen dimensions

## Components

### ProfilePage (`/profile`)
- Main profile management interface
- Handles image upload and profile editing
- Shows user information and statistics

### ProfileImage
- Reusable component for displaying profile images
- Multiple size options (sm, md, lg, xl)
- Automatic fallback to user icon
- Consistent styling across the application

## Database Schema

### Users Collection
```
users/{uid}
├── email: string
├── role: 'admin' | 'user'
├── createdAt: timestamp
├── displayName: string (optional)
├── profileImage: string (optional, base64)
└── lastLogin: timestamp
```

## API Functions

### User Service
- `getUserRole(uid)`: Retrieve user profile data
- `updateUserProfile(uid, updates)`: Update profile information
- `updateLastLogin(uid)`: Update last login timestamp

### Auth Context
- `updateProfile(updates)`: Update profile from React components
- `userRole`: Access to current user's profile data

## Image Upload Process

1. **File Selection**: User selects an image file
2. **Validation**: File size and type are checked
3. **Processing**: Image is converted to base64 string
4. **Storage**: Base64 string is saved to Firestore
5. **UI Update**: Profile image is immediately displayed

## Security Features

- **File Type Validation**: Only image files are accepted
- **Size Limits**: Prevents large file uploads
- **Authentication Required**: Profile access requires login
- **Role-Based Access**: Admin users see additional information

## Usage Examples

### Display Profile Image
```tsx
import ProfileImage from '@/components/ProfileImage';

<ProfileImage 
  src={user.profileImage} 
  alt="User Profile" 
  size="md" 
/>
```

### Update Profile
```tsx
const { updateProfile } = useAuth();

await updateProfile({ 
  displayName: 'New Name',
  profileImage: 'base64-string' 
});
```

### Check User Role
```tsx
const { userRole } = useAuth();

if (userRole?.role === 'admin') {
  // Show admin features
}
```

## Navigation Integration

The profile page is accessible from:
- **Home Page**: Navigation menu
- **Dashboard**: Navigation menu  
- **Admin Panel**: Navigation menu
- **Mobile Menu**: Responsive navigation

## Responsive Breakpoints

- **Mobile**: < 640px - Single column layout
- **Tablet**: 640px - 1024px - Optimized spacing
- **Desktop**: > 1024px - Full two-column layout

## Performance Considerations

- **Image Compression**: Consider implementing image compression
- **Lazy Loading**: Profile images are loaded on demand
- **Caching**: Profile data is cached in React context
- **Optimization**: Base64 images are stored efficiently

## Future Enhancements

- **Image Cropping**: Allow users to crop profile images
- **Multiple Formats**: Support for WebP and other modern formats
- **Cloud Storage**: Move images to Firebase Storage
- **Image Resizing**: Automatic image resizing for different use cases
- **Profile Templates**: Pre-designed profile layouts
- **Social Features**: Profile sharing and connections

## Troubleshooting

### Common Issues

1. **Image Not Uploading**: Check file size and format
2. **Profile Not Saving**: Verify user authentication
3. **Image Not Displaying**: Check base64 string format
4. **Permission Errors**: Ensure user is logged in

### Debug Information

- Check browser console for error messages
- Verify Firestore permissions
- Confirm image file format and size
- Check network requests for upload failures

## Best Practices

1. **Image Optimization**: Use appropriate image sizes
2. **Error Handling**: Always provide user feedback
3. **Loading States**: Show progress during uploads
4. **Validation**: Validate files before processing
5. **Accessibility**: Provide alt text for images
6. **Responsiveness**: Test on multiple devices
