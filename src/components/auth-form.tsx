"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
export default function AuthForm() {
 const [mode,setMode]=useState<"signin"|"signup">("signup"),[name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[otp,setOtp]=useState(""),[verifyStep,setVerifyStep]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setError("");setMessage("");setBusy(true);try{
  if(verifyStep){const v=await authClient.emailOtp.verifyEmail({email,otp});if(v.error){setError(v.error.message||"That verification code is not valid.");}else{window.location.assign("/dashboard");}return;}
  if(mode==="signup"&&password!==confirm){setError("Passwords do not match.");return;}
  if(password.length<8){setError("Use at least 8 characters for your password.");return;}
  const r=mode==="signup"?await authClient.signUp.email({email,password,name:name.trim()}):await authClient.signIn.email({email,password});
  if(r.error)setError(r.error.message||"Authentication failed.");
  else if(mode==="signup"){setVerifyStep(true);setMessage("We sent a verification code to your email. Enter it below to activate your account.");}
  else window.location.assign("/dashboard");
 }catch{setError("Unable to complete the request. Please try again.");}finally{setBusy(false);}}
 async function resend(){setError("");setBusy(true);try{const r=await authClient.emailOtp.sendVerificationOtp({email,type:"email-verification"});if(r.error)setError(r.error.message||"Could not resend the code.");else setMessage("A new verification code has been sent.");}catch{setError("Could not resend the code.");}finally{setBusy(false);}}
 async function google(){setError("");setBusy(true);try{const r=await authClient.signIn.social({provider:"google",callbackURL:"/dashboard"});if(r.error)setError(r.error.message||"Google sign-in could not start.");}catch{setError("Google sign-in is not configured yet. Use email and password.");}finally{setBusy(false);}}
 return <section className="auth-card"><div className="eyebrow">WELCOME TO BIZFLOW</div><h1>{verifyStep?"Verify your email":mode==="signup"?"Create your workspace":"Welcome back"}</h1><p className="muted">{verifyStep?"Enter the one-time code sent to "+email:mode==="signup"?"Start with a secure account. Your business data stays private.":"Sign in to continue to your business."}</p>
 {!verifyStep&&<><button className="google-btn" onClick={google} disabled={busy}><span className="google-mark">G</span> Continue with Google</button><div className="or-divider"><span>or use email</span></div></>}
 <form onSubmit={submit} className="auth-form">{verifyStep?<label>Verification code<input inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,"").slice(0,8))} required minLength={6} maxLength={8} placeholder="Enter the code from your email"/></label>:<>
 {mode==="signup"&&<label>Your name<input value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={100} autoComplete="name" placeholder="Your full name"/></label>}
 <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required maxLength={254} autoComplete="email" placeholder="you@example.com"/></label>
 <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} autoComplete={mode==="signup"?"new-password":"current-password"} placeholder="At least 8 characters"/></label>
 {mode==="signup"&&<label>Confirm password<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="Enter your password again"/></label>}</>}
 {error&&<p className="form-error" role="alert">{error}</p>}{message&&<p className="form-success" role="status">{message}</p>}
 <button className="primary-btn full-btn" disabled={busy}>{busy?"Please wait…":verifyStep?"Verify email":mode==="signup"?"Create account":"Sign in"} <span>→</span></button></form>
 {verifyStep?<p className="switch-auth">Didn’t receive it? <button onClick={resend} disabled={busy}>Resend code</button> · <button onClick={()=>{setVerifyStep(false);setMode("signup");setError("");setMessage("");}}>Back</button></p>:<p className="switch-auth">{mode==="signup"?"Already have an account?":"New to BizFlow?"} <button onClick={()=>{setMode(mode==="signup"?"signin":"signup");setError("");setMessage("");}}>{mode==="signup"?"Sign in":"Create an account"}</button></p>}
 <p className="auth-legal">Keep your login details private and secure.</p></section>;
}