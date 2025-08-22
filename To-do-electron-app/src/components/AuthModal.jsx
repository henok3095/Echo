import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../store/index.jsx'
import { X, Eye, EyeOff, Sparkles, MailCheck, MailWarning, Zap, Heart, Star } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { auth as supaAuth } from '../api/supabase.js'

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

const signUpSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export default function AuthModal({ isOpen, onClose }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [showUnverified, setShowUnverified] = useState(false)
  const [awakeningStep, setAwakeningStep] = useState(0)

  const { signIn, signUp, isLoading, error } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema)
  })

  // Resend verification email (Supabase: signUp with same email triggers resend)
  const resendVerification = async () => {
    if (!pendingEmail) return
    const { data, error } = await supaAuth.resendVerification(pendingEmail)
    if (!error) {
      toast.success('Verification email resent!')
    } else {
      toast.error('Failed to resend verification email.')
    }
  }

  const onSubmit = async (data) => {
    if (pendingVerification) return; // Block form while verifying
    if (isSignUp) {
      const { data: signUpData, error: signUpError } = await signUp(data.email, data.password, { username: data.username })
      if (!signUpError) {
        setPendingVerification(true)
        setPendingEmail(data.email)
        setAwakeningStep(0)
        toast.success('Account created! Please check your email and verify your account before logging in.')
        reset()
        return
      } else {
        toast.error(signUpError.message)
      }
    } else {
      const { data: signInData, error: signInError } = await signIn(data.email, data.password)
      if (!signInError) {
        // Check if user is verified (Supabase v2: email_confirmed_at or confirmed_at)
        const isVerified = !!(signInData?.user?.email_confirmed_at || signInData?.user?.confirmed_at)
        if (signInData && signInData.user && !isVerified) {
          setShowUnverified(true)
          setPendingEmail(data.email)
          toast.error('Please verify your email before continuing.')
          return
        } else {
          toast.success('Welcome back!')
          reset()
          setShowUnverified(false)
          onClose()
        }
      } else {
        toast.error(signInError.message)
      }
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setPendingVerification(false)
    setShowUnverified(false)
    reset()
  }

  // New: Continue to Login after signup/verification
  const handleContinueToLogin = () => {
    setPendingVerification(false)
    setIsSignUp(false)
    // Prefill the email field to guide the user
    reset({ email: pendingEmail, password: '' })
    toast.success('If you have verified your email, enter your password to sign in.')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <Toaster position="top-center" />
      {/* Animated gradient background */}
      <div className="absolute inset-0 animate-gradient bg-gradient-to-br from-blue-500 via-fuchsia-500 to-emerald-400 opacity-70 blur-sm" />
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Glassmorphism card */}
        <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl border border-white/30 dark:border-gray-800/40 p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-block bg-gradient-to-r from-blue-500 to-fuchsia-500 bg-clip-text text-transparent text-3xl font-extrabold tracking-tight select-none">Echo</span>
              <Sparkles className="w-6 h-6 text-fuchsia-400 animate-pulse" />
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="flex flex-col items-center mb-6">
            <div className="rounded-full bg-gradient-to-tr from-blue-400 to-fuchsia-400 p-3 mb-2 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {isSignUp ? 'Create your Echo account' : 'Welcome to Echo'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {isSignUp ? 'Sign up to start your journey.' : 'Sign in to your productivity & taste tracker.'}
            </p>
          </div>

          {/* Creative verification experience */}
          {pendingVerification && (
            <AwakeningVerification 
              email={pendingEmail}
              onResendVerification={resendVerification}
              onContinueToLogin={handleContinueToLogin}
              onLoginSuccess={() => {
                toast.success('Welcome!')
                reset()
                setShowUnverified(false)
                onClose()
              }}
            />
          )}

          {/* Unverified warning after sign in */}
          {showUnverified && (
            <div className="flex flex-col items-center gap-2 mb-6">
              <MailWarning className="w-8 h-8 text-yellow-500" />
              <p className="text-yellow-700 dark:text-yellow-400 text-center font-medium">
                Please verify your email before continuing.<br />
                Didn’t get the email?
              </p>
              <button
                onClick={resendVerification}
                className="text-xs text-fuchsia-600 hover:underline mt-1"
              >
                Resend verification email
              </button>
            </div>
          )}

          {/* Hide form if pending verification or unverified */}
          {!pendingVerification && !showUnverified && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {isSignUp && (
                <div className="relative">
                  <input
                    {...register('username')}
                    type="text"
                    id="username"
                    className={`peer w-full px-3 py-2 bg-transparent border-b-2 border-gray-300 dark:border-gray-700 focus:border-fuchsia-500 dark:focus:border-fuchsia-400 outline-none text-gray-900 dark:text-white placeholder-transparent transition-all`}
                    placeholder="Username"
                    autoComplete="off"
                  />
                  <label htmlFor="username" className="absolute left-3 top-2 text-gray-500 dark:text-gray-400 text-sm pointer-events-none transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-focus:-top-4 peer-focus:text-xs peer-focus:text-fuchsia-500 dark:peer-focus:text-fuchsia-400 bg-white/80 dark:bg-gray-900/80 px-1 rounded">
                    Username
                  </label>
                  {errors.username && (
                    <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
                  )}
                </div>
              )}
              <div className="relative">
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className={`peer w-full px-3 py-2 bg-transparent border-b-2 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 outline-none text-gray-900 dark:text-white placeholder-transparent transition-all`}
                  placeholder="Email"
                  autoComplete="off"
                />
                <label htmlFor="email" className="absolute left-3 top-2 text-gray-500 dark:text-gray-400 text-sm pointer-events-none transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-focus:-top-4 peer-focus:text-xs peer-focus:text-blue-500 dark:peer-focus:text-blue-400 bg-white/80 dark:bg-gray-900/80 px-1 rounded">
                  Email
                </label>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`peer w-full px-3 py-2 bg-transparent border-b-2 border-gray-300 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 outline-none text-gray-900 dark:text-white placeholder-transparent transition-all pr-10`}
                  placeholder="Password"
                  autoComplete="off"
                />
                <label htmlFor="password" className="absolute left-3 top-2 text-gray-500 dark:text-gray-400 text-sm pointer-events-none transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-focus:-top-4 peer-focus:text-xs peer-focus:text-emerald-500 dark:peer-focus:text-emerald-400 bg-white/80 dark:bg-gray-900/80 px-1 rounded">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>
              {isSignUp && (
                <div className="relative">
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className={`peer w-full px-3 py-2 bg-transparent border-b-2 border-gray-300 dark:border-gray-700 focus:border-fuchsia-500 dark:focus:border-fuchsia-400 outline-none text-gray-900 dark:text-white placeholder-transparent transition-all pr-10`}
                    placeholder="Confirm Password"
                    autoComplete="off"
                  />
                  <label htmlFor="confirmPassword" className="absolute left-3 top-2 text-gray-500 dark:text-gray-400 text-sm pointer-events-none transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-focus:-top-4 peer-focus:text-xs peer-focus:text-fuchsia-500 dark:peer-focus:text-fuchsia-400 bg-white/80 dark:bg-gray-900/80 px-1 rounded">
                    Confirm Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              )}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 via-fuchsia-500 to-emerald-400 hover:from-fuchsia-500 hover:to-blue-500 focus:ring-2 focus:ring-fuchsia-400 text-white font-semibold py-2.5 rounded-xl shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-60"
              >
                {isLoading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </form>
          )}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={toggleMode}
                className="ml-1 text-fuchsia-600 dark:text-fuchsia-400 font-semibold underline-animation relative"
                style={{ overflow: 'hidden' }}
              >
                <span className="relative z-10">{isSignUp ? 'Sign In' : 'Sign Up'}</span>
                <span className="absolute left-0 bottom-0 w-full h-0.5 bg-fuchsia-400 transition-all duration-300 scale-x-0 group-hover:scale-x-100" />
              </button>
            </p>
          </div>
          <div className="mt-8 flex flex-col items-center gap-1">
            <span className="text-xs text-gray-400">Powered by</span>
            <span className="flex items-center gap-1 text-xs text-fuchsia-500 font-semibold">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" rx="16" fill="#3ECF8E"/><path d="M23.09 10.59c-.2-.2-.51-.2-.71 0l-7.79 7.79c-.2.2-.2.51 0 .71.1.1.23.15.35.15s.26-.05.35-.15l7.79-7.79c.2-.2.2-.51 0-.71z" fill="#fff"/><path d="M16.5 21.5c-.13 0-.26-.05-.35-.15l-7.79-7.79c-.2-.2-.2-.51 0-.71.2-.2.51-.2.71 0l7.79 7.79c.2.2.2.51 0 .71-.1.1-.23.15-.35.15z" fill="#fff"/></svg>
              Supabase
            </span>
          </div>
        </div>
      </div>
      <style>{`
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientMove 6s ease-in-out infinite;
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .underline-animation span.relative.z-10 {
          position: relative;
        }
        .underline-animation:hover span.absolute {
          transform: scaleX(1);
        }
        .underline-animation span.absolute {
          transform: scaleX(0);
          transform-origin: left;
        }
      `}</style>
    </div>
  )
}

