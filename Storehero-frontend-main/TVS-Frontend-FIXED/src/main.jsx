import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import App from './App';
import './index.css';

// #35 Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('App error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#020617',color:'#fff',fontFamily:'system-ui'}}>
          <div style={{textAlign:'center',maxWidth:400}}>
            <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
            <h1 style={{fontSize:20,fontWeight:700,marginBottom:8}}>Something went wrong</h1>
            <p style={{color:'#94a3b8',fontSize:14,marginBottom:24}}>{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
              style={{padding:'10px 24px',background:'#f1c349',color:'#000',border:'none',borderRadius:12,fontWeight:600,cursor:'pointer'}}>
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
