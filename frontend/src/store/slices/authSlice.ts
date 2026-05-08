import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Role = 'candidate' | 'recruiter' | 'admin';

type AuthState = {
  token: string | null;
  user: { id: string; email: string; role: Role; name: string } | null;
};

const load = (): AuthState => {
  const token = localStorage.getItem('resumate_token');
  const raw = localStorage.getItem('resumate_user');
  if (!token || !raw) return { token: null, user: null };
  try {
    return { token, user: JSON.parse(raw) };
  } catch {
    return { token: null, user: null };
  }
};

const initialState: AuthState = load();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{
        token: string;
        user: { id: string; email: string; role: Role; name: string };
      } | null>
    ) {
      if (!action.payload) {
        state.token = null;
        state.user = null;
        localStorage.removeItem('resumate_token');
        localStorage.removeItem('resumate_user');
        return;
      }
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem('resumate_token', action.payload.token);
      localStorage.setItem('resumate_user', JSON.stringify(action.payload.user));
    },
  },
});

export const { setCredentials } = authSlice.actions;
export default authSlice.reducer;
