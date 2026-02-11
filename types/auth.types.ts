// What we send to the server for Login
export interface LoginRequest {
  login_identity: string; 
  password: string;
}

// What we send to the server for Register
export interface RegisterRequest {
  name: string;     
  email: string;
  password: string;
  password_confirmation: string; 
  dob: string;   
}

// What the server sends back
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: any;
  message?: string;
  errors?: any; 
}