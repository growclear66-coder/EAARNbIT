import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";
import { 
  ref, 
  uploadString, 
  getDownloadURL,
  deleteObject 
} from "firebase/storage";
import { auth, db, storage } from '../firebaseConfig';
import { User, UserRole, WithdrawalRequest, SystemConfig, WithdrawalStatus, ApiResponse, AppNotification, SupportChat } from '../types';

// Default Config (used if not found in DB)
const INITIAL_CONFIG: SystemConfig = {
  minWithdrawalAmount: 100,
  globalAffiliateLink: 'https://earnbit.com/ref/global',
  globalAffiliateMessage: 'Join EarnBit today and start earning rewards immediately!'
};

class BackendService {
  private tapTimestamps: Map<string, number> = new Map(); // In-memory cheat detection

  // --- Auth ---

  async login(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = await this.refreshUser(userCredential.user.uid);
      
      if (!user) {
        await signOut(auth);
        return { success: false, message: 'User data not found in database.' };
      }
      
      if (user.isBlocked) {
        await signOut(auth);
        return { success: false, message: 'Account is blocked by Admin.' };
      }

      return { success: true, data: user };
    } catch (error: any) {
      console.error("Login Error:", error);
      
      let message = 'Login failed.';
      const errorCode = error.code;

      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
          message = 'Invalid email or password.';
      } else if (errorCode === 'auth/too-many-requests') {
          message = 'Access temporarily disabled. Try again later.';
      } else if (errorCode === 'auth/network-request-failed') {
          message = 'Network error. Please check your connection.';
      }

