import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserRole {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
  displayName?: string;
  profileImage?: string;
  lastLogin?: Date;
}

export const userService = {
  // Get user role from Firestore
  async getUserRole(uid: string): Promise<UserRole | null> {
    try {
      if (!uid) {
        console.error('User ID is required');
        return null;
      }

      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid: userDoc.id,
          email: data.email,
          role: data.role,
          createdAt: data.createdAt?.toDate() || new Date(),
          displayName: data.displayName,
          profileImage: data.profileImage,
          lastLogin: data.lastLogin?.toDate() || new Date()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  },

  // Create or update user role
  async createUserRole(uid: string, email: string, displayName?: string): Promise<UserRole> {
    try {
      if (!uid || !email) {
        throw new Error('User ID and email are required');
      }

      console.log('Creating user role for:', { uid, email, displayName });

      // Check if this is the first user (should become admin)
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt'), limit(1));
      const usersSnapshot = await getDocs(usersQuery);
      
      let role: 'admin' | 'user' = 'user';
      if (usersSnapshot.empty) {
        // First user becomes admin
        role = 'admin';
        console.log('First user signing up - assigning admin role');
      }

      const userData: Omit<UserRole, 'uid'> = {
        email,
        role,
        createdAt: new Date(),
        displayName,
        lastLogin: new Date()
      };

      console.log('User data to be created:', userData);

      // Use setDoc to ensure the document is created
      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, userData);
      
      console.log(`User role created successfully: ${email} as ${role}`);

      // Verify the document was created
      const createdDoc = await getDoc(userDocRef);
      if (!createdDoc.exists()) {
        throw new Error('Failed to create user document - document does not exist after creation');
      }

      console.log('User document verified in database');

      return {
        uid,
        ...userData
      };
    } catch (error) {
      console.error('Error creating user role:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        throw new Error(`Failed to create user: ${error.message}`);
      } else {
        throw new Error('Failed to create user: Unknown error occurred');
      }
    }
  },

  // Update user profile information
  async updateUserProfile(uid: string, updates: Partial<Pick<UserRole, 'displayName' | 'profileImage'>>): Promise<void> {
    try {
      if (!uid) {
        throw new Error('User ID is required');
      }

      const updateData: Partial<Pick<UserRole, 'displayName' | 'profileImage'>> = {};
      if (updates.displayName !== undefined) updateData.displayName = updates.displayName;
      if (updates.profileImage !== undefined) updateData.profileImage = updates.profileImage;

      if (Object.keys(updateData).length === 0) {
        throw new Error('No updates provided');
      }

      console.log('Updating user profile:', { uid, updates: updateData });

      // First check if the user document exists
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error(`User document does not exist for UID: ${uid}`);
      }

      console.log('User document exists, proceeding with update...');

      // Use setDoc with merge option to ensure the update works properly
      await setDoc(userDocRef, updateData, { merge: true });
      
      console.log(`User profile updated successfully: ${uid}`);
    } catch (error) {
      console.error('Error updating user profile:', error);
      
      // Check for specific Firestore errors
      if (error && typeof error === 'object' && 'code' in error) {
        const firestoreError = error as { code: string; message: string };
        switch (firestoreError.code) {
          case 'permission-denied':
            throw new Error('Permission denied: Check Firestore security rules');
          case 'unauthenticated':
            throw new Error('User not authenticated');
          case 'not-found':
            throw new Error('User document not found');
          default:
            throw new Error(`Firestore error: ${firestoreError.code} - ${firestoreError.message}`);
        }
      }
      
      // Provide more specific error messages
      if (error instanceof Error) {
        throw new Error(`Failed to update profile: ${error.message}`);
      } else {
        throw new Error('Failed to update profile: Unknown error occurred');
      }
    }
  },

  // Update last login time
  async updateLastLogin(uid: string): Promise<void> {
    try {
      if (!uid) return;
      
      await updateDoc(doc(db, 'users', uid), {
        lastLogin: new Date()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  },

  // Check if user is admin
  async isAdmin(uid: string): Promise<boolean> {
    try {
      if (!uid) {
        return false;
      }

      const userRole = await this.getUserRole(uid);
      return userRole?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },

  // Get all users (admin only)
  async getAllUsers(): Promise<UserRole[]> {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users: UserRole[] = [];
      
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          uid: doc.id,
          email: data.email,
          role: data.role,
          createdAt: data.createdAt?.toDate() || new Date(),
          displayName: data.displayName,
          profileImage: data.profileImage,
          lastLogin: data.lastLogin?.toDate() || new Date()
        });
      });

      return users.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  },

  // Update user role (admin only)
  async updateUserRole(uid: string, newRole: 'admin' | 'user'): Promise<void> {
    try {
      if (!uid || !newRole) {
        throw new Error('User ID and new role are required');
      }

      // Prevent removing the last admin
      if (newRole === 'user') {
        const allUsers = await this.getAllUsers();
        const adminUsers = allUsers.filter(user => user.role === 'admin');
        if (adminUsers.length === 1 && adminUsers[0].uid === uid) {
          throw new Error('Cannot remove the last admin user');
        }
      }

      await setDoc(doc(db, 'users', uid), { role: newRole }, { merge: true });
      console.log(`User role updated: ${uid} to ${newRole}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  // Manually create user document if it doesn't exist (for existing users)
  async ensureUserDocument(uid: string, email: string, displayName?: string): Promise<UserRole> {
    try {
      if (!uid || !email) {
        throw new Error('User ID and email are required');
      }

      console.log('Ensuring user document exists for:', { uid, email });

      // Check if user document already exists
      const existingUser = await this.getUserRole(uid);
      if (existingUser) {
        console.log('User document already exists:', existingUser);
        return existingUser;
      }

      console.log('User document does not exist, creating new one...');

      // Create the user document
      const userRole = await this.createUserRole(uid, email, displayName);
      console.log('User document created successfully:', userRole);
      
      return userRole;
    } catch (error) {
      console.error('Error ensuring user document:', error);
      throw error;
    }
  },

  // Test database connection and permissions
  async testDatabaseConnection(uid: string): Promise<{ success: boolean; message: string; details?: Record<string, unknown> }> {
    try {
      if (!uid) {
        return { success: false, message: 'User ID is required' };
      }

      console.log('Testing database connection for UID:', uid);

      // Test 1: Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        return { 
          success: false, 
          message: 'User document does not exist',
          details: { uid, exists: false }
        };
      }

      // Test 2: Try to read user data
      const userData = userDoc.data();
      console.log('User data read successfully:', userData);

      // Test 3: Try to write a small update
      const testUpdate = { lastTested: new Date() };
      await setDoc(doc(db, 'users', uid), testUpdate, { merge: true });
      console.log('Test write successful');

      return { 
        success: true, 
        message: 'Database connection and permissions working correctly',
        details: { uid, exists: true, canRead: true, canWrite: true }
      };

    } catch (error) {
      console.error('Database connection test failed:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error && typeof error === 'object' && 'code' in error) {
        const firestoreError = error as { code: string; message: string };
        errorMessage = `Firestore error: ${firestoreError.code} - ${firestoreError.message}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return { 
        success: false, 
        message: `Database test failed: ${errorMessage}`,
        details: { error: errorMessage }
      };
    }
  }
};