// Creative Awakening Verification Component
function AwakeningVerification({ email, onResendVerification, onContinueToLogin, onLoginSuccess }) {
  const [step, setStep] = useState(0)
  const [pulseCount, setPulseCount] = useState(0)
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const { signIn, isLoading } = useAuthStore()
  const [autoChecking, setAutoChecking] = useState(false)
  const [autoTries, setAutoTries] = useState(0)
  const triesRef = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (step < 3) {
        setStep(step + 1)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [step])

  // Auto-check loop: retry sign-in every 5s up to 12 tries (1 minute)
  useEffect(() => {
    if (!autoChecking) return
    let cancelled = false
    triesRef.current = 0

    const attempt = async () => {
      if (cancelled) return
      setAutoTries((prev) => prev + 1)
      triesRef.current += 1
      const { data: signInData, error: signInError } = await signIn(email, loginPassword)
      if (!signInError) {
        const isVerified = !!(signInData?.user?.email_confirmed_at || signInData?.user?.confirmed_at)
        if (isVerified) {
          toast.success('Your account is verified')
          onLoginSuccess && onLoginSuccess()
          return
        }
      }
      if (triesRef.current >= 12) {
        setAutoChecking(false)
        setLoginError('Still not verified. Please click the link in your inbox or resend, then try again.')
        return
      }
      setTimeout(attempt, 5000)
    }

    const startTimer = setTimeout(attempt, 0)
    return () => {
      cancelled = true
      clearTimeout(startTimer)
    }
  }, [autoChecking, email, loginPassword, signIn, onLoginSuccess])

  useEffect(() => {
    const pulseTimer = setInterval(() => {
      setPulseCount(prev => prev + 1)
    }, 800)

    return () => clearInterval(pulseTimer)
  }, [])

  const steps = [
    {
      icon: <Sparkles className="w-10 h-10 text-blue-400" />,
      title: "Your Echo is Awakening...",
      description: "We're preparing your digital sanctuary"
    },
    {
      icon: <Zap className="w-10 h-10 text-fuchsia-400" />,
      title: "Charging Your Powers...",
      description: "Setting up your productivity superpowers"
    },
    {
      icon: <Heart className="w-10 h-10 text-emerald-400" />,
      title: "Personalizing Your Space...",
      description: "Tailoring Echo to your unique style"
    },
    {
      icon: <Star className="w-10 h-10 text-yellow-400" />,
      title: "Almost Ready!",
      description: "Just one final step to complete the magic"
    }
  ]

  const currentStep = steps[step] || steps[3]

  return (
    <div className="flex flex-col items-center gap-6 mb-6 py-4">
      {/* Animated Icon with Pulsing Effect */}
      <div className="relative">
        <div 
          className={`rounded-full bg-gradient-to-tr from-blue-400 via-fuchsia-400 to-emerald-400 p-4 shadow-lg transition-all duration-1000 ${
            pulseCount % 2 === 0 ? 'scale-110' : 'scale-100'
          }`}
          style={{
            boxShadow: `0 0 ${20 + (pulseCount % 2) * 10}px rgba(168, 85, 247, 0.4)`
          }}
        >
          {currentStep.icon}
        </div>
        {/* Floating particles */}
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
        <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
        <div className="absolute -top-2 -left-2 w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
      </div>

      {/* Progress Steps */}
      <div className="flex gap-2 mb-2">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all duration-500 ${
              index <= step 
                ? 'w-8 bg-gradient-to-r from-blue-400 to-fuchsia-400' 
                : 'w-4 bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Dynamic Content */}
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-extrabold text-fuchsia-600 dark:text-fuchsia-400">
          {step >= 3 ? 'Verify Your Email to Activate Your Account' : currentStep.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-base max-w-xs">
          {step >= 3
            ? `We've sent a special activation link to your email: `
            : currentStep.description}
        </p>
        {step >= 3 && (
          <>
            <p className="text-blue-700 dark:text-blue-300 font-semibold text-base mb-2">
              <MailCheck className="inline w-5 h-5 mr-1 align-text-bottom" />
              <span className="font-bold">{email}</span>
            </p>
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
              Please check your inbox and click the verification link to unlock all features.<br />
              <span className="font-bold">Didn’t get it?</span> Check your spam folder or resend below.
            </p>
            {/* Quick sign-in check after verification */}
            <div className="flex flex-col items-stretch gap-2 w-full max-w-xs mx-auto">
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password to sign in"
                className="w-full px-3 py-2 bg-transparent border-b-2 border-gray-300 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
              />
              {loginError && (
                <p className="text-red-500 text-xs text-center">{loginError}</p>
              )}
              <button
                onClick={async () => {
                  setLoginError('')
                  if (!email || !loginPassword) {
                    setLoginError('Please enter your password to continue')
                    return
                  }
                  const { data: signInData, error: signInError } = await signIn(email, loginPassword)
                  if (signInError) {
                    setLoginError(signInError?.message || String(signInError))
                    return
                  }
                  const isVerified = !!(signInData?.user?.email_confirmed_at || signInData?.user?.confirmed_at)
                  if (!isVerified) {
                    setLoginError('Email not verified yet. Please click the link in your inbox, then try again.')
                    return
                  }
                  toast.success('Your account is verified')
                  onLoginSuccess && onLoginSuccess()
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow disabled:opacity-60"
              >
                {isLoading ? 'Signing in...' : "I've verified, Sign me in"}
              </button>
              <button
                onClick={() => {
                  if (!loginPassword) {
                    setLoginError('Enter your password, then start auto-check')
                    return
                  }
                  setLoginError('')
                  setAutoChecking(true)
                  setAutoTries(0)
                  toast('Auto-check started. We will sign you in once verification completes.')
                }}
                className="text-xs text-blue-600 dark:text-blue-300 hover:underline"
              >
                {autoChecking ? `Auto-checking... (${autoTries})` : 'Start auto-check' }
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={onContinueToLogin}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 via-fuchsia-500 to-emerald-400 text-white font-semibold rounded-lg shadow hover:from-fuchsia-500 hover:to-blue-500 transition-all text-base"
              >
                Continue to Login
              </button>
              <button
                onClick={onResendVerification}
                className="text-xs text-fuchsia-600 hover:underline"
              >
                Resend Magic Link
              </button>
            </div>
          </>
        )}
        {step < 3 && (
          <p className="text-xs text-gray-400 mt-2">Please wait...</p>
        )}
        {step >= 3 && (
          <p className="text-xs text-gray-400 mt-2">
            If you haven't received the verification email, please check your spam folder or try resending the link.
          </p>
        )}
      </div>
    </div>
  )
}