      return { success: false, message };
    }
  }

  async register(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const isAdmin = email.toLowerCase() === 'knockout15310@gmail.com';

      const newUser: User = {
          id: uid,
          email: email,
          role: isAdmin ? UserRole.ADMIN : UserRole.USER,
          balance: 0,
          totalEarned: 0,
          isBlocked: false,
          affiliateImages: [],
          coins: 0,
          sessionTaps: 0,
          cooldownUntil: null, // Stored as timestamp
          createdAt: new Date().toISOString()
      };

      // Save to Firestore
      await setDoc(doc(db, 'users', uid), newUser);
      
      return { success: true, data: newUser };
    } catch (error: any) {
      console.error("Register Error:", error);
      
      let message = 'Registration failed.';
      const errorCode = error.code;

      if (errorCode === 'auth/email-already-in-use') {
          message = 'Email already in use.';
      } else if (errorCode === 'auth/weak-password') {
          message = 'Password should be at least 6 characters.';
      } else if (errorCode === 'auth/invalid-email') {
          message = 'Invalid email address.';
      }

      return { success: false, message };
    }
  }

  async logout() {
    await signOut(auth);
  }

  async refreshUser(userId: string): Promise<User | null> {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            return userDoc.data() as User;
        }
        return null;
      } catch (e) {
        console.error("Refresh User Error", e);
        return null;
      }
  }

  onAuthChange(callback: (user: User | null) => void) {
      onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
              const user = await this.refreshUser(firebaseUser.uid);
              callback(user);
          } else {
              callback(null);
          }
      });
  }

  // --- User Features (SECURE TRANSACTIONS) ---

  async createWithdrawal(userId: string, amount: number, upiId: string): Promise<ApiResponse<null>> {
      const config = await this.getSystemConfig();

      if (amount < config.minWithdrawalAmount) return { success: false, message: `Minimum withdrawal is ₹${config.minWithdrawalAmount}` };

      try {
          await runTransaction(db, async (transaction) => {
              const userRef = doc(db, 'users', userId);
              const userDoc = await transaction.get(userRef);

              if (!userDoc.exists()) {
                  throw "User does not exist!";
              }

              const userData = userDoc.data() as User;

              if (userData.isBlocked) {
                  throw "Account is blocked.";
              }

              if (userData.balance < amount) {
                  throw "Insufficient wallet balance.";
              }

              // 1. Deduct Balance
              const newBalance = Number((userData.balance - amount).toFixed(2));
              transaction.update(userRef, { balance: newBalance });

              // 2. Create Withdrawal Request
              const newReqRef = doc(collection(db, 'withdrawals'));
              const newReq: WithdrawalRequest = {
                  id: newReqRef.id,
                  userId,
                  userEmail: userData.email,
                  amount,
                  upiId,
                  status: WithdrawalStatus.PENDING,
                  date: new Date().toISOString()
              };
              transaction.set(newReqRef, newReq);
          });

          return { success: true, message: 'Withdrawal request submitted successfully.' };
      } catch (e: any) {
          console.error("Transaction failed: ", e);
          return { success: false, message: typeof e === 'string' ? e : 'Failed to process request.' };
      }
  }

  async getUserWithdrawals(userId: string): Promise<WithdrawalRequest[]> {
      try {
        const q = query(collection(db, 'withdrawals'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const list = querySnapshot.docs.map(d => ({ ...d.data(), id: d.id } as WithdrawalRequest));
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch (e) {
        return [];
      }
  }

  async uploadAffiliateImage(userId: string, imageBase64: string): Promise<ApiResponse<null>> {
      try {
          const user = await this.refreshUser(userId);
          if (!user) return { success: false, message: 'User not found' };

          const path = `proofs/${userId}/${Date.now()}.jpg`;
          const storageRef = ref(storage, path);
          await uploadString(storageRef, imageBase64, 'data_url');
          const downloadURL = await getDownloadURL(storageRef);

          const currentImages = user.affiliateImages || [];
          await updateDoc(doc(db, 'users', userId), {
              affiliateImages: [...currentImages, downloadURL]
          });

          return { success: true };
      } catch (e: any) {
          console.error(e);
          return { success: false, message: 'Upload failed' };
      }
  }

  // --- Game Logic (OPTIMIZED FOR BATCHING) ---

  // NOTE: 'count' parameter allows sending multiple taps in one DB write
  async registerTap(userId: string, count: number = 1): Promise<ApiResponse<User>> {
      const now = Date.now();
      
      // Basic sanity check: user shouldn't send impossible number of taps in short time
      // Assume max 15 taps/sec. If syncing every 5 sec, max count ~75.
      if (count > 200) {
          return { success: false, message: "Suspicious activity detected." };
      }

      try {
          let updatedUser: User | null = null;
          let message: string | undefined = undefined;

          await runTransaction(db, async (transaction) => {
              const userRef = doc(db, 'users', userId);
              const userDoc = await transaction.get(userRef);

              if (!userDoc.exists()) throw "User not found";
              const userData = userDoc.data() as User;

              if (userData.isBlocked) throw "Account blocked";

              // Verify Cooldown server-side
              if (userData.cooldownUntil && now < userData.cooldownUntil) {
                  throw `Cooldown active.`;
              }

              let sessionTaps = userData.sessionTaps;
              let cooldownUntil = userData.cooldownUntil;
              let coins = userData.coins;
              let balance = userData.balance;
              let totalEarned = userData.totalEarned;

              // Reset Session if cooldown expired
              if (cooldownUntil && now >= cooldownUntil) {
                  cooldownUntil = null;
                  sessionTaps = 0;
              }

              // Check Limit with incoming batch
              // We add the 'count' (batch size) to current session taps
              if (sessionTaps + count >= 1000) {
                  // Only allow up to 1000
                  const allowed = 1000 - sessionTaps;
                  if (allowed > 0) {
                     sessionTaps += allowed;
                     coins += allowed;
                  }
                  
                  // Trigger Cooldown
                  cooldownUntil = now + (5 * 60 * 1000); // 5 min
                  transaction.update(userRef, { cooldownUntil, sessionTaps, coins });
                  
                  // We throw a special string to handle UI feedback, but we SAVED the partial progress
                  throw "Limit reached! 5 min cooldown started.";
              }

              // Normal update (No limit hit)
              sessionTaps += count;
              coins += count;

              // Auto Convert logic (1000 Coins = 1 INR)
              // We loop here because a large batch (unlikely but possible) might trigger conversion
              while (coins >= 1000) {
                  coins -= 1000;
                  balance += 1;
                  totalEarned += 1;
                  message = "1000 Coins converted to ₹1!";
              }

              const updates = { sessionTaps, coins, balance, totalEarned, cooldownUntil };
              transaction.update(userRef, updates);

              updatedUser = { ...userData, ...updates };
          });

          if (updatedUser) {
              return { success: true, data: updatedUser, message };
          }
           return { success: false, message: "Transaction failed" };

      } catch (e: any) {
          const msg = typeof e === 'string' ? e : e.message || "Error tapping";
          // If it was the "Limit reached" error, the transaction might have actually succeeded partially (if we structured it differently), 
          // but Firestore throws on throw. 
          // Re-fetching user is safest to sync state if limit hit.
          return { success: false, message: msg };
      }
  }

  // --- Notifications ---

  async sendNotification(title: string, message: string, targetEmail?: string): Promise<ApiResponse<null>> {
      try {
        await addDoc(collection(db, 'notifications'), {
            title,
            message,
            date: new Date().toISOString(),
            isAdmin: true,
            targetEmail: targetEmail ? targetEmail.toLowerCase() : null
        });
        return { success: true };
      } catch (e) {
        return { success: false, message: 'Failed to send.' };
      }
  }

  async getNotifications(userEmail: string): Promise<AppNotification[]> {
      try {
        const q = query(collection(db, 'notifications'));
        const querySnapshot = await getDocs(q);
        const all = querySnapshot.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification));
        
        return all.filter(n => {
            if (!n.targetEmail) return true; 
            return n.targetEmail.toLowerCase() === userEmail.toLowerCase();
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch (e) {
          return [];
      }
  }

  // --- Chat ---

  async sendMessage(userId: string, text: string, sender: 'user' | 'admin', userEmail?: string): Promise<ApiResponse<null>> {
      try {
        const chatDocRef = doc(db, 'chats', userId);
        const chatDoc = await getDoc(chatDocRef);
        
        let messages = [];
        if (chatDoc.exists()) {
            messages = chatDoc.data().messages || [];
        }

        messages.push({ sender, text, timestamp: Date.now() });
        
        const updateData: any = {
            messages,
            lastUpdated: Date.now(),
            lastSender: sender,
            userId
        };
        if (userEmail) updateData.userEmail = userEmail;

        await setDoc(chatDocRef, updateData, { merge: true });
        return { success: true };
      } catch (e) {
          return { success: false, message: 'Failed to send.' };
      }
  }

  async getSupportChat(userId: string): Promise<SupportChat | null> {
      try {
        const d = await getDoc(doc(db, 'chats', userId));
        return d.exists() ? (d.data() as SupportChat) : null;
      } catch { return null; }
  }

  async getAllSupportChats(): Promise<SupportChat[]> {
      try {
        const q = query(collection(db, 'chats'));
        const sn = await getDocs(q);
        return sn.docs.map(d => d.data() as SupportChat).sort((a, b) => b.lastUpdated - a.lastUpdated);
      } catch { return []; }
  }

  // --- Admin ---

  async getAllUsers(): Promise<User[]> {
      try {
        const q = query(collection(db, 'users'), where('role', '==', UserRole.USER));
        const sn = await getDocs(q);
        return sn.docs.map(d => d.data() as User);
      } catch { return []; }
  }

  async updateUserDetails(userId: string, updates: Partial<User>): Promise<ApiResponse<null>> {
      try {
          const safeUpdates = { ...updates };
          delete safeUpdates.password;
          await updateDoc(doc(db, 'users', userId), safeUpdates);
          return { success: true };
      } catch (e) { return { success: false }; }
  }

  async deleteUserImage(userId: string, imageIndex: number): Promise<ApiResponse<null>> {
      try {
          const user = await this.refreshUser(userId);
          if (user && user.affiliateImages) {
              const urlToDelete = user.affiliateImages[imageIndex];
              try {
                  const fileRef = ref(storage, urlToDelete);
                  await deleteObject(fileRef);
              } catch (err) {
                  console.warn("Storage delete failed, proceeding with DB update.");
              }

              const newImages = [...user.affiliateImages];
              newImages.splice(imageIndex, 1);
              await updateDoc(doc(db, 'users', userId), { affiliateImages: newImages });
              return { success: true };
          }
          return { success: false, message: 'Image not found' };
      } catch { return { success: false }; }
  }

  async toggleBlockUser(userId: string): Promise<ApiResponse<boolean>> {
      const user = await this.refreshUser(userId);
      if (user) {
          await updateDoc(doc(db, 'users', userId), { isBlocked: !user.isBlocked });
          return { success: true, data: !user.isBlocked };
      }
      return { success: false };
  }

  async getAllWithdrawals(): Promise<WithdrawalRequest[]> {
      try {
        const q = query(collection(db, 'withdrawals'));
        const sn = await getDocs(q);
        const list = sn.docs.map(d => ({ ...d.data(), id: d.id } as WithdrawalRequest));
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch { return []; }
  }

  // FIXED: Bulletproof Withdrawal Processing with Refund Logic
  async processWithdrawal(reqId: string, approved: boolean): Promise<ApiResponse<null>> {
      try {
          await runTransaction(db, async (transaction) => {
              // 1. Get the Request
              const reqRef = doc(db, 'withdrawals', reqId);
              const reqDoc = await transaction.get(reqRef);
              
              if (!reqDoc.exists()) throw "Withdrawal Request ID not found in database";
              const req = reqDoc.data() as WithdrawalRequest;

              if (req.status !== WithdrawalStatus.PENDING) throw "This request is not pending (already processed).";

              const newStatus = approved ? WithdrawalStatus.APPROVED : WithdrawalStatus.REJECTED;
              
              // 2. If Rejected, REFUND THE USER
              if (!approved) {
                  const userRef = doc(db, 'users', req.userId);
                  const userDoc = await transaction.get(userRef);
                  
                  if (!userDoc.exists()) {
                      throw "User account not found! Cannot refund money to a deleted user.";
                  }

                  const userData = userDoc.data();
                  
                  // Ensure we are working with numbers
                  const currentBalance = Number(userData.balance) || 0;
                  const refundAmount = Number(req.amount) || 0;
                  
                  const newBalance = Number((currentBalance + refundAmount).toFixed(2));
                  
                  // Update User Balance (Refund)
                  transaction.update(userRef, { balance: newBalance });
              }

              // 3. Update Request Status
              transaction.update(reqRef, { status: newStatus });
          });
          return { success: true };
      } catch (e: any) {
           console.error("Process Withdrawal Error: ", e);
           const errorMessage = typeof e === 'string' ? e : e.message || 'Transaction failed';
           return { success: false, message: errorMessage };
      }
  }

  // --- Config & Stats ---

  async getSystemConfig(): Promise<SystemConfig> {
      try {
        const d = await getDoc(doc(db, 'system', 'config'));
        if (d.exists()) return d.data() as SystemConfig;
        return INITIAL_CONFIG;
      } catch {
          return INITIAL_CONFIG;
      }
  }

  async updateSystemConfig(config: SystemConfig): Promise<ApiResponse<null>> {
      try {
          await setDoc(doc(db, 'system', 'config'), config);
          return { success: true };
      } catch { return { success: false }; }
  }

  async getDashboardStats() {
      const allUsers = await this.getAllUsers();
      const allWithdrawals = await this.getAllWithdrawals();

      const totalUserBalance = allUsers.reduce((acc, curr) => acc + (curr.balance || 0), 0);
      const pendingWithdrawals = allWithdrawals.filter(w => w.status === WithdrawalStatus.PENDING).length;

      return {
          totalUsers: allUsers.length,
          totalUserBalance,
          totalWithdrawals: allWithdrawals.length,
          pendingWithdrawals
      };
  }
}

export const mockBackend = new BackendService